import type { AppSettings } from '../types';

export const APP_NAME = 'QuickDrop';
export const APP_TAGLINE = 'Transfer files. Directly. Privately.';
export const APP_VERSION = '1.0.0';

// STUN and open TURN servers for reliable cross-device NAT traversal & LAN firewall bypass
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.services.mozilla.com' },
];

// 16 KB per chunk (RTCDataChannel universal safe max avoiding SCTP fragmentation and 64KB message limits)
export const DEFAULT_CHUNK_SIZE = 16 * 1024; 

// Backpressure thresholds for RTCDataChannel
export const HIGH_WATER_MARK = 1024 * 1024; // 1MB pause sending
export const LOW_WATER_MARK = 128 * 1024; // 128KB resume sending

// Maximum recommended single file size for browser in-memory blob assembly (2GB)
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

export const ROOM_CODE_REGEX = /^QK-[A-Z0-9]{4,6}$/i;

export const STORAGE_KEYS = {
  SETTINGS: 'quickdrop_settings',
  HISTORY: 'quickdrop_history',
  DEVICE_ID: 'quickdrop_device_id',
  THEME: 'quickdrop_theme',
} as const;

export const isLikelyStaticHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('.netlify.app') ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.github.io') ||
    host.endsWith('.pages.dev') ||
    host.endsWith('.firebaseapp.com') ||
    host.endsWith('.web.app')
  );
};

export const getDefaultSignalingUrl = (): string => {
  const envUrl = import.meta.env?.VITE_SIGNALING_SERVER_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }
  if (typeof window === 'undefined') return 'ws://localhost:5173/quickdrop-ws';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/quickdrop-ws`;
};

export const DEFAULT_SETTINGS: AppSettings = {
  deviceName: '',
  theme: 'system',
  chunkSize: DEFAULT_CHUNK_SIZE,
  autoAcceptFromKnown: false,
  soundEnabled: true,
  signalingServerUrl: '', // Auto-resolved to getDefaultSignalingUrl()
  useSignalingServer: true, // Enable WebSocket by default for cross-device support!
};

