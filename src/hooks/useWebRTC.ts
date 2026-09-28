import { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useConnectionStore } from '../stores/connectionStore';
import { useTransferStore } from '../stores/transferStore';
import { useHistoryStore } from '../stores/historyStore';
import { useToastStore } from '../stores/toastStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { webrtcService } from '../services/webrtc';
import { useSound } from './useSound';
import type { FileMetadata, TransferSession } from '../types';

export function useWebRTC() {
  const { setConnectionState, setPeerLatency, localDevice, remoteDevice } = useConnectionStore();
  const { transfers, addTransfer, updateTransfer } = useTransferStore();
  const { addItem: addHistoryItem } = useHistoryStore();
  const { showToast } = useToastStore();
  const { settings } = useSettingsStore();
  const { addMessage: addChatMessage, clearMessages: clearChat } = useChatStore();
  const { playConnected, playTransferComplete, playNotify } = useSound();

  // ─── Stable ref callbacks ────────────────────────────────────────────────
  // Store all callback-dependencies in refs so that webrtcService.setCallbacks()
  // only needs to be called ONCE (on mount). The inner functions always read
  // the latest values via the refs, eliminating duplicate 'connected' toasts
  // caused by the effect re-running whenever any dependency changes identity.

  const setConnectionStateRef = useRef(setConnectionState);
  const setPeerLatencyRef = useRef(setPeerLatency);
  const showToastRef = useRef(showToast);
  const playConnectedRef = useRef(playConnected);
  const playTransferCompleteRef = useRef(playTransferComplete);
  const playNotifyRef = useRef(playNotify);
  const addTransferRef = useRef(addTransfer);
  const updateTransferRef = useRef(updateTransfer);
  const addHistoryItemRef = useRef(addHistoryItem);
  const autoAcceptRef = useRef(settings.autoAcceptFromKnown);
  const addChatMessageRef = useRef(addChatMessage);
  const clearChatRef = useRef(clearChat);

  // Keep refs in sync with latest values every render (no effect needed)
  setConnectionStateRef.current = setConnectionState;
  setPeerLatencyRef.current = setPeerLatency;
  showToastRef.current = showToast;
  playConnectedRef.current = playConnected;
  playTransferCompleteRef.current = playTransferComplete;
  playNotifyRef.current = playNotify;
  addTransferRef.current = addTransfer;
  updateTransferRef.current = updateTransfer;
  addHistoryItemRef.current = addHistoryItem;
  autoAcceptRef.current = settings.autoAcceptFromKnown;
  addChatMessageRef.current = addChatMessage;
  clearChatRef.current = clearChat;

  // ─── Register WebRTC callbacks ONCE on mount ─────────────────────────────
  // localDevice is the only legitimate reason to re-init (device name changed).
  useEffect(() => {
    webrtcService.init(localDevice);

    webrtcService.setCallbacks({
      onConnectionStateChange: (state, peer) => {
        setConnectionStateRef.current(state, peer);

        if (state === 'connected') {
          playConnectedRef.current();
          showToastRef.current({
            type: 'success',
            title: 'Device Connected',
            message: peer ? `Connected with ${peer.name}` : 'Direct P2P channel established.',
          });
        } else if (state === 'disconnected') {
          showToastRef.current({
            type: 'info',
            title: 'Device Disconnected',
            message: 'The peer has disconnected.',
          });
        } else if (state === 'reconnecting') {
          showToastRef.current({
            type: 'warning',
            title: 'Reconnecting...',
            message: 'Connection interrupted. Attempting to restore.',
          });
        }
      },

      onTransferCreated: (session: TransferSession) => {
        addTransferRef.current(session);

        if (session.direction === 'incoming') {
          playNotifyRef.current();
          if (autoAcceptRef.current) {
            webrtcService.acceptIncomingTransfer(session.id);
            showToastRef.current({
              type: 'info',
              title: 'Auto-Accepting File',
              message: `Receiving ${session.filename} from ${session.senderDeviceName}`,
            });
          } else {
            showToastRef.current({
              type: 'info',
              title: 'Incoming File Transfer',
              message: `${session.senderDeviceName} wants to send ${session.filename}`,
            });
          }
        }
      },

      onTransferProgress: (session: TransferSession) => {
        updateTransferRef.current(session.id, session);
      },

      onTransferComplete: (session: TransferSession) => {
        updateTransferRef.current(session.id, session);

        if (session.direction === 'incoming') {
          playTransferCompleteRef.current();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#6366f1', '#06b6d4'],
          });
        }

        const currentRemote = useConnectionStore.getState().remoteDevice;

        addHistoryItemRef.current({
          id: session.id,
          timestamp: Date.now(),
          peerDeviceName: currentRemote?.name || (session.direction === 'incoming' ? session.senderDeviceName : session.receiverDeviceName),
          peerDeviceType: currentRemote?.type || 'desktop',
          direction: session.direction === 'outgoing' ? 'send' : 'receive',
          fileCount: 1,
          totalBytes: session.size,
          status: 'completed',
          files: [
            {
              name: session.filename,
              size: session.size,
              type: session.mimeType,
            },
          ],
        });

        showToastRef.current({
          type: 'success',
          title: 'Transfer Complete',
          message: session.direction === 'outgoing'
            ? `Successfully sent ${session.filename}`
            : `${session.filename} received and ready to save!`,
        });
      },

      onTransferError: (transferId, error) => {
        updateTransferRef.current(transferId, { status: 'failed', error });
        showToastRef.current({
          type: 'error',
          title: 'Transfer Alert',
          message: error,
        });
      },

      onTextMessage: (msg) => {
        playNotifyRef.current();
        // Store in persistent chat history for the session
        addChatMessageRef.current({
          id: msg.id,
          text: msg.text,
          senderName: msg.senderName,
          direction: 'incoming',
          timestamp: msg.timestamp,
        });
        showToastRef.current({
          type: 'info',
          title: `💬 ${msg.senderName}`,
          message: msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text,
          duration: 5000,
        });
      },

      onPeerLatency: (latency) => {
        setPeerLatencyRef.current(latency);
      },
    });
    // Only re-init when localDevice changes (e.g. user updates their device name in Settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDevice]);

  const startTransfer = useCallback((files: File[], metadata: FileMetadata[]) => {
    return webrtcService.startTransfer(files, metadata);
  }, []);

  const acceptTransfer = useCallback((transferId: string) => {
    webrtcService.acceptIncomingTransfer(transferId);
  }, []);

  const rejectTransfer = useCallback((transferId: string) => {
    webrtcService.rejectIncomingTransfer(transferId);
    showToastRef.current({
      type: 'info',
      title: 'Transfer Declined',
      message: 'You rejected the incoming file transfer.',
    });
  }, []);

  const cancelTransfer = useCallback((transferId: string) => {
    webrtcService.cancelTransfer(transferId);
    showToastRef.current({
      type: 'warning',
      title: 'Transfer Cancelled',
      message: 'Transfer was cancelled.',
    });
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    return webrtcService.sendTextMessage(text);
  }, []);

  const disconnect = useCallback(() => {
    webrtcService.disconnect();
    useTransferStore.getState().resetAllTransfers();
    clearChatRef.current(); // clear chat history when session ends
  }, []);

  return {
    transfers,
    startTransfer,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    sendTextMessage,
    disconnect,
    remoteDevice,
  };
}
