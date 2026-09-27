import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useConnectionStore } from '../stores/connectionStore';
import { useTransferStore } from '../stores/transferStore';
import { useHistoryStore } from '../stores/historyStore';
import { useToastStore } from '../stores/toastStore';
import { useSettingsStore } from '../stores/settingsStore';
import { webrtcService } from '../services/webrtc';
import { useSound } from './useSound';
import type { FileMetadata, TransferSession } from '../types';

export function useWebRTC() {
  const { setConnectionState, setPeerLatency, localDevice, remoteDevice } = useConnectionStore();
  const { transfers, addTransfer, updateTransfer } = useTransferStore();
  const { addItem: addHistoryItem } = useHistoryStore();
  const { showToast } = useToastStore();
  const { settings } = useSettingsStore();
  const { playConnected, playTransferComplete, playNotify } = useSound();

  // Register WebRTC callbacks
  useEffect(() => {
    webrtcService.init(localDevice);

    webrtcService.setCallbacks({
      onConnectionStateChange: (state, peer) => {
        setConnectionState(state, peer);

        if (state === 'connected') {
          playConnected();
          showToast({
            type: 'success',
            title: 'Device Connected',
            message: peer ? `Connected with ${peer.name}` : 'Direct P2P channel established.',
          });
        } else if (state === 'disconnected') {
          showToast({
            type: 'info',
            title: 'Device Disconnected',
            message: 'The peer has disconnected.',
          });
        } else if (state === 'reconnecting') {
          showToast({
            type: 'warning',
            title: 'Reconnecting...',
            message: 'Connection interrupted. Attempting to restore.',
          });
        }
      },

      onTransferCreated: (session: TransferSession) => {
        addTransfer(session);

        if (session.direction === 'incoming') {
          playNotify();
          if (settings.autoAcceptFromKnown) {
            webrtcService.acceptIncomingTransfer(session.id);
            showToast({
              type: 'info',
              title: 'Auto-Accepting File',
              message: `Receiving ${session.filename} from ${session.senderDeviceName}`,
            });
          } else {
            showToast({
              type: 'info',
              title: 'Incoming File Transfer',
              message: `${session.senderDeviceName} wants to send ${session.filename}`,
            });
          }
        }
      },

      onTransferProgress: (session: TransferSession) => {
        updateTransfer(session.id, session);
      },

      onTransferComplete: (session: TransferSession) => {
        updateTransfer(session.id, session);

        if (session.direction === 'incoming') {
          playTransferComplete();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#6366f1', '#06b6d4'],
          });
        }

        const currentRemote = useConnectionStore.getState().remoteDevice;

        addHistoryItem({
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

        showToast({
          type: 'success',
          title: 'Transfer Complete',
          message: session.direction === 'outgoing' 
            ? `Successfully sent ${session.filename}` 
            : `${session.filename} received and ready to save!`,
        });
      },

      onTransferError: (transferId, error) => {
        updateTransfer(transferId, { status: 'failed', error });
        showToast({
          type: 'error',
          title: 'Transfer Alert',
          message: error,
        });
      },

      onTextMessage: (msg) => {
        playNotify();
        showToast({
          type: 'info',
          title: `Note from ${msg.senderName}`,
          message: msg.text,
          duration: 7000,
        });
      },

      onPeerLatency: (latency) => {
        setPeerLatency(latency);
      },
    });
  }, [localDevice, setConnectionState, setPeerLatency, showToast, playConnected, playTransferComplete, playNotify, settings.autoAcceptFromKnown, addTransfer, updateTransfer, addHistoryItem]);

  const startTransfer = useCallback((files: File[], metadata: FileMetadata[]) => {
    return webrtcService.startTransfer(files, metadata);
  }, []);

  const acceptTransfer = useCallback((transferId: string) => {
    webrtcService.acceptIncomingTransfer(transferId);
  }, []);

  const rejectTransfer = useCallback((transferId: string) => {
    webrtcService.rejectIncomingTransfer(transferId);
    showToast({
      type: 'info',
      title: 'Transfer Declined',
      message: 'You rejected the incoming file transfer.',
    });
  }, [showToast]);

  const cancelTransfer = useCallback((transferId: string) => {
    webrtcService.cancelTransfer(transferId);
    showToast({
      type: 'warning',
      title: 'Transfer Cancelled',
      message: 'Transfer was cancelled.',
    });
  }, [showToast]);

  const sendTextMessage = useCallback((text: string) => {
    return webrtcService.sendTextMessage(text);
  }, []);

  const disconnect = useCallback(() => {
    webrtcService.disconnect();
    useTransferStore.getState().resetAllTransfers();
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
