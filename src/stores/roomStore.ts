import { create } from 'zustand';

interface RoomStore {
  currentRoomId: string | null;
  isHost: boolean;
  setRoom: (roomId: string, isHost: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  currentRoomId: null,
  isHost: false,

  setRoom: (roomId, isHost) => set({ currentRoomId: roomId, isHost }),
  clearRoom: () => set({ currentRoomId: null, isHost: false }),
}));
