import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useConnectionStore } from '../stores/connectionStore';
import { useTransferStore } from '../stores/transferStore';
import { useHistoryStore } from '../stores/historyStore';
import { useToastStore } from '../stores/toastStore';
import { useSettingsStore } from '../stores/settingsStore';
import { webrtcService } from '../services/webrtc';
import { useSound } from './useSound';
import type { TransferProposalPayload } from '../types';

export function useWebRTC() {
  const { setConnectionState, setPeerLatency, localDevice, remoteDevice } = useConnectionStore();
  const { setActiveTransfer, setPendingProposal, activeTransfer, pendingProposal } = useTransferStore();
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

      onIncomingProposal: (proposal: TransferProposalPayload) => {
        playNotify();
        if (settings.autoAcceptFromKnown) {
          webrtcService.acceptIncomingTransfer(proposal);
          showToast({
            type: 'info',
            title: 'Auto-Accepting Transfer',
            message: `Receiving ${proposal.files.length} file(s) from ${proposal.senderDevice.name}`,
          });
        } else {
          setPendingProposal(proposal);
        }
      },

      onTransferProgress: (progress) => {
        setActiveTransfer(progress);
      },

      onTransferComplete: (transferId, receivedFiles) => {
        playTransferComplete();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#06b6d4'],
        });

        const active = useTransferStore.getState().activeTransfer;
        const currentRemote = useConnectionStore.getState().remoteDevice;

        if (active) {
          addHistoryItem({
            id: transferId,
            timestamp: Date.now(),
            peerDeviceName: currentRemote?.name || 'Remote Device',
            peerDeviceType: currentRemote?.type || 'desktop',
            direction: active.direction,
            fileCount: active.files.length,
            totalBytes: active.totalBytes,
            status: 'completed',
            files: active.files.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          });
        }

        showToast({
          type: 'success',
          title: 'Transfer Complete',
          message: active?.direction === 'send' 
            ? 'All files delivered successfully!' 
            : `${receivedFiles.length} file(s) ready to download.`,
        });
      },

      onTransferError: (error) => {
        showToast({
          type: 'error',
          title: 'Transfer Stopped',
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

    return () => {
      // Keep connection intact across component mount/unmount unless explicitly disconnected
    };
  }, [localDevice, setConnectionState, setPeerLatency, showToast, playConnected, playTransferComplete, playNotify, settings.autoAcceptFromKnown, setPendingProposal, setActiveTransfer, addHistoryItem]);

  const acceptTransfer = useCallback((proposal: TransferProposalPayload) => {
    setPendingProposal(null);
    webrtcService.acceptIncomingTransfer(proposal);
  }, [setPendingProposal]);

  const rejectTransfer = useCallback((proposal: TransferProposalPayload) => {
    setPendingProposal(null);
    webrtcService.rejectIncomingTransfer(proposal);
    showToast({
      type: 'info',
      title: 'Transfer Declined',
      message: 'You rejected the incoming file transfer.',
    });
  }, [setPendingProposal, showToast]);

  const cancelTransfer = useCallback(() => {
    webrtcService.cancelTransfer();
    showToast({
      type: 'warning',
      title: 'Transfer Cancelled',
      message: 'You cancelled the file transfer.',
    });
  }, [showToast]);

  const disconnect = useCallback(() => {
    webrtcService.disconnect();
    useTransferStore.getState().resetTransfer();
  }, []);

  return {
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    disconnect,
    activeTransfer,
    pendingProposal,
    remoteDevice,
  };
}
