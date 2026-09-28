import type { BrowserName, DeviceInfo, DeviceType, OSName } from '../types';
import { STORAGE_KEYS } from '../constants';

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (existing) return existing;
    const newId = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
    return newId;
  } catch {
    return `dev_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export function detectOS(): OSName {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

export function detectBrowser(): BrowserName {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = window.navigator.userAgent;
  if (/Edg/.test(ua)) return 'Edge';
  if (/OPR|Opera/.test(ua)) return 'Opera';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Safari/.test(ua)) return 'Safari';
  if (/Firefox/.test(ua)) return 'Firefox';
  return 'Unknown';
}

export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent;
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

export function generateDefaultDeviceName(os: OSName, browser: BrowserName): string {
  if (os === 'iOS') return 'iPhone';
  if (os === 'Android') return 'Android Device';
  if (os === 'macOS') return `Mac (${browser})`;
  if (os === 'Windows') return `Windows PC (${browser})`;
  if (os === 'Linux') return `Linux (${browser})`;
  return `Device (${browser})`;
}

export function getDeviceInfo(customName?: string): DeviceInfo {
  const os = detectOS();
  const browser = detectBrowser();
  const type = detectDeviceType();
  const id = getOrCreateDeviceId();
  const name = customName?.trim() || generateDefaultDeviceName(os, browser);

  return { id, name, type, os, browser };
}

export interface CompatibilityCheck {
  webRTC: boolean;
  dataChannel: boolean;
  fileAPI: boolean;
  indexedDB: boolean;
  webCrypto: boolean;
  webShare: boolean;
  allEssentialSupported: boolean;
}

export function checkBrowserCompatibility(): CompatibilityCheck {
  if (typeof window === 'undefined') {
    return {
      webRTC: false,
      dataChannel: false,
      fileAPI: false,
      indexedDB: false,
      webCrypto: false,
      webShare: false,
      allEssentialSupported: false,
    };
  }

  const webRTC = !!(
    window.RTCPeerConnection ||
    (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection
  );
  const dataChannel = webRTC && typeof RTCPeerConnection.prototype.createDataChannel === 'function';
  const fileAPI = !!(window.File && window.FileReader && window.FileList && window.Blob);
  const indexedDB = !!window.indexedDB;
  const webCrypto = !!(window.crypto && window.crypto.subtle);
  const webShare = !!navigator.share;

  const allEssentialSupported = webRTC && dataChannel && fileAPI;

  return {
    webRTC,
    dataChannel,
    fileAPI,
    indexedDB,
    webCrypto,
    webShare,
    allEssentialSupported,
  };
}
