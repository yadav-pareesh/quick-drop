import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  direction: 'outgoing' | 'incoming';
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  clearMessages: () => set({ messages: [] }),
}));
