import React from 'react';
import type { TransferHistoryItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ChevronRight 
} from 'lucide-react';

interface HistoryCardProps {
  item: TransferHistoryItem;
  onClick: () => void;
  className?: string;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  onClick,
  className = '',
}) => {
  const isSend = item.direction === 'send';

  const getDeviceIcon = () => {
    switch (item.peerDeviceType) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5" />;
      default:
        return <Monitor className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isSend
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isSend ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {isSend ? 'Sent to' : 'Received from'} {item.peerDeviceName}
            </h5>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
              {getDeviceIcon()}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(item.timestamp)} • {item.fileCount} file{item.fileCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white block">
            {formatBytes(item.totalBytes)}
          </span>
          <span
            className={`text-[11px] font-semibold uppercase ${
              item.status === 'completed'
                ? 'text-emerald-500'
                : item.status === 'cancelled'
                ? 'text-amber-500'
                : 'text-rose-500'
            }`}
          >
            {item.status}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
};
