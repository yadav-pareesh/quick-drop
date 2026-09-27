import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConnectionStore } from '../stores/connectionStore';
import { useRoomStore } from '../stores/roomStore';
import { useTransferStore } from '../stores/transferStore';
import { useToastStore } from '../stores/toastStore';
import { webrtcService } from '../services/webrtc';
import { generateRoomCode } from '../services/crypto';
import { processFileForTransfer } from '../services/file';
import { isValidRoomCode, normalizeRoomCode } from '../utils/validators';

import { CreateRoomCard } from '../features/room/CreateRoomCard';
import { JoinRoomCard } from '../features/room/JoinRoomCard';
import { ConnectionVisualizer } from '../features/device/ConnectionVisualizer';
import { ConnectionStatus } from '../features/device/ConnectionStatus';
import { FileDropzone } from '../features/transfer/FileDropzone';
import { FileList } from '../features/transfer/FileList';
import { TransferCenter } from '../features/transfer/TransferCenter';
import { TextTransferModal } from '../features/transfer/TextTransferModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';

import {
  PlusCircle,
  KeyRound,
  LogOut,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const TransferPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = searchParams.get('room');
  const actionParam = searchParams.get('action');

  const { connectionState, localDevice, remoteDevice, peerLatency, resetConnection } = useConnectionStore();
  const { currentRoomId, setRoom, clearRoom } = useRoomStore();
  const {
    transfers,
    selectedFiles,
    selectedFileMetadata,
    appendSelectedFiles,
    removeSelectedFile,
    clearSelectedFiles,
    clearCompletedTransfers,
    resetAllTransfers
  } = useTransferStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>(
    actionParam === 'join' || (roomParam && actionParam !== 'create') ? 'join' : 'create'
  );
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);

  const handleJoinRoom = React.useCallback(async (code: string) => {
    setJoinErrorMessage(null);
    setRoom(code, false);
    setSearchParams({ room: code, action: 'join' });
    try {
      await webrtcService.joinRoom(code, localDevice);
    } catch {
      setJoinErrorMessage('Failed to connect to room. Check code and try again.');
    }
  }, [setRoom, setSearchParams, localDevice]);

  // Auto-join if room query parameter present and user is joiner
  useEffect(() => {
    if (roomParam && actionParam !== 'create' && connectionState === 'idle') {
      const code = normalizeRoomCode(roomParam);
      if (isValidRoomCode(code)) {
        handleJoinRoom(code);
      }
    }
  }, [roomParam, actionParam, connectionState, handleJoinRoom]);

  const handleCreateRoom = async () => {
    const code = generateRoomCode();
    setRoom(code, true);
    setSearchParams({ room: code, action: 'create' });
    try {
      await webrtcService.createRoom(code, localDevice);
    } catch {
      showToast({
        type: 'error',
        title: 'Room Creation Failed',
        message: 'Could not create transfer room. Please retry.',
      });
    }
  };



  const handleFilesSelected = async (newFiles: File[]) => {
    setIsProcessingFiles(true);
    try {
      const metadataList = await Promise.all(newFiles.map(processFileForTransfer));
      appendSelectedFiles(newFiles, metadataList);
    } catch {
      showToast({
        type: 'error',
        title: 'File Selection Error',
        message: 'Could not process one or more files.',
      });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleSendFiles = async () => {
    if (selectedFiles.length === 0 || !remoteDevice) return;
    try {
      webrtcService.startTransfer(selectedFiles, selectedFileMetadata);
      clearSelectedFiles();
      showToast({
        type: 'info',
        title: 'Transfer Started',
        message: `Offered ${selectedFiles.length} file(s) to ${remoteDevice.name}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Transfer Error',
        message: err.message || 'Could not initiate file transfer.',
      });
    }
  };

  const handleDisconnect = () => {
    webrtcService.disconnect();
    clearRoom();
    resetConnection();
    resetAllTransfers();
    setSearchParams({});

    showToast({
      type: 'info',
      title: 'Session Ended',
      message: 'You have disconnected from the room.',
    });
  };

  const isConnected = connectionState === 'connected' && remoteDevice !== null;
  const isWaiting = connectionState === 'waiting_for_peer' || connectionState === 'creating_room';
  const isConnecting = connectionState === 'connecting' || connectionState === 'joining_room';

  const hasActiveTransfer = Object.values(transfers).some(
    (t) => t.status === 'transferring'
  );

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Connected State Screen */}
      {isConnected ? (
        <div className="flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <ConnectionStatus state={connectionState} latencyMs={peerLatency} />

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquare className="w-4 h-4" />}
                onClick={() => setIsTextModalOpen(true)}
              >
                Send Note
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={() => setShowDisconnectConfirm(true)}
                className="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Connection Visualizer */}
          <ConnectionVisualizer
            localDevice={localDevice}
            remoteDevice={remoteDevice}
            isTransferring={hasActiveTransfer}
          />

          {/* Unified Transfer Center (Independent Sessions, Direction Badges, Multi-File) */}
          <TransferCenter
            transfers={transfers}
            onAccept={(id) => webrtcService.acceptIncomingTransfer(id)}
            onReject={(id) => webrtcService.rejectIncomingTransfer(id)}
            onCancel={(id) => webrtcService.cancelTransfer(id)}
            onClearCompleted={clearCompletedTransfers}
          />

          {/* File Selection Dropzone & Staging (Always Available While Connected) */}
          <div className="flex flex-col gap-6">
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              onOpenSendText={() => setIsTextModalOpen(true)}
              disabled={isProcessingFiles}
            />

            {/* Selected Files Preview List */}
            {selectedFileMetadata.length > 0 && (
              <FileList
                files={selectedFileMetadata}
                onRemoveFile={removeSelectedFile}
                onClearAll={clearSelectedFiles}
                onSend={handleSendFiles}
                isSending={isProcessingFiles}
              />
            )}
          </div>
        </div>
      ) : isWaiting && currentRoomId ? (
        /* Host waiting for device */
        <div className="flex flex-col items-center gap-6">
          <CreateRoomCard roomId={currentRoomId} className="w-full" />
          <Button
            variant="ghost"
            size="md"
            onClick={handleDisconnect}
            className="text-slate-500 hover:text-rose-500"
          >
            Cancel & Exit Room
          </Button>
        </div>
      ) : isConnecting ? (
        /* Joiner connecting to host */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 animate-spin">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Connecting to device...
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Exchanging WebRTC handshake signals. Transfer will begin once peer confirms.
          </p>
          <Button variant="outline" onClick={handleDisconnect} className="w-full">
            Cancel
          </Button>
        </div>
      ) : (
        /* Initial State: Choose Create or Join */
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          {/* Header Title */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Start File Transfer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select an option below to create a direct P2P connection.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'create'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Transfer</span>
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'join'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Join Transfer</span>
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'create' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-blue-500/5 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <PlusCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                Create a Transfer Room
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                Generate a temporary code and QR code. Open QuickDrop on your other phone or computer to link.
              </p>

              <Button
                size="lg"
                variant="primary"
                onClick={handleCreateRoom}
                className="w-full max-w-sm"
              >
                Generate Transfer Session
              </Button>
            </div>
          ) : (
            <JoinRoomCard
              onJoin={handleJoinRoom}
              errorMessage={joinErrorMessage}
            />
          )}

          {/* Privacy Footnote */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted WebRTC • No account needed • No cloud storage</span>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        title="Disconnect Peer?"
        message="Are you sure you want to terminate this transfer connection? Any ongoing transfer will be stopped."
        confirmLabel="Disconnect"
        isDestructive={true}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />

      {/* Quick Text Transfer Modal */}
      <TextTransferModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
      />
    </div>
  );
};
