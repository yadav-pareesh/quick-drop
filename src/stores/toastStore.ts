import { create } from 'zustand';
import type { ToastItem, ToastType } from '../types';

interface ToastStore {
  toasts: ToastItem[];
  showToast: (toast: { title: string; message?: string; type?: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: ({ title, message, type = 'info', duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, title, message, type, duration };

    set((state) => ({
      toasts: [...state.toasts.slice(-2), newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
