import type { 
  ConnectionState, 
  DataChannelMessage, 
  DeviceInfo, 
  FileHeaderPayload, 
  FileMetadata, 
  SignalingMessage, 
  TextMessagePayload, 
  TransferProgressState, 
  TransferProposalPayload,
  TransferStatus 
} from '../../types';
import { 
  DEFAULT_CHUNK_SIZE, 
  DEFAULT_ICE_SERVERS, 
  HIGH_WATER_MARK, 
  LOW_WATER_MARK 
} from '../../constants';
import { signalingService } from '../signaling';

export type WebRTCEventCallback = {
  onConnectionStateChange: (state: ConnectionState, peerDevice?: DeviceInfo) => void;
  onIncomingProposal: (proposal: TransferProposalPayload) => void;
  onTransferProgress: (progress: TransferProgressState) => void;
  onTransferComplete: (transferId: string, receivedFiles: Array<{ metadata: FileMetadata; blob: Blob }>) => void;
  onTransferError: (error: string) => void;
  onTextMessage: (message: TextMessagePayload) => void;
  onPeerLatency: (latencyMs: number) => void;
};

interface ActiveTransferFile extends FileMetadata {
  fileObj?: File;
  blob?: Blob;
  receivedBytes?: number;
  chunks?: Uint8Array[];
  status: TransferStatus;
  progress: number;
  downloadUrl?: string;
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

  // ICE candidates queue while remoteDescription is null
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

