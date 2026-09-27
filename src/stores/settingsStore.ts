import { create } from 'zustand';
import type { AppSettings, ThemeMode } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import { signalingService } from '../services/signaling';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
}

const loadStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy settings: ensure cross-device WebSocket signaling is enabled
      if (parsed.signalingServerUrl === 'ws://localhost:4000') {
        parsed.signalingServerUrl = '';
      }
      if (parsed.useSignalingServer === undefined || parsed.useSignalingServer === false) {
        parsed.useSignalingServer = true;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

const initialSettings = loadStoredSettings();
signalingService.setAdapterMode(
  initialSettings.useSignalingServer,
  initialSettings.signalingServerUrl || undefined
);

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: initialSettings,


  updateSettings: (partial) =>
    set((state) => {
      const updated = { ...state.settings, ...partial };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch {}

      if (partial.useSignalingServer !== undefined || partial.signalingServerUrl !== undefined) {
        signalingService.setAdapterMode(
          updated.useSignalingServer,
          updated.signalingServerUrl
        );
      }

      return { settings: updated };
    }),

  setTheme: (theme) =>
    set((state) => {
      const updated = { ...state.settings, theme };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch {}
      return { settings: updated };
    }),
}));
