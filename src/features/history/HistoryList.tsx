import React, { useState } from 'react';
import type { TransferHistoryItem } from '../../types';
import { HistoryCard } from './HistoryCard';
import { HistoryDetailsModal } from './HistoryDetailsModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { Trash2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoryListProps {
  items: TransferHistoryItem[];
  onClearHistory: () => void;
  className?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onClearHistory,
  className = '',
}) => {
  const [selectedItem, setSelectedItem] = useState<TransferHistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<History className="w-8 h-8" />}
        title="No transfers yet"
        description="Your recent transfers will appear here. Start by creating or joining a transfer session."
        actionLabel="Start a Transfer"
        onAction={() => navigate('/transfer')}
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Recent Activity ({items.length})
        </span>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => setShowClearConfirm(true)}
          className="text-slate-400 hover:text-rose-500 text-xs"
        >
          Clear History
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      {/* Details Modal */}
      <HistoryDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Transfer History"
        message="Are you sure you want to remove all local transfer history records? This cannot be undone."
        confirmLabel="Clear All"
        isDestructive={true}
        onConfirm={onClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
