import type { DeviceInfo, SignalingMessage } from '../../types';
import type { ISignalingAdapter, SignalingMessageHandler } from './types';

export class BroadcastChannelAdapter implements ISignalingAdapter {
  public name = 'BroadcastChannel (Local / Multi-tab)';
  private channel: BroadcastChannel | null = null;
  private messageHandlers: Set<SignalingMessageHandler> = new Set();
  private currentRoomId: string | null = null;
  private localDevice: DeviceInfo | null = null;
  private active = false;

  isConnected(): boolean {
    return this.active;
  }

  async connect(): Promise<void> {
    if (this.active && this.channel) return;
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('quickdrop_signaling_mesh');
      this.channel.onmessage = (event: MessageEvent<SignalingMessage>) => {
        this.handleIncoming(event.data);
      };
      this.active = true;
    } else {
      console.warn('BroadcastChannel not supported in this environment');
    }
  }

  disconnect(): void {
    if (this.currentRoomId) {
      this.leaveRoom(this.currentRoomId);
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.active = false;
  }

  private handleIncoming(msg: SignalingMessage): void {
    if (!msg || !msg.roomId) return;
    // Only process messages for current room and not from self
    if (this.currentRoomId && msg.roomId !== this.currentRoomId) return;
    if (this.localDevice && msg.senderId === this.localDevice.id) return;

    this.messageHandlers.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error in signaling message handler:', err);
      }
    });
  }

  private broadcast(msg: SignalingMessage): void {
    if (this.channel) {
      this.channel.postMessage(msg);
    }
  }

  async createRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    this.currentRoomId = roomId;
    this.localDevice = deviceInfo;
    
    this.broadcast({
      type: 'ROOM_CREATED',
      roomId,
      senderId: deviceInfo.id,
      senderDevice: deviceInfo,
    });
  }

  async joinRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    this.currentRoomId = roomId;
    this.localDevice = deviceInfo;

    this.broadcast({
      type: 'ROOM_JOINED',
      roomId,
      senderId: deviceInfo.id,
      senderDevice: deviceInfo,
    });
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.broadcast({
      type: 'OFFER',
      roomId,
      senderId: this.localDevice.id,
      senderDevice: this.localDevice,
      payload: { offer, targetPeerId },
    });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.broadcast({
      type: 'ANSWER',
      roomId,
      senderId: this.localDevice.id,
      senderDevice: this.localDevice,
      payload: { answer, targetPeerId },
    });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetPeerId?: string): void {
    if (!this.localDevice) return;
    this.broadcast({
      type: 'ICE_CANDIDATE',
      roomId,
      senderId: this.localDevice.id,
      payload: { candidate, targetPeerId },
    });
  }

  leaveRoom(roomId: string): void {
    if (this.localDevice) {
      this.broadcast({
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
