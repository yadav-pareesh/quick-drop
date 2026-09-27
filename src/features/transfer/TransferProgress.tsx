import React from 'react';
import type { TransferProgressState } from '../../types';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { FileCard } from './FileCard';
import { formatBytes, formatDuration, formatSpeed } from '../../utils/formatters';
import { downloadBlob } from '../../services/file';
import { 
  CheckCircle2, 
  XCircle, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Clock, 
  FileStack,
  X
} from 'lucide-react';

interface TransferProgressProps {
  progress: TransferProgressState;
  onCancel: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({
  progress,
  onCancel,
  onDismiss,
  className = '',
}) => {
  const isSend = progress.direction === 'send';
  const isComplete = progress.status === 'completed';
  const isCancelled = progress.status === 'cancelled';
  const isFailed = progress.status === 'failed';

  const completedFilesCount = progress.files.filter((f) => f.status === 'completed').length;

  const handleDownloadSingle = (fileId: string) => {
    const file = progress.files.find((f) => f.id === fileId);
    if (file && file.blob) {
      downloadBlob(file.blob, file.name);
    }
  };

  const handleDownloadAll = () => {
    progress.files.forEach((f) => {
      if (f.blob) {
        downloadBlob(f.blob, f.name);
      }
    });
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-blue-500/5 ${className}`}
    >
      {/* Header status */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isComplete
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : isCancelled || isFailed
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isCancelled || isFailed ? (
              <XCircle className="w-6 h-6" />
            ) : isSend ? (
              <ArrowUpRight className="w-6 h-6 animate-pulse" />
            ) : (
              <ArrowDownLeft className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {isComplete
                ? 'Transfer Complete'
                : isCancelled
                ? 'Transfer Cancelled'
                : isFailed
                ? 'Transfer Failed'
                : isSend
                ? 'Sending files...'
                : 'Receiving files...'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isComplete
                ? `${progress.totalFiles} file(s) transferred • ${formatBytes(progress.totalBytes)}`
                : progress.currentFileName
                ? progress.currentFileName
                : `${progress.totalFiles} file(s) queued`}
            </p>
          </div>
        </div>

        {isComplete && onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-slate-400">
            Done
          </Button>
        )}
      </div>

      {/* Progress Bar & Big Percentage */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {progress.percentage}%
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {formatBytes(progress.bytesTransferred)} / {formatBytes(progress.totalBytes)}
          </span>
        </div>

        <ProgressBar
          value={progress.percentage}
          size="lg"
          color={isComplete ? 'emerald' : isFailed ? 'rose' : 'gradient'}
        />
      </div>

      {/* Real-time Metrics Card */}
      {!isComplete && !isCancelled && !isFailed && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 mb-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Speed</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatSpeed(progress.speedBps)}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Remaining</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {progress.etaSeconds > 0 ? formatDuration(progress.etaSeconds) : 'Calculating...'}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              <FileStack className="w-3 h-3 text-indigo-500" />
              <span>Files</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {completedFilesCount} / {progress.totalFiles} done
            </span>
          </div>
        </div>
      )}

      {/* File List in Transfer */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 mb-6">
        {progress.files.map((file) => (
          <FileCard
            key={file.id}
            metadata={file}
            showProgress={true}
            onDownload={() => handleDownloadSingle(file.id)}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {!isComplete && !isCancelled && !isFailed && (
          <Button
            variant="outline"
            size="md"
            leftIcon={<X className="w-4 h-4" />}
            onClick={onCancel}
            className="w-full sm:w-auto text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Cancel Transfer
          </Button>
        )}

        {isComplete && !isSend && (
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Download className="w-5 h-5" />}
            onClick={handleDownloadAll}
            className="w-full sm:w-auto ml-auto"
          >
            Download All ({formatBytes(progress.totalBytes)})
          </Button>
        )}

        {(isCancelled || isFailed) && onDismiss && (
          <Button variant="secondary" size="md" onClick={onDismiss} className="w-full sm:w-auto">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
