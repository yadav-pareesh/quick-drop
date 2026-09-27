import { create } from 'zustand';
import type { FileMetadata, TransferProgressState, TransferProposalPayload } from '../types';

interface TransferStore {
  selectedFiles: File[];
  selectedFileMetadata: FileMetadata[];
  activeTransfer: TransferProgressState | null;
  pendingProposal: TransferProposalPayload | null;

  setSelectedFiles: (files: File[], metadata: FileMetadata[]) => void;
  appendSelectedFiles: (files: File[], metadata: FileMetadata[]) => void;
  removeSelectedFile: (fileId: string) => void;
  clearSelectedFiles: () => void;
  setActiveTransfer: (transfer: TransferProgressState | null) => void;
  setPendingProposal: (proposal: TransferProposalPayload | null) => void;
  resetTransfer: () => void;
}

export const useTransferStore = create<TransferStore>((set) => ({
  selectedFiles: [],
  selectedFileMetadata: [],
  activeTransfer: null,
  pendingProposal: null,

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
  setPendingProposal: (proposal) => set({ pendingProposal: proposal }),

  resetTransfer: () =>
    set((state) => {
      state.selectedFileMetadata.forEach((m) => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      });
      return {
        selectedFiles: [],
        selectedFileMetadata: [],
        activeTransfer: null,
        pendingProposal: null,
      };
    }),
}));
