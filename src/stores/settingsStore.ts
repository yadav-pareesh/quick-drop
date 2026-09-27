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
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: loadStoredSettings(),

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
