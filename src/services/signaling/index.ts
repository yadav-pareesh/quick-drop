import type { DeviceInfo } from '../../types';
import { BroadcastChannelAdapter } from './BroadcastChannelAdapter';
import { WebSocketAdapter } from './WebSocketAdapter';
import type { ISignalingAdapter, SignalingMessageHandler } from './types';
import { DEFAULT_SETTINGS, getDefaultSignalingUrl } from '../../constants';

export class SignalingService {
  private activeAdapter: ISignalingAdapter;
  private broadcastAdapter: BroadcastChannelAdapter;
  private wsAdapter: WebSocketAdapter;
  private currentMode: 'broadcast' | 'websocket' = 'websocket';

  constructor() {
    this.broadcastAdapter = new BroadcastChannelAdapter();
    this.wsAdapter = new WebSocketAdapter(DEFAULT_SETTINGS.signalingServerUrl || getDefaultSignalingUrl());
    this.activeAdapter = this.wsAdapter;
  }


  setAdapterMode(useWebSocket: boolean, serverUrl?: string): void {
    if (serverUrl) {
      this.wsAdapter.setServerUrl(serverUrl);
    }

    const targetMode = useWebSocket ? 'websocket' : 'broadcast';
    if (targetMode === this.currentMode) return;

    this.activeAdapter.disconnect();
    this.currentMode = targetMode;
    this.activeAdapter = useWebSocket ? this.wsAdapter : this.broadcastAdapter;
  }

  getAdapterName(): string {
    return this.activeAdapter.name;
  }

  async connect(): Promise<void> {
    await this.activeAdapter.connect();
  }

  disconnect(): void {
    this.activeAdapter.disconnect();
  }

  async createRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.activeAdapter.createRoom(roomId, deviceInfo);
  }

  async joinRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.activeAdapter.joinRoom(roomId, deviceInfo);
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    this.activeAdapter.sendOffer(roomId, offer, targetPeerId);
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetPeerId?: string): void {
    this.activeAdapter.sendAnswer(roomId, answer, targetPeerId);
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetPeerId?: string): void {
    this.activeAdapter.sendIceCandidate(roomId, candidate, targetPeerId);
  }

  leaveRoom(roomId: string): void {
    this.activeAdapter.leaveRoom(roomId);
  }

  onMessage(handler: SignalingMessageHandler): () => void {
    return this.activeAdapter.onMessage(handler);
  }
}

export const signalingService = new SignalingService();
export * from './types';
