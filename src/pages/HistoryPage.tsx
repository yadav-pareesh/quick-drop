import React, { useEffect } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { HistoryList } from '../features/history/HistoryList';
import { History, ShieldCheck } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { items, isLoading, loadHistory, clearAll } = useHistoryStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transfer History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Locally stored metadata for your recent peer-to-peer file transfers.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-400 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Stored solely on this device</span>
        </div>
      </div>

      {/* History List Component */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : (
        <HistoryList items={items} onClearHistory={clearAll} />
      )}
    </div>
  );
};
