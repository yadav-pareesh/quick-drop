import type { AppSettings } from '../types';

export const APP_NAME = 'QuickDrop';
export const APP_TAGLINE = 'Transfer files. Directly. Privately.';
export const APP_VERSION = '1.0.0';

// Default STUN servers for NAT traversal
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

// 64 KB per chunk (RTCDataChannel safe max without packet fragmentation)
export const DEFAULT_CHUNK_SIZE = 64 * 1024; 

// Backpressure thresholds for RTCDataChannel
export const HIGH_WATER_MARK = 4 * 1024 * 1024; // 4MB pause sending
export const LOW_WATER_MARK = 512 * 1024; // 512KB resume sending

// Maximum recommended single file size for browser in-memory blob assembly (2GB)
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

export const ROOM_CODE_REGEX = /^QK-[A-Z0-9]{4,6}$/i;

export const STORAGE_KEYS = {
  SETTINGS: 'quickdrop_settings',
  HISTORY: 'quickdrop_history',
  DEVICE_ID: 'quickdrop_device_id',
  THEME: 'quickdrop_theme',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  deviceName: '',
  theme: 'system',
  chunkSize: DEFAULT_CHUNK_SIZE,
  autoAcceptFromKnown: false,
  soundEnabled: true,
  signalingServerUrl: 'ws://localhost:4000',
  useSignalingServer: false, // Default to BroadcastChannel (zero-config local/multi-tab), switchable to WebSocket
};
