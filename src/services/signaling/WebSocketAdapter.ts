import type { DeviceInfo, SignalingMessage } from '../../types';
import type { ISignalingAdapter, SignalingMessageHandler } from './types';

export class WebSocketAdapter implements ISignalingAdapter {
  public name = 'WebSocket Server';
  private socket: WebSocket | null = null;
  private messageHandlers: Set<SignalingMessageHandler> = new Set();
  private serverUrl: string;
  private currentRoomId: string | null = null;
  private localDevice: DeviceInfo | null = null;
  private reconnectTimer: number | null = null;
  private isExplicitlyClosed = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  setServerUrl(url: string): void {
    if (this.serverUrl !== url) {
      this.serverUrl = url;
      if (this.isConnected()) {
        this.disconnect();
        this.connect().catch(console.error);
      }
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = () => {
          if (this.currentRoomId && this.localDevice) {
            this.send({
              type: 'ROOM_JOINED',
              roomId: this.currentRoomId,
              senderId: this.localDevice.id,
              senderDevice: this.localDevice,
            });
          }
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
            this.scheduleReconnect();
          }
          resolve();
        };

        this.socket.onerror = () => {
          resolve();
        };
      } catch (err) {
        console.warn('WebSocket connection error:', err);
        resolve();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect().catch(() => {});
      }
    }, 3000);
  }

  private send(msg: SignalingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    this.isExplicitlyClosed = true;
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
