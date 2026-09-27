import { create } from 'zustand';
import type { TransferHistoryItem } from '../types';
import { storageService } from '../services/storage';

interface HistoryStore {
  items: TransferHistoryItem[];
  isLoading: boolean;
  loadHistory: () => Promise<void>;
  addItem: (item: TransferHistoryItem) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  items: [],
  isLoading: false,

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const items = await storageService.getHistory();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    try {
      await storageService.addHistoryItem(item);
      set((state) => ({ items: [item, ...state.items] }));
    } catch (err) {
      console.error('Failed to add history item:', err);
    }
  },

  clearAll: async () => {
    try {
      await storageService.clearHistory();
      set({ items: [] });
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  },
}));
