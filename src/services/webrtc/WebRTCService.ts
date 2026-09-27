import type { 
  ConnectionState, 
  DataChannelMessage, 
  DeviceInfo, 
  FileMetadata, 
  FileOfferPayload,
  SignalingMessage, 
  TextMessagePayload, 
  TransferItemStatus, 
  TransferProposalPayload,
  TransferSession
} from '../../types';
import { 
  DEFAULT_CHUNK_SIZE, 
  DEFAULT_ICE_SERVERS, 
  HIGH_WATER_MARK, 
  LOW_WATER_MARK 
} from '../../constants';
import { signalingService } from '../signaling';
import { encodeChunkPacket, decodeChunkPacket } from '../../utils/packet';

export type WebRTCEventCallback = {
  onConnectionStateChange: (state: ConnectionState, peerDevice?: DeviceInfo) => void;
  onTransferCreated: (session: TransferSession) => void;
  onTransferProgress: (session: TransferSession) => void;
  onTransferComplete: (session: TransferSession) => void;
  onTransferError: (transferId: string, error: string) => void;
  onTextMessage: (message: TextMessagePayload) => void;
  onPeerLatency: (latencyMs: number) => void;
  onIncomingProposal?: (proposal: TransferProposalPayload) => void; // Legacy compatibility
};

interface OutgoingFileState {
  id: string;
  file: File;
  metadata: FileMetadata;
  chunkSize: number;
  totalChunks: number;
  currentChunkIndex: number;
  offset: number;
  status: TransferItemStatus;
  bytesTransferred: number;
  cancelled: boolean;
  paused: boolean;
  startTime: number;
  lastCalcTime: number;
  lastCalcBytes: number;
  currentSpeedBps: number;
  error?: string;
}

interface IncomingFileState {
  id: string;
  metadata: FileMetadata;
  senderDevice: DeviceInfo;
  status: TransferItemStatus;
  receivedBytes: number;
  chunks: Uint8Array[];
  totalChunks: number;
  chunkSize: number;
  startTime: number;
  lastCalcTime: number;
  lastCalcBytes: number;
  currentSpeedBps: number;
  cancelled: boolean;
  blob?: Blob;
  downloadUrl?: string;
  error?: string;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localDevice: DeviceInfo | null = null;
  private remoteDevice: DeviceInfo | null = null;
  private currentRoomId: string | null = null;
  private isInitiator = false;
  private unsubscribeSignaling: (() => void) | null = null;
  private callbacks: Partial<WebRTCEventCallback> = {};

  // ICE candidate queue while remoteDescription is null
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

  // Multi-transfer state maps
  private outgoingTransfers = new Map<string, OutgoingFileState>();
  private incomingTransfers = new Map<string, IncomingFileState>();
  private isSendLoopRunning = false;

  // Ping interval
  private pingInterval: number | null = null;
  private lastPingSent = 0;

  constructor() {
    this.handleSignalingMessage = this.handleSignalingMessage.bind(this);
  }

  setCallbacks(callbacks: Partial<WebRTCEventCallback>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getRemoteDevice(): DeviceInfo | null {
    return this.remoteDevice;
  }

  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open';
  }

  async init(device: DeviceInfo): Promise<void> {
    this.localDevice = device;
    if (this.unsubscribeSignaling) {
      this.unsubscribeSignaling();
    }
    this.unsubscribeSignaling = signalingService.onMessage(this.handleSignalingMessage);
  }

