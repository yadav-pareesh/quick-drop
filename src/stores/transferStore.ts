import { create } from 'zustand';
import type { FileMetadata, TransferSession, TransferProgressState } from '../types';

interface TransferStore {
  transfers: Record<string, TransferSession>;
  selectedFiles: File[];
  selectedFileMetadata: FileMetadata[];

  // Multi-transfer actions
  addTransfer: (session: TransferSession) => void;
  updateTransfer: (id: string, partial: Partial<TransferSession>) => void;
  removeTransfer: (id: string) => void;
  clearCompletedTransfers: () => void;
  resetAllTransfers: () => void;

  // File staging actions
  setSelectedFiles: (files: File[], metadata: FileMetadata[]) => void;
  appendSelectedFiles: (files: File[], metadata: FileMetadata[]) => void;
  removeSelectedFile: (fileId: string) => void;
  clearSelectedFiles: () => void;

  // Legacy compat getters/setters
  activeTransfer: TransferProgressState | null;
  setActiveTransfer: (transfer: TransferProgressState | null) => void;
  resetTransfer: () => void;
}

export const useTransferStore = create<TransferStore>((set) => ({
  transfers: {},
  selectedFiles: [],
  selectedFileMetadata: [],
  activeTransfer: null,

  addTransfer: (session) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [session.id]: session,
      },
    })),

  updateTransfer: (id, partial) =>
    set((state) => {
      const existing = state.transfers[id];
      if (!existing) return state;

      return {
        transfers: {
          ...state.transfers,
          [id]: {
            ...existing,
            ...partial,
          },
        },
      };
    }),

  removeTransfer: (id) =>
    set((state) => {
      const existing = state.transfers[id];
      if (existing?.downloadUrl) {
        URL.revokeObjectURL(existing.downloadUrl);
      }
      const updated = { ...state.transfers };
      delete updated[id];
      return { transfers: updated };
    }),

  clearCompletedTransfers: () =>
    set((state) => {
      const updated: Record<string, TransferSession> = {};
      Object.entries(state.transfers).forEach(([id, t]) => {
        if (t.status === 'transferring' || t.status === 'pending' || t.status === 'awaiting-approval') {
          updated[id] = t;
        } else if (t.downloadUrl) {
          URL.revokeObjectURL(t.downloadUrl);
        }
      });
      return { transfers: updated };
    }),

  resetAllTransfers: () =>
    set((state) => {
      Object.values(state.transfers).forEach((t) => {
        if (t.downloadUrl) URL.revokeObjectURL(t.downloadUrl);
      });
      state.selectedFileMetadata.forEach((m) => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      });
      return {
        transfers: {},
        selectedFiles: [],
        selectedFileMetadata: [],
        activeTransfer: null,
      };
    }),

  setSelectedFiles: (files, metadata) =>
    set({
      selectedFiles: files,
      selectedFileMetadata: metadata,
    }),

  appendSelectedFiles: (newFiles, newMeta) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...newFiles],
      selectedFileMetadata: [...state.selectedFileMetadata, ...newMeta],
    })),

  removeSelectedFile: (fileId) =>
    set((state) => {
      const idx = state.selectedFileMetadata.findIndex((m) => m.id === fileId);
      if (idx === -1) return state;

      const meta = state.selectedFileMetadata[idx];
      if (meta.previewUrl) {
        URL.revokeObjectURL(meta.previewUrl);
      }

      const updatedMeta = state.selectedFileMetadata.filter((_, i) => i !== idx);
      const updatedFiles = state.selectedFiles.filter((_, i) => i !== idx);

      return {
        selectedFiles: updatedFiles,
        selectedFileMetadata: updatedMeta,
      };
    }),

  clearSelectedFiles: () =>
    set((state) => {
      state.selectedFileMetadata.forEach((m) => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      });
      return {
        selectedFiles: [],
        selectedFileMetadata: [],
      };
    }),

  setActiveTransfer: (transfer) => set({ activeTransfer: transfer }),

  resetTransfer: () =>
    set((state) => {
      state.selectedFileMetadata.forEach((m) => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      });
      return {
        selectedFiles: [],
        selectedFileMetadata: [],
        activeTransfer: null,
      };
    }),
}));
