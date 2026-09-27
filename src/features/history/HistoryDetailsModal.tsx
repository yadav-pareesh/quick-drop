import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type { TransferHistoryItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { FileText, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface HistoryDetailsModalProps {
  item: TransferHistoryItem | null;
  onClose: () => void;
}

export const HistoryDetailsModal: React.FC<HistoryDetailsModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const isSend = item.direction === 'send';

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Transfer Details"
      description={`Transfer with ${item.peerDeviceName}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {/* Meta summary card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSend
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isSend ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                {isSend ? 'Sent to' : 'Received from'} {item.peerDeviceName}
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(item.timestamp)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {formatBytes(item.totalBytes)}
            </span>
            <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
              {item.status}
            </span>
          </div>
        </div>

        {/* Files included */}
        <div>
          <h6 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Files ({item.files.length})
          </h6>
          <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
            {item.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </span>
                </div>
                <span className="text-slate-400 font-mono shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Transferred directly using WebRTC peer-to-peer data channel.</span>
        </div>

        <Button variant="secondary" className="w-full mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
