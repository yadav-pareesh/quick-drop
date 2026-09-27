// Core Types for QuickDrop

export type ThemeMode = 'light' | 'dark' | 'system';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type OSName = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Unknown';
export type BrowserName = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Brave' | 'Unknown';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  os: OSName;
  browser: BrowserName;
}

export type ConnectionState = 
  | 'idle'
  | 'creating_room'
  | 'joining_room'
  | 'waiting_for_peer'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type TransferStatus = 
  | 'pending'
  | 'preparing'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rejected';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  sha256?: string;
  previewUrl?: string;
}

export interface TransferProgressState {
  transferId: string;
  direction: 'send' | 'receive';
  status: TransferStatus;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  currentFileSize: number;
  bytesTransferred: number;
  totalBytes: number;
  speedBps: number; // Bytes per second
  etaSeconds: number;
  percentage: number;
  files: Array<FileMetadata & { status: TransferStatus; progress: number; downloadUrl?: string; blob?: Blob }>;
  error?: string;
}

// Signaling Messages
export type SignalingMessageType = 
  | 'ROOM_CREATED'
  | 'ROOM_JOINED'
  | 'PEER_JOINED'
  | 'PEER_LEFT'
  | 'OFFER'
  | 'ANSWER'
  | 'ICE_CANDIDATE'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ERROR';

export interface SignalingMessage {
  type: SignalingMessageType;
  roomId: string;
  senderId: string;
  senderDevice?: DeviceInfo;
  payload?: any;
}

// WebRTC DataChannel Protocol Messages
export type DataChannelMessageType = 
  | 'HANDSHAKE'
  | 'HANDSHAKE_ACK'
  | 'TRANSFER_PROPOSAL'
  | 'TRANSFER_ACCEPT'
  | 'TRANSFER_REJECT'
  | 'TRANSFER_START'
  | 'FILE_HEADER'
  | 'FILE_CHUNK'
  | 'FILE_COMPLETE'
  | 'TRANSFER_CANCEL'
  | 'TEXT_MESSAGE'
  | 'PING'
  | 'PONG';

export interface DataChannelMessage {
  type: DataChannelMessageType;
  payload?: any;
}

export interface TransferProposalPayload {
  transferId: string;
  senderDevice: DeviceInfo;
  files: FileMetadata[];
  totalBytes: number;
}

export interface FileHeaderPayload {
  transferId: string;
  fileId: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  chunkSize: number;
  sha256?: string;
}

export interface TextMessagePayload {
  id: string;
  text: string;
  senderName: string;
  timestamp: number;
}

// History
export interface TransferHistoryItem {
  id: string;
  timestamp: number;
  peerDeviceName: string;
  peerDeviceType: DeviceType;
  direction: 'send' | 'receive';
  fileCount: number;
  totalBytes: number;
  status: 'completed' | 'cancelled' | 'failed' | 'rejected';
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

// Settings
export interface AppSettings {
  deviceName: string;
  theme: ThemeMode;
  chunkSize: number; // bytes
  autoAcceptFromKnown: boolean;
  soundEnabled: boolean;
  signalingServerUrl: string;
  useSignalingServer: boolean; // if false, use local multi-tab BroadcastChannel
}

// Toast
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
