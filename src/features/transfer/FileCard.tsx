import React from 'react';
import type { FileMetadata } from '../../types';
import { formatBytes, truncateFilename } from '../../utils/formatters';
import { getFileCategory } from '../../services/file';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  FileArchive, 
  Code, 
  File as FileGeneric,
  X,
  Loader2,
  Download
} from 'lucide-react';
import { IconButton } from '../../components/common/IconButton';

interface FileCardProps {
  metadata: FileMetadata & { status?: string; progress?: number; downloadUrl?: string; blob?: Blob };
  onRemove?: () => void;
  onDownload?: () => void;
  showProgress?: boolean;
  className?: string;
}

export const FileCard: React.FC<FileCardProps> = ({
  metadata,
  onRemove,
  onDownload,
  showProgress = false,
  className = '',
}) => {
  const category = getFileCategory(metadata.type, metadata.name);

  const getCategoryIcon = () => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-violet-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-cyan-500" />;
      case 'code':
        return <Code className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileGeneric className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`relative group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-3 ${className}`}
    >
      {/* Thumbnail or Category Icon */}
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 overflow-hidden">
        {metadata.previewUrl ? (
          <img
            src={metadata.previewUrl}
            alt={metadata.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getCategoryIcon()
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-1">
        <h5
          className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate"
          title={metadata.name}
        >
          {truncateFilename(metadata.name, 28)}
        </h5>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span>{formatBytes(metadata.size)}</span>
          {showProgress && metadata.progress !== undefined && (
            <>
              <span>•</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {metadata.progress}%
              </span>
            </>
          )}
        </div>

        {/* Mini progress bar if in transfer */}
        {showProgress && metadata.status === 'transferring' && metadata.progress !== undefined && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-200"
              style={{ width: `${metadata.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Action: Remove or Download */}
      <div className="shrink-0 flex items-center">
        {metadata.status === 'completed' && metadata.downloadUrl ? (
          <IconButton
            ariaLabel="Download file"
            variant="primary"
            size="sm"
            onClick={onDownload}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500"
          >
            <Download className="w-4 h-4" />
          </IconButton>
        ) : metadata.status === 'transferring' ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : onRemove ? (
          <IconButton
            ariaLabel="Remove file"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
          >
            <X className="w-4 h-4" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
};
