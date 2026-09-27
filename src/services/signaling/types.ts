import type { DeviceInfo, SignalingMessage } from '../../types';

export type SignalingMessageHandler = (message: SignalingMessage) => void;

export interface ISignalingAdapter {
  name: string;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): void;
  createRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void>;
  joinRoom(roomId: string, deviceInfo: DeviceInfo): Promise<void>;
  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetPeerId?: string): void;
  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetPeerId?: string): void;
  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetPeerId?: string): void;
  leaveRoom(roomId: string): void;
  onMessage(handler: SignalingMessageHandler): () => void;
}
