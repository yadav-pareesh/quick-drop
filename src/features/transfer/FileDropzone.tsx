import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { MAX_FILE_SIZE } from '../../constants';
import { formatBytes } from '../../utils/formatters';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onOpenSendText: () => void;
  disabled?: boolean;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = React.memo(({
  onFilesSelected,
  onOpenSendText,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
    // Reset input so same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processSelectedFiles = (files: File[]) => {
    setSizeWarning(null);
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setSizeWarning(`Some files exceed the browser memory limit (${formatBytes(MAX_FILE_SIZE)}).`);
    }
    const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/40 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/70'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        {/* Upload Icon with pulse on hover */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
            isDragOver
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'
          }`}
        >
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
          Drop files here
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          or select from your device to begin direct transfer
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<FilePlus className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Files
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<MessageSquare className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSendText();
            }}
          >
            Send Text
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <span>Photos</span>
          <span>•</span>
          <span>Videos</span>
          <span>•</span>
          <span>PDFs</span>
          <span>•</span>
          <span>ZIPs</span>
          <span>•</span>
          <span>Docs</span>
        </div>
      </div>

      {sizeWarning && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sizeWarning}</span>
        </div>
      )}
    </div>
  );
});

FileDropzone.displayName = 'FileDropzone';
