import type { DeviceInfo, SignalingMessage } from '../../types';
import type { ISignalingAdapter, SignalingMessageHandler } from './types';
import { getDefaultSignalingUrl, isLikelyStaticHost } from '../../constants';
import { useConnectionStore } from '../../stores/connectionStore';

export class WebSocketAdapter implements ISignalingAdapter {
  public name = 'WebSocket Server';
  private socket: WebSocket | null = null;
  private messageHandlers: Set<SignalingMessageHandler> = new Set();
  private serverUrl: string;
  private currentRoomId: string | null = null;
  private localDevice: DeviceInfo | null = null;
  private reconnectTimer: number | null = null;
  private isExplicitlyClosed = false;
  private isHost = false; // Track whether this client created or joined the room
  private retryCount = 0;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  private resolveUrl(): string {
    let url = this.serverUrl;
    if (!url || url === 'ws://localhost:4000') {
      url = getDefaultSignalingUrl();
    }
    if (url) {
      url = url.trim();
      if (url.startsWith('https://')) {
        url = 'wss://' + url.slice(8);
      } else if (url.startsWith('http://')) {
        url = 'ws://' + url.slice(7);
      } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        url = `${proto}//${url}`;
      }
    }
    return url;
  }

  setServerUrl(url: string): void {
    if (this.serverUrl !== url) {
      this.serverUrl = url;
      this.retryCount = 0;
      if (this.isConnected()) {
        this.disconnect();
        this.connect().catch(console.error);
      }
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private checkSignalingFailure(targetUrl: string): void {
    if (this.retryCount >= 2 && !this.isExplicitlyClosed) {
      if (isLikelyStaticHost() && targetUrl.includes('/quickdrop-ws')) {
        useConnectionStore.getState().setSignalingError(
          'Static hosting (Netlify/Vercel) cannot run WebSockets. To transfer cross-device, please configure your deployed signaling server URL in Settings.'
        );
      } else {
        useConnectionStore.getState().setSignalingError(
          `Unable to reach WebSocket signaling server at ${targetUrl}. Please ensure your signaling server is running.`
        );
      }
    }
  }

  async connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    const targetUrl = this.resolveUrl();

    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(targetUrl);

        this.socket.onopen = () => {
          this.retryCount = 0;
          useConnectionStore.getState().setSignalingError(null);
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const msg: SignalingMessage = JSON.parse(event.data);
            if (this.localDevice && msg.senderId === this.localDevice.id) return;
            this.messageHandlers.forEach((handler) => handler(msg));
          } catch (e) {
            console.warn('Failed to parse WebSocket signaling message:', e);
          }
        };

        this.socket.onclose = () => {
          this.socket = null;
          if (!this.isExplicitlyClosed) {
            this.retryCount++;
            this.checkSignalingFailure(targetUrl);
            this.scheduleReconnect();
          }
          resolve();
        };

        this.socket.onerror = () => {
          this.retryCount++;
          this.checkSignalingFailure(targetUrl);
          resolve();
        };
      } catch (err) {
        console.warn('WebSocket connection error:', err);
        this.retryCount++;
        this.checkSignalingFailure(targetUrl);
        resolve();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    // Exponential backoff between 1.5s and 10s to avoid hammering the network
    const delay = Math.min(1500 * Math.pow(1.5, Math.min(this.retryCount, 5)), 10000);
    this.reconnectTimer = window.setTimeout(async () => {
      if (!this.isExplicitlyClosed) {
        await this.connect().catch(() => {});
        if (this.currentRoomId && this.localDevice && this.isConnected()) {
          // Send the correct message based on whether we created or joined the room
          this.send({
            type: this.isHost ? 'ROOM_CREATED' : 'ROOM_JOINED',
            roomId: this.currentRoomId,
            senderId: this.localDevice.id,
            senderDevice: this.localDevice,
          });
        }
      }
    }, delay);
  }

  private send(msg: SignalingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    this.isExplicitlyClosed = true;
    this.retryCount = 0;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.currentRoomId) {
      this.leaveRoom(this.currentRoomId);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async createRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    this.currentRoomId = roomId;
    this.localDevice = deviceInfo;
    this.isHost = true;
    if (!this.isConnected()) await this.connect();
    this.send({
      type: 'ROOM_CREATED',
      roomId,
      senderId: deviceInfo.id,
      senderDevice: deviceInfo,
    });
  }

  async joinRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    this.currentRoomId = roomId;
    this.localDevice = deviceInfo;
    this.isHost = false;
    if (!this.isConnected()) await this.connect();
    this.send({
      type: 'ROOM_JOINED',
      roomId,
      senderId: deviceInfo.id,
      senderDevice: deviceInfo,
    });
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.send({
      type: 'OFFER',
      roomId,
      senderId: this.localDevice.id,
      senderDevice: this.localDevice,
      payload: { offer, targetPeerId },
    });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.send({
      type: 'ANSWER',
      roomId,
      senderId: this.localDevice.id,
      senderDevice: this.localDevice,
      payload: { answer, targetPeerId },
    });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.send({
      type: 'ICE_CANDIDATE',
      roomId,
      senderId: this.localDevice.id,
      payload: { candidate, targetPeerId },
    });
  }

  leaveRoom(roomId: string): void {
    if (this.localDevice) {
      this.send({
        type: 'PEER_LEFT',
        roomId,
        senderId: this.localDevice.id,
      });
    }
    this.currentRoomId = null;
  }

  onMessage(handler: SignalingMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }
}
