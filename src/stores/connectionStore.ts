import { create } from 'zustand';
import type { ConnectionState, DeviceInfo } from '../types';
import { getDeviceInfo } from '../utils/platform';

interface ConnectionStore {
  connectionState: ConnectionState;
  localDevice: DeviceInfo;
  remoteDevice: DeviceInfo | null;
  peerLatency: number | null;
  
  setConnectionState: (state: ConnectionState, remoteDevice?: DeviceInfo) => void;
  setLocalDeviceName: (name: string) => void;
  setPeerLatency: (latency: number | null) => void;
  resetConnection: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connectionState: 'idle',
  localDevice: getDeviceInfo(),
  remoteDevice: null,
  peerLatency: null,

  setConnectionState: (state, remoteDevice) =>
    set((prev) => ({
      connectionState: state,
      remoteDevice: remoteDevice !== undefined ? remoteDevice : prev.remoteDevice,
      peerLatency: state === 'connected' ? prev.peerLatency : null,
    })),

  setLocalDeviceName: (name) =>
    set(() => ({
      localDevice: getDeviceInfo(name),
    })),

  setPeerLatency: (latency) => set({ peerLatency: latency }),

  resetConnection: () =>
    set({
      connectionState: 'idle',
      remoteDevice: null,
      peerLatency: null,
    }),
}));