  // Transfer state
  private activeTransfer: {
    id: string;
    direction: 'send' | 'receive';
    files: ActiveTransferFile[];
    currentFileIndex: number;
    totalBytes: number;
    bytesTransferred: number;
    startTime: number;
    lastCalcTime: number;
    lastCalcBytes: number;
    currentSpeedBps: number;
    cancelled: boolean;
  } | null = null;

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
      this.cleanupPeerConnection();
    }

    const pc = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomId) {
        signalingService.sendIceCandidate(this.currentRoomId, event.candidate.toJSON(), this.remoteDevice?.id);
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          break;
        case 'disconnected':
        case 'failed':
          this.callbacks.onConnectionStateChange?.('disconnected', this.remoteDevice || undefined);
          break;
        case 'closed':
          this.callbacks.onConnectionStateChange?.('idle');
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
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
          this.callbacks.onConnectionStateChange?.('connecting', this.remoteDevice || undefined);
          await this.startOfferFlow();
        }
        break;

      case 'OFFER':
        if (msg.senderDevice) {
          this.remoteDevice = msg.senderDevice;
        }
        if (!this.isInitiator && msg.payload?.offer) {
          this.callbacks.onConnectionStateChange?.('connecting', this.remoteDevice || undefined);
          await this.handleOffer(msg.payload.offer);
        }
        break;

      case 'ANSWER':
        if (msg.payload?.answer && this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.payload.answer));
          this.flushIceCandidateQueue();
        }
        break;

      case 'ICE_CANDIDATE':
        if (msg.payload?.candidate) {
          const candidate = new RTCIceCandidate(msg.payload.candidate);
          if (this.peerConnection && this.peerConnection.remoteDescription) {
            await this.peerConnection.addIceCandidate(candidate).catch(console.warn);
          } else {
            this.iceCandidateQueue.push(msg.payload.candidate);
          }
        }
        break;

      case 'PEER_LEFT':
        this.callbacks.onConnectionStateChange?.('disconnected', this.remoteDevice || undefined);
        this.remoteDevice = null;
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
    this.flushIceCandidateQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.currentRoomId) {
      signalingService.sendAnswer(this.currentRoomId, answer, this.remoteDevice?.id);
    }
  }

  private flushIceCandidateQueue(): void {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidateInit = this.iceCandidateQueue.shift();
      if (candidateInit) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(console.warn);
      }
    }
  }

  // --- Control Messages ---

  private sendControlMessage(message: DataChannelMessage): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }
    this.dataChannel.send(JSON.stringify(message));
    return true;
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

      case 'TRANSFER_PROPOSAL':
        if (msg.payload) {
          const proposal = msg.payload as TransferProposalPayload;
          this.callbacks.onIncomingProposal?.(proposal);
        }
        break;

      case 'TRANSFER_ACCEPT':
        if (this.activeTransfer && this.activeTransfer.direction === 'send') {
          this.beginSendingFiles();
        }
        break;

      case 'TRANSFER_REJECT':
        if (this.activeTransfer) {
          this.activeTransfer = null;
          this.callbacks.onTransferError?.('Transfer was rejected by the receiver.');
        }
        break;

      case 'FILE_HEADER':
        this.prepareToReceiveFile(msg.payload as FileHeaderPayload);
        break;

      case 'FILE_COMPLETE':
        this.finalizeReceivedFile(msg.payload?.fileId);
        break;

      case 'TRANSFER_CANCEL':
        if (this.activeTransfer) {
          this.activeTransfer.cancelled = true;
          this.activeTransfer = null;
          this.callbacks.onTransferError?.('Transfer was cancelled by peer.');
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

  // --- Ping / Keepalive ---
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

  // --- Text Message ---
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

  // --- File Sending Flow ---

  async proposeTransfer(files: File[], metadataList: FileMetadata[]): Promise<string> {
    if (!this.isConnected() || !this.localDevice) {
      throw new Error('Not connected to a peer');
    }

    const transferId = `tr_${Date.now()}`;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

    const transferFiles: ActiveTransferFile[] = metadataList.map((meta, i) => ({
      ...meta,
      fileObj: files[i],
      status: 'pending' as const,
      progress: 0,
    }));

    this.activeTransfer = {
      id: transferId,
      direction: 'send',
      files: transferFiles,
      currentFileIndex: 0,
      totalBytes,
      bytesTransferred: 0,
      startTime: Date.now(),
      lastCalcTime: Date.now(),
      lastCalcBytes: 0,
      currentSpeedBps: 0,
      cancelled: false,
    };

    const proposal: TransferProposalPayload = {
      transferId,
      senderDevice: this.localDevice,
      files: metadataList,
      totalBytes,
    };

    this.sendControlMessage({
      type: 'TRANSFER_PROPOSAL',
      payload: proposal,
    });

    this.emitProgressUpdate('pending');
    return transferId;
  }

  private async beginSendingFiles(): Promise<void> {
    if (!this.activeTransfer || this.activeTransfer.cancelled) return;
    this.activeTransfer.startTime = Date.now();
    this.activeTransfer.lastCalcTime = Date.now();
    this.emitProgressUpdate('transferring');

    for (let i = 0; i < this.activeTransfer.files.length; i++) {
      if (this.activeTransfer.cancelled) break;
      this.activeTransfer.currentFileIndex = i;
      const fileEntry = this.activeTransfer.files[i];
      const file = fileEntry.fileObj;
      if (!file) continue;

      fileEntry.status = 'transferring';
      const chunkSize = DEFAULT_CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);

      // Send File Header
      const header: FileHeaderPayload = {
        transferId: this.activeTransfer.id,
        fileId: fileEntry.id,
        name: fileEntry.name,
        size: file.size,
        type: file.type,
        totalChunks,
        chunkSize,
        sha256: fileEntry.sha256,
      };

      this.sendControlMessage({
        type: 'FILE_HEADER',
        payload: header,
      });

      // Stream file chunks with backpressure
      let offset = 0;
      while (offset < file.size && !this.activeTransfer.cancelled) {
        if (this.dataChannel && this.dataChannel.bufferedAmount > HIGH_WATER_MARK) {
          await this.waitForBufferLow();
        }

        if (this.activeTransfer.cancelled) break;

        const slice = file.slice(offset, offset + chunkSize);
        const buffer = await slice.arrayBuffer();

        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
          throw new Error('Connection lost during file transfer');
        }

        this.dataChannel.send(buffer);

        offset += buffer.byteLength;
        this.activeTransfer.bytesTransferred += buffer.byteLength;
        fileEntry.progress = Math.min(100, Math.round((offset / file.size) * 100));

        this.calculateSpeed();
        this.emitProgressUpdate('transferring');
      }

      if (this.activeTransfer.cancelled) break;

      // File finished
      fileEntry.status = 'completed';
      fileEntry.progress = 100;
      this.sendControlMessage({
        type: 'FILE_COMPLETE',
        payload: { transferId: this.activeTransfer.id, fileId: fileEntry.id },
      });
    }

    if (!this.activeTransfer.cancelled) {
      this.emitProgressUpdate('completed');
      this.callbacks.onTransferComplete?.(this.activeTransfer.id, []);
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

  // --- Receiving Flow ---

  acceptIncomingTransfer(proposal: TransferProposalPayload): void {
    if (!this.isConnected()) return;

    this.activeTransfer = {
      id: proposal.transferId,
      direction: 'receive',
      files: proposal.files.map((f) => ({
        ...f,
        status: 'pending' as const,
        progress: 0,
        receivedBytes: 0,
        chunks: [],
      })),
      currentFileIndex: 0,
      totalBytes: proposal.totalBytes,
      bytesTransferred: 0,
      startTime: Date.now(),
      lastCalcTime: Date.now(),
      lastCalcBytes: 0,
      currentSpeedBps: 0,
      cancelled: false,
    };

    this.sendControlMessage({
      type: 'TRANSFER_ACCEPT',
      payload: { transferId: proposal.transferId },
    });

    this.emitProgressUpdate('transferring');
  }

  rejectIncomingTransfer(proposal: TransferProposalPayload): void {
    this.sendControlMessage({
      type: 'TRANSFER_REJECT',
      payload: { transferId: proposal.transferId },
    });
  }

  private prepareToReceiveFile(header: FileHeaderPayload): void {
    if (!this.activeTransfer || this.activeTransfer.cancelled) return;
    const fileIndex = this.activeTransfer.files.findIndex((f) => f.id === header.fileId);
    if (fileIndex !== -1) {
      this.activeTransfer.currentFileIndex = fileIndex;
      const file = this.activeTransfer.files[fileIndex];
      file.status = 'transferring';
      file.receivedBytes = 0;
      file.chunks = [];
    }
    this.emitProgressUpdate('transferring');
  }

  private handleBinaryChunk(buffer: ArrayBuffer): void {
    if (!this.activeTransfer || this.activeTransfer.direction !== 'receive' || this.activeTransfer.cancelled) {
      return;
    }

    const currentFile = this.activeTransfer.files[this.activeTransfer.currentFileIndex];
    if (!currentFile || !currentFile.chunks) return;

    currentFile.chunks.push(new Uint8Array(buffer));
    currentFile.receivedBytes = (currentFile.receivedBytes || 0) + buffer.byteLength;
    this.activeTransfer.bytesTransferred += buffer.byteLength;

    if (currentFile.size > 0) {
      currentFile.progress = Math.min(100, Math.round((currentFile.receivedBytes / currentFile.size) * 100));
    }

    this.calculateSpeed();
    this.emitProgressUpdate('transferring');
  }

  private async finalizeReceivedFile(fileId?: string): Promise<void> {
    if (!this.activeTransfer || this.activeTransfer.cancelled) return;
    
    const fileIndex = fileId 
      ? this.activeTransfer.files.findIndex((f) => f.id === fileId)
      : this.activeTransfer.currentFileIndex;

    if (fileIndex === -1) return;
    const file = this.activeTransfer.files[fileIndex];

    if (file && file.chunks) {
      const blob = new Blob(file.chunks as BlobPart[], { type: file.type || 'application/octet-stream' });
      file.blob = blob;
      file.downloadUrl = URL.createObjectURL(blob);
      file.status = 'completed';
      file.progress = 100;
      file.chunks = [];
    }

    const allCompleted = this.activeTransfer.files.every((f) => f.status === 'completed');
    if (allCompleted) {
      this.emitProgressUpdate('completed');
      const received = this.activeTransfer.files.map((f) => ({
        metadata: {
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          sha256: f.sha256,
        },
        blob: f.blob!,
      }));
      this.callbacks.onTransferComplete?.(this.activeTransfer.id, received);
    } else {
      this.emitProgressUpdate('transferring');
    }
  }

  cancelTransfer(): void {
    if (this.activeTransfer) {
      this.activeTransfer.cancelled = true;
      this.sendControlMessage({
        type: 'TRANSFER_CANCEL',
        payload: { transferId: this.activeTransfer.id },
      });
      this.emitProgressUpdate('cancelled');
      this.activeTransfer = null;
    }
  }

  private calculateSpeed(): void {
    if (!this.activeTransfer) return;
    const now = Date.now();
    const elapsed = (now - this.activeTransfer.lastCalcTime) / 1000;

    if (elapsed >= 0.4) {
      const bytesDiff = this.activeTransfer.bytesTransferred - this.activeTransfer.lastCalcBytes;
      const speed = bytesDiff / elapsed;
      this.activeTransfer.currentSpeedBps = this.activeTransfer.currentSpeedBps === 0
        ? speed
        : this.activeTransfer.currentSpeedBps * 0.7 + speed * 0.3;

      this.activeTransfer.lastCalcTime = now;
      this.activeTransfer.lastCalcBytes = this.activeTransfer.bytesTransferred;
    }
  }

  private emitProgressUpdate(status: TransferProgressState['status']): void {
    if (!this.activeTransfer) return;

    const currentFile = this.activeTransfer.files[this.activeTransfer.currentFileIndex];
    const totalBytes = this.activeTransfer.totalBytes || 1;
    const percentage = Math.min(100, Math.round((this.activeTransfer.bytesTransferred / totalBytes) * 100));

    const remainingBytes = Math.max(0, totalBytes - this.activeTransfer.bytesTransferred);
    const etaSeconds = this.activeTransfer.currentSpeedBps > 0 
      ? Math.ceil(remainingBytes / this.activeTransfer.currentSpeedBps)
      : 0;

    const state: TransferProgressState = {
      transferId: this.activeTransfer.id,
      direction: this.activeTransfer.direction,
      status,
      currentFileIndex: this.activeTransfer.currentFileIndex,
      totalFiles: this.activeTransfer.files.length,
      currentFileName: currentFile ? currentFile.name : '',
      currentFileSize: currentFile ? currentFile.size : 0,
      bytesTransferred: this.activeTransfer.bytesTransferred,
      totalBytes: this.activeTransfer.totalBytes,
      speedBps: this.activeTransfer.currentSpeedBps,
      etaSeconds,
      percentage,
      files: this.activeTransfer.files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        status: f.status,
        progress: f.progress,
        downloadUrl: f.downloadUrl,
        blob: f.blob,
      })),
    };

    this.callbacks.onTransferProgress?.(state);
  }

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
    this.activeTransfer = null;
  }
}

export const webrtcService = new WebRTCService();
