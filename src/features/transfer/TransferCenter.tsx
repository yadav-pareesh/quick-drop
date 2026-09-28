import React from 'react';
import type { TransferSession } from '../../types';
import { formatBytes, formatSpeed, formatEta } from '../../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  FileCode, 
  File as FileIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { getFileCategory } from '../../services/file';

interface TransferCenterProps {
  transfers: Record<string, TransferSession>;
  onAccept: (transferId: string) => void;
  onReject: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  onClearCompleted?: () => void;
  className?: string;
}

const getFileIcon = (mimeType: string, filename: string) => {
  const category = getFileCategory(mimeType, filename);
  switch (category) {
    case 'image':
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    case 'video':
      return <Film className="w-5 h-5 text-rose-500" />;
    case 'audio':
      return <Music className="w-5 h-5 text-amber-500" />;
    case 'archive':
      return <Archive className="w-5 h-5 text-emerald-500" />;
    case 'code':
      return <FileCode className="w-5 h-5 text-cyan-500" />;
    case 'pdf':
    case 'document':
    case 'text':
      return <FileText className="w-5 h-5 text-blue-500" />;
    default:
      return <FileIcon className="w-5 h-5 text-slate-500" />;
  }
};

export const TransferCenter: React.FC<TransferCenterProps> = React.memo(({
  transfers,
  onAccept,
  onReject,
  onCancel,
  onClearCompleted,
  className = '',
}) => {
  const transferList = Object.values(transfers).sort((a, b) => b.createdAt - a.createdAt);

  if (transferList.length === 0) {
    return null;
  }

  const activeCount = transferList.filter(
    (t) => t.status === 'transferring' || t.status === 'pending' || t.status === 'awaiting-approval'
  ).length;

  const completedCount = transferList.filter((t) => t.status === 'completed').length;

  const handleDownload = (t: TransferSession) => {
    if (!t.blob && !t.downloadUrl) return;

    if (t.downloadUrl) {
      // Use the pre-existing object URL (already managed by the transfer store)
      const link = document.createElement('a');
      link.href = t.downloadUrl;
      link.download = t.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (t.blob) {
      // Create a temporary URL, trigger download, then revoke immediately
      const url = URL.createObjectURL(t.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke after a short delay to allow the browser to start the download
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
            Transfer Center
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
            {activeCount > 0 ? `${activeCount} Active` : 'Idle'}
          </span>
        </div>

        {completedCount > 0 && onClearCompleted && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      {/* Transfer List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[480px] overflow-y-auto">
        {transferList.map((t) => {
          const isOutgoing = t.direction === 'outgoing';
          const isTransferring = t.status === 'transferring';
          const isAwaiting = t.status === 'awaiting-approval';
          const isCompleted = t.status === 'completed';
          const isFailed = t.status === 'failed';
          const isCancelled = t.status === 'cancelled';
          const isRejected = t.status === 'rejected';

          return (
            <div
              key={t.id}
              className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                {/* File Icon & Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700/60">
                    {getFileIcon(t.mimeType, t.filename)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Direction Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isOutgoing
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                        }`}
                      >
                        {isOutgoing ? (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>↑ Sending</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>↓ Receiving</span>
                          </>
                        )}
                      </span>

                      {/* Status Indicator */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                      {isAwaiting && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Approval</span>
                        </span>
                      )}
                      {(isFailed || isCancelled || isRejected) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="capitalize">{t.status}</span>
                        </span>
                      )}

                      {/* Device label */}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isOutgoing ? `To ${t.receiverDeviceName}` : `From ${t.senderDeviceName}`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.filename}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatBytes(t.size)}</span>
                      {isTransferring && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {formatSpeed(t.speed)}
                          </span>
                          {t.speed > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatEta(Math.ceil((t.size - t.bytesTransferred) / t.speed))}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Incoming Awaiting Approval Actions */}
                  {!isOutgoing && isAwaiting && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onAccept(t.id)}
                        className="text-xs px-3 py-1.5"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(t.id)}
                        className="text-xs px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Outgoing Awaiting Peer Approval */}
                  {isOutgoing && isAwaiting && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                        Waiting for peer...
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancel(t.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Cancel Transfer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Active Transfer Cancel */}
                  {isTransferring && (
                    <button
                      type="button"
                      onClick={() => onCancel(t.id)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title="Cancel Transfer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Completed Incoming Download */}
                  {!isOutgoing && isCompleted && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => handleDownload(t)}
                      className="text-xs font-semibold"
                    >
                      Save File
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar (Visible during transfer or awaiting) */}
              {(isTransferring || isAwaiting) && (
                <div className="mt-3">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 rounded-full ${
                        isAwaiting
                          ? 'bg-amber-400 w-full animate-pulse'
                          : isOutgoing
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: isAwaiting ? '100%' : `${t.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>{formatBytes(t.bytesTransferred)} transferred</span>
                    <span className="font-bold font-mono">{t.progress}%</span>
                  </div>
                </div>
              )}

              {/* Error Note */}
              {t.error && (
                <div className="mt-2 text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

TransferCenter.displayName = 'TransferCenter';
