import React from 'react';
import type { FileMetadata } from '../../types';
import { FileCard } from './FileCard';
import { Button } from '../../components/common/Button';
import { formatBytes } from '../../utils/formatters';
import { Send, Trash2 } from 'lucide-react';

interface FileListProps {
  files: FileMetadata[];
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
  onSend: () => void;
  isSending?: boolean;
  className?: string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onClearAll,
  onSend,
  isSending = false,
  className = '',
}) => {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Selected Files ({files.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total size: {formatBytes(totalBytes)}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={onClearAll}
          disabled={isSending}
          className="text-slate-400 hover:text-rose-500 text-xs"
        >
          Clear
        </Button>
      </div>

      {/* Grid of FileCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
        {files.map((file) => (
          <FileCard
            key={file.id}
            metadata={file}
            onRemove={isSending ? undefined : () => onRemoveFile(file.id)}
          />
        ))}
      </div>

      {/* Send CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
          Ready to transfer {files.length} item{files.length > 1 ? 's' : ''}
        </span>

        <Button
          variant="primary"
          size="lg"
          isLoading={isSending}
          rightIcon={<Send className="w-4 h-4" />}
          onClick={onSend}
          className="w-full sm:w-auto ml-auto"
        >
          Send {files.length} {files.length > 1 ? 'Files' : 'File'} ({formatBytes(totalBytes)})
        </Button>
      </div>
    </div>
  );
};