  async createRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.init(deviceInfo);
    this.currentRoomId = roomId;
    this.isInitiator = true;
    this.callbacks.onConnectionStateChange?.('waiting_for_peer');
    await signalingService.createRoom(roomId, deviceInfo);
  }

  async joinRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.init(deviceInfo);
    this.currentRoomId = roomId;
    this.isInitiator = false;
    this.callbacks.onConnectionStateChange?.('joining_room');
    await signalingService.joinRoom(roomId, deviceInfo);
  }

  private setupPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onicecandidate = null;
      this.cleanupPeerConnection();
    }

    const pc = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomId) {
        const candidateJson = event.candidate.toJSON();
        if (candidateJson.candidate) {
          signalingService.sendIceCandidate(this.currentRoomId, candidateJson, this.remoteDevice?.id);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          break;
        case 'failed':
          if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            this.callbacks.onConnectionStateChange?.('disconnected', this.remoteDevice || undefined);
          }
          break;
        case 'closed':
          this.callbacks.onConnectionStateChange?.('idle');
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'failed' &&
        this.dataChannel?.readyState === 'open'
      ) {
        this.callbacks.onConnectionStateChange?.('reconnecting', this.remoteDevice || undefined);
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    this.dataChannel.binaryType = 'arraybuffer';
    this.dataChannel.bufferedAmountLowThreshold = LOW_WATER_MARK;

    channel.onopen = () => {
      this.callbacks.onConnectionStateChange?.('connected', this.remoteDevice || undefined);
      this.startPingPong();

      // Handshake to exchange device metadata
      if (this.localDevice) {
        this.sendControlMessage({
          type: 'HANDSHAKE',
          payload: { device: this.localDevice },
        });
      }

      // Resume any queued outgoing transfers
      this.ensureSendLoop();
    };

    channel.onclose = () => {
      this.stopPingPong();
      this.callbacks.onConnectionStateChange?.('disconnected', this.remoteDevice || undefined);
    };

    channel.onerror = (err) => {
      console.warn('WebRTC DataChannel error:', err);
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg: DataChannelMessage = JSON.parse(event.data);
          this.handleControlMessage(msg);
        } catch (e) {
          console.error('Failed to parse text message:', e);
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.handleBinaryChunk(event.data);
      }
    };
  }

  private async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
    if (!this.currentRoomId || msg.roomId !== this.currentRoomId) return;

    switch (msg.type) {
      case 'ROOM_JOINED':
      case 'ROOM_CREATED':
        if (msg.senderDevice) {
          this.remoteDevice = msg.senderDevice;
        }

        if (this.isInitiator && msg.type === 'ROOM_JOINED') {
          if (
            this.peerConnection &&
            (this.peerConnection.connectionState === 'connected' ||
              this.peerConnection.signalingState === 'have-local-offer')
          ) {
            return;
          }
          this.callbacks.onConnectionStateChange?.('connecting', this.remoteDevice || undefined);
          await this.startOfferFlow();
        }
        break;

      case 'OFFER':
        if (msg.senderDevice) {
          this.remoteDevice = msg.senderDevice;
        }
        if (!this.isInitiator && msg.payload?.offer) {
          if (
            this.peerConnection &&
            this.peerConnection.connectionState === 'connected'
          ) {
            return;
          }
          this.callbacks.onConnectionStateChange?.('connecting', this.remoteDevice || undefined);
          await this.handleOffer(msg.payload.offer);
        }
        break;

      case 'ANSWER':
        if (msg.payload?.answer && this.peerConnection) {
          if (this.peerConnection.signalingState === 'have-local-offer') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.payload.answer));
            await this.flushIceCandidateQueue();
          }
        }
        break;

      case 'ICE_CANDIDATE':
        if (msg.payload?.candidate) {
          const candInit = msg.payload.candidate;
          if (!candInit.candidate) break;
          if (this.peerConnection && this.peerConnection.remoteDescription) {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candInit)).catch((err) => {
              console.warn('Could not add ICE candidate:', err);
            });
          } else {
            this.iceCandidateQueue.push(candInit);
          }
        }
        break;

      case 'PEER_LEFT':
        // Only mark disconnected if DataChannel is NOT established
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
          this.callbacks.onConnectionStateChange?.('disconnected', this.remoteDevice || undefined);
          this.remoteDevice = null;
        }
        break;
    }
  }

  private async startOfferFlow(): Promise<void> {
    const pc = this.setupPeerConnection();
    const dc = pc.createDataChannel('quickdrop_transfer', {
      ordered: true,
    });
    this.setupDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (this.currentRoomId) {
      signalingService.sendOffer(this.currentRoomId, offer, this.remoteDevice?.id);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.setupPeerConnection();

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushIceCandidateQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.currentRoomId) {
      signalingService.sendAnswer(this.currentRoomId, answer, this.remoteDevice?.id);
    }
  }

  private async flushIceCandidateQueue(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    const candidates = [...this.iceCandidateQueue];
    this.iceCandidateQueue = [];
    for (const cand of candidates) {
      if (cand && cand.candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('flushIceCandidateQueue error:', e);
        }
      }
    }
  }

  // --- Control Messages ---

  private sendControlMessage(message: DataChannelMessage): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }
    try {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (e) {
      console.warn('Failed to send control message:', e);
      return false;
    }
  }

  private handleControlMessage(msg: DataChannelMessage): void {
    switch (msg.type) {
      case 'HANDSHAKE':
        if (msg.payload?.device) {
          this.remoteDevice = msg.payload.device;
          this.callbacks.onConnectionStateChange?.('connected', this.remoteDevice || undefined);
          this.sendControlMessage({
            type: 'HANDSHAKE_ACK',
            payload: { device: this.localDevice },
          });
        }
        break;

      case 'HANDSHAKE_ACK':
        if (msg.payload?.device) {
          this.remoteDevice = msg.payload.device;
          this.callbacks.onConnectionStateChange?.('connected', this.remoteDevice || undefined);
        }
        break;

      case 'FILE_OFFER':
      case 'TRANSFER_PROPOSAL':
        this.handleIncomingFileOffer(msg.payload as FileOfferPayload);
        break;

      case 'FILE_ACCEPT':
      case 'TRANSFER_ACCEPT':
        if (msg.transferId || msg.payload?.transferId) {
          const tId = msg.transferId || msg.payload?.transferId;
          this.handleFileAccepted(tId);
        }
        break;

      case 'FILE_REJECT':
      case 'TRANSFER_REJECT':
        if (msg.transferId || msg.payload?.transferId) {
          const tId = msg.transferId || msg.payload?.transferId;
          this.handleFileRejected(tId);
        }
        break;

      case 'FILE_COMPLETE':
        if (msg.transferId || msg.payload?.transferId) {
          const tId = msg.transferId || msg.payload?.transferId;
          this.handleFileCompletedBySender(tId);
        }
        break;

      case 'FILE_CANCEL':
        if (msg.transferId || msg.payload?.transferId) {
          const tId = msg.transferId || msg.payload?.transferId;
          this.handleFileCancelledByPeer(tId);
        }
        break;

      case 'TRANSFER_ERROR':
        if (msg.transferId && msg.payload?.error) {
          this.handleTransferError(msg.transferId, msg.payload.error);
        }
        break;

      case 'TEXT_MESSAGE':
        if (msg.payload) {
          this.callbacks.onTextMessage?.(msg.payload as TextMessagePayload);
        }
        break;

      case 'PING':
        this.sendControlMessage({ type: 'PONG', payload: msg.payload });
        break;

      case 'PONG':
        if (this.lastPingSent > 0) {
          const latency = Date.now() - this.lastPingSent;
          this.callbacks.onPeerLatency?.(latency);
        }
        break;
    }
  }

  // --- Keepalive Ping/Pong ---

  private startPingPong(): void {
    this.stopPingPong();
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.lastPingSent = Date.now();
        this.sendControlMessage({ type: 'PING', payload: { time: this.lastPingSent } });
      }
    }, 5000);
  }

  private stopPingPong(): void {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // --- Text Messaging ---

  sendTextMessage(text: string): boolean {
    if (!this.isConnected() || !this.localDevice) return false;
    const payload: TextMessagePayload = {
      id: `txt_${Date.now()}`,
      text,
      senderName: this.localDevice.name,
      timestamp: Date.now(),
    };
    return this.sendControlMessage({
      type: 'TEXT_MESSAGE',
      payload,
    });
  }

  // --- Outgoing File Transfer Initiation ---

  proposeTransfer(files: File[], metadataList: FileMetadata[]): string[] {
    return this.startTransfer(files, metadataList);
  }

  startTransfer(files: File[], metadataList: FileMetadata[]): string[] {
    if (!this.isConnected() || !this.localDevice) {
      throw new Error('Not connected to a peer');
    }

    const createdIds: string[] = [];

    files.forEach((file, index) => {
      const meta = metadataList[index] || {
        id: `f_${Date.now()}_${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      const transferId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const chunkSize = DEFAULT_CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);

      const outgoing: OutgoingFileState = {
        id: transferId,
        file,
        metadata: meta,
        chunkSize,
        totalChunks,
        currentChunkIndex: 0,
        offset: 0,
        status: 'awaiting-approval',
        bytesTransferred: 0,
        cancelled: false,
        paused: false,
        startTime: Date.now(),
        lastCalcTime: Date.now(),
        lastCalcBytes: 0,
        currentSpeedBps: 0,
      };

      this.outgoingTransfers.set(transferId, outgoing);
      createdIds.push(transferId);

      const session: TransferSession = {
        id: transferId,
        direction: 'outgoing',
        filename: meta.name,
        mimeType: meta.type,
        size: meta.size,
        status: 'awaiting-approval',
        progress: 0,
        bytesTransferred: 0,
        speed: 0,
        createdAt: Date.now(),
        senderPeerId: this.localDevice!.id,
        senderDeviceName: this.localDevice!.name,
        receiverPeerId: this.remoteDevice?.id || '',
        receiverDeviceName: this.remoteDevice?.name || 'Peer Device',
      };

      this.callbacks.onTransferCreated?.(session);

      // Send offer to peer
      this.sendControlMessage({
        type: 'FILE_OFFER',
        transferId,
        payload: {
          transferId,
          senderDevice: this.localDevice,
          files: [meta],
          totalBytes: meta.size,
        } as FileOfferPayload,
      });
    });

    return createdIds;
  }

  // --- Incoming Offer Handling ---

  private handleIncomingFileOffer(offer: FileOfferPayload): void {
    if (!offer || !offer.transferId || !offer.files || offer.files.length === 0) return;

    const fileMeta = offer.files[0];
    const transferId = offer.transferId;
    const chunkSize = DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(fileMeta.size / chunkSize);

    const incoming: IncomingFileState = {
      id: transferId,
      metadata: fileMeta,
      senderDevice: offer.senderDevice,
      status: 'awaiting-approval',
      receivedBytes: 0,
      chunks: [],
      totalChunks,
      chunkSize,
      startTime: Date.now(),
      lastCalcTime: Date.now(),
      lastCalcBytes: 0,
      currentSpeedBps: 0,
      cancelled: false,
    };

    this.incomingTransfers.set(transferId, incoming);

    const session: TransferSession = {
      id: transferId,
      direction: 'incoming',
      filename: fileMeta.name,
      mimeType: fileMeta.type,
      size: fileMeta.size,
      status: 'awaiting-approval',
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      createdAt: Date.now(),
      senderPeerId: offer.senderDevice.id,
      senderDeviceName: offer.senderDevice.name,
      receiverPeerId: this.localDevice?.id || '',
      receiverDeviceName: this.localDevice?.name || 'Local Device',
    };

    this.callbacks.onTransferCreated?.(session);
    this.callbacks.onIncomingProposal?.(offer);
  }

  acceptIncomingTransfer(transferId: string): void {
    const incoming = this.incomingTransfers.get(transferId);
    if (!incoming || incoming.status !== 'awaiting-approval') return;

    incoming.status = 'transferring';
    incoming.startTime = Date.now();
    incoming.lastCalcTime = Date.now();

    this.sendControlMessage({
      type: 'FILE_ACCEPT',
      transferId,
    });

    this.emitIncomingProgress(incoming);
  }

  rejectIncomingTransfer(transferId: string): void {
    const incoming = this.incomingTransfers.get(transferId);
    if (!incoming) return;

    incoming.status = 'rejected';

    this.sendControlMessage({
      type: 'FILE_REJECT',
      transferId,
    });

    const session = this.buildIncomingSession(incoming);
    this.callbacks.onTransferProgress?.(session);
  }

  private handleFileAccepted(transferId: string): void {
    const outgoing = this.outgoingTransfers.get(transferId);
    if (!outgoing) return;

    outgoing.status = 'transferring';
    outgoing.startTime = Date.now();
    outgoing.lastCalcTime = Date.now();

    this.emitOutgoingProgress(outgoing);
    this.ensureSendLoop();
  }

  private handleFileRejected(transferId: string): void {
    const outgoing = this.outgoingTransfers.get(transferId);
    if (!outgoing) return;

    outgoing.status = 'rejected';
    outgoing.error = 'Transfer rejected by receiver';

    const session = this.buildOutgoingSession(outgoing);
    this.callbacks.onTransferProgress?.(session);
    this.callbacks.onTransferError?.(transferId, 'Transfer rejected by peer');
  }

  // --- Chunk Streaming with Backpressure & Fairness ---

  private ensureSendLoop(): void {
    if (!this.isSendLoopRunning) {
      this.sendLoop().catch(console.error);
    }
  }

  private async sendLoop(): Promise<void> {
    if (this.isSendLoopRunning) return;
    this.isSendLoopRunning = true;

    try {
      while (this.isConnected()) {
        // Collect all active outgoing transfers
        const activeIds = Array.from(this.outgoingTransfers.keys()).filter((id) => {
          const t = this.outgoingTransfers.get(id);
          return (
            t &&
            t.status === 'transferring' &&
            !t.cancelled &&
            !t.paused &&
            t.offset < t.file.size
          );
        });

        if (activeIds.length === 0) break;

        // Respect WebRTC buffer backpressure
        if (this.dataChannel && this.dataChannel.bufferedAmount > HIGH_WATER_MARK) {
          await this.waitForBufferLow();
        }

        // Fair round-robin: Send 1 chunk from each active transfer per iteration
        for (const id of activeIds) {
          const transfer = this.outgoingTransfers.get(id);
          if (
            !transfer ||
            transfer.status !== 'transferring' ||
            transfer.cancelled ||
            transfer.paused ||
            transfer.offset >= transfer.file.size
          ) {
            continue;
          }

          if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            break;
          }

          // Slice and encode binary packet
          const slice = transfer.file.slice(transfer.offset, transfer.offset + transfer.chunkSize);
          const chunkBuf = await slice.arrayBuffer();

          const packet = encodeChunkPacket(transfer.id, transfer.currentChunkIndex, chunkBuf);
          try {
            this.dataChannel.send(packet);
          } catch (err) {
            console.warn('DataChannel send error:', err);
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
              break;
            }
            await new Promise((r) => setTimeout(r, 50));
            continue;
          }

          transfer.offset += chunkBuf.byteLength;
          transfer.bytesTransferred += chunkBuf.byteLength;
          transfer.currentChunkIndex++;

          this.calculateOutgoingSpeed(transfer);
          this.emitOutgoingProgress(transfer);

          // Check if file fully transferred
          if (transfer.offset >= transfer.file.size) {
            transfer.status = 'completed';
            this.sendControlMessage({
              type: 'FILE_COMPLETE',
              transferId: transfer.id,
            });

            const session = this.buildOutgoingSession(transfer);
            this.callbacks.onTransferComplete?.(session);
          }

          // Micro backpressure check
          if (this.dataChannel && this.dataChannel.bufferedAmount > HIGH_WATER_MARK) {
            await this.waitForBufferLow();
          }
        }

        // Yield to event loop
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      this.isSendLoopRunning = false;
    }
  }

  private waitForBufferLow(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.dataChannel || this.dataChannel.bufferedAmount <= LOW_WATER_MARK) {
        return resolve();
      }

      const handler = () => {
        if (this.dataChannel) {
          this.dataChannel.removeEventListener('bufferedamountlow', handler);
        }
        resolve();
      };

      this.dataChannel.addEventListener('bufferedamountlow', handler);
    });
  }

  // --- Receiving Chunks ---

  private handleBinaryChunk(buffer: ArrayBuffer): void {
    const packet = decodeChunkPacket(buffer);
    if (!packet) return;

    const { transferId, chunkIndex, data } = packet;
    const incoming = this.incomingTransfers.get(transferId);
    if (!incoming || incoming.cancelled || incoming.status === 'completed') return;

    if (incoming.status === 'awaiting-approval') {
      incoming.status = 'transferring';
    }

    incoming.chunks[chunkIndex] = data;
    incoming.receivedBytes += data.byteLength;

    this.calculateIncomingSpeed(incoming);
    this.emitIncomingProgress(incoming);
  }

  private handleFileCompletedBySender(transferId: string): void {
    const incoming = this.incomingTransfers.get(transferId);
    if (!incoming || incoming.cancelled) return;

    incoming.status = 'completed';

    // Assemble file Blob
    const blob = new Blob(incoming.chunks as BlobPart[], {
      type: incoming.metadata.type || 'application/octet-stream',
    });
    incoming.blob = blob;
    incoming.downloadUrl = URL.createObjectURL(blob);
    // Free chunks memory
    incoming.chunks = [];

    const session = this.buildIncomingSession(incoming);
    this.callbacks.onTransferComplete?.(session);
  }

  // --- Cancellation ---

  cancelTransfer(transferId: string): void {
    // Check outgoing
    const outgoing = this.outgoingTransfers.get(transferId);
    if (outgoing) {
      outgoing.cancelled = true;
      outgoing.status = 'cancelled';
      this.sendControlMessage({
        type: 'FILE_CANCEL',
        transferId,
      });
      const session = this.buildOutgoingSession(outgoing);
      this.callbacks.onTransferProgress?.(session);
      return;
    }

    // Check incoming
    const incoming = this.incomingTransfers.get(transferId);
    if (incoming) {
      incoming.cancelled = true;
      incoming.status = 'cancelled';
      incoming.chunks = [];
      this.sendControlMessage({
        type: 'FILE_CANCEL',
        transferId,
      });
      const session = this.buildIncomingSession(incoming);
      this.callbacks.onTransferProgress?.(session);
    }
  }

  private handleFileCancelledByPeer(transferId: string): void {
    const outgoing = this.outgoingTransfers.get(transferId);
    if (outgoing) {
      outgoing.cancelled = true;
      outgoing.status = 'cancelled';
      outgoing.error = 'Cancelled by peer';
      const session = this.buildOutgoingSession(outgoing);
      this.callbacks.onTransferProgress?.(session);
      return;
    }

    const incoming = this.incomingTransfers.get(transferId);
    if (incoming) {
      incoming.cancelled = true;
      incoming.status = 'cancelled';
      incoming.error = 'Cancelled by peer';
      incoming.chunks = [];
      const session = this.buildIncomingSession(incoming);
      this.callbacks.onTransferProgress?.(session);
    }
  }

  private handleTransferError(transferId: string, error: string): void {
    const outgoing = this.outgoingTransfers.get(transferId);
    if (outgoing) {
      outgoing.status = 'failed';
      outgoing.error = error;
      const session = this.buildOutgoingSession(outgoing);
      this.callbacks.onTransferProgress?.(session);
    }

    const incoming = this.incomingTransfers.get(transferId);
    if (incoming) {
      incoming.status = 'failed';
      incoming.error = error;
      const session = this.buildIncomingSession(incoming);
      this.callbacks.onTransferProgress?.(session);
    }

    this.callbacks.onTransferError?.(transferId, error);
  }

  // --- Speed & Progress Helpers ---

  private calculateOutgoingSpeed(t: OutgoingFileState): void {
    const now = Date.now();
    const elapsed = (now - t.lastCalcTime) / 1000;
    if (elapsed >= 0.5) {
      const bytes = t.bytesTransferred - t.lastCalcBytes;
      t.currentSpeedBps = Math.round(bytes / elapsed);
      t.lastCalcTime = now;
      t.lastCalcBytes = t.bytesTransferred;
    }
  }

  private calculateIncomingSpeed(t: IncomingFileState): void {
    const now = Date.now();
    const elapsed = (now - t.lastCalcTime) / 1000;
    if (elapsed >= 0.5) {
      const bytes = t.receivedBytes - t.lastCalcBytes;
      t.currentSpeedBps = Math.round(bytes / elapsed);
      t.lastCalcTime = now;
      t.lastCalcBytes = t.receivedBytes;
    }
  }

  private buildOutgoingSession(t: OutgoingFileState): TransferSession {
    const total = t.file.size || 1;
    const progress = Math.min(100, Math.round((t.bytesTransferred / total) * 100));

    return {
      id: t.id,
      direction: 'outgoing',
      filename: t.metadata.name,
      mimeType: t.metadata.type,
      size: t.file.size,
      status: t.status,
      progress,
      bytesTransferred: t.bytesTransferred,
      speed: t.currentSpeedBps,
      createdAt: t.startTime,
      senderPeerId: this.localDevice?.id || '',
      senderDeviceName: this.localDevice?.name || 'Local Device',
      receiverPeerId: this.remoteDevice?.id || '',
      receiverDeviceName: this.remoteDevice?.name || 'Peer Device',
      error: t.error,
    };
  }

  private buildIncomingSession(t: IncomingFileState): TransferSession {
    const total = t.metadata.size || 1;
    const progress = Math.min(100, Math.round((t.receivedBytes / total) * 100));

    return {
      id: t.id,
      direction: 'incoming',
      filename: t.metadata.name,
      mimeType: t.metadata.type,
      size: t.metadata.size,
      status: t.status,
      progress,
      bytesTransferred: t.receivedBytes,
      speed: t.currentSpeedBps,
      createdAt: t.startTime,
      senderPeerId: t.senderDevice.id,
      senderDeviceName: t.senderDevice.name,
      receiverPeerId: this.localDevice?.id || '',
      receiverDeviceName: this.localDevice?.name || 'Local Device',
      blob: t.blob,
      downloadUrl: t.downloadUrl,
      error: t.error,
    };
  }

  private emitOutgoingProgress(t: OutgoingFileState): void {
    const session = this.buildOutgoingSession(t);
    this.callbacks.onTransferProgress?.(session);
  }

  private emitIncomingProgress(t: IncomingFileState): void {
    const session = this.buildIncomingSession(t);
    this.callbacks.onTransferProgress?.(session);
  }

  // --- Disconnection & Teardown ---

  disconnect(): void {
    this.stopPingPong();
    if (this.currentRoomId) {
      signalingService.leaveRoom(this.currentRoomId);
      this.currentRoomId = null;
    }
    this.cleanupPeerConnection();
    this.callbacks.onConnectionStateChange?.('idle');
  }

  private cleanupPeerConnection(): void {
    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onclose = null;
      this.dataChannel.onerror = null;
      this.dataChannel.onmessage = null;
      try {
        this.dataChannel.close();
      } catch {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.ondatachannel = null;
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }

    this.iceCandidateQueue = [];
    this.outgoingTransfers.clear();
    this.incomingTransfers.clear();
    this.isSendLoopRunning = false;
  }
}

export const webrtcService = new WebRTCService();
