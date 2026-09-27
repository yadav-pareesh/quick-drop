import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { IconButton } from '../../components/common/IconButton';
import { useToastStore } from '../../stores/toastStore';

interface RoomCodeProps {
  code: string;
  shareUrl?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export const RoomCode: React.FC<RoomCodeProps> = ({
  code,
  shareUrl,
  size = 'lg',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToastStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast({
        type: 'success',
        title: 'Code Copied',
        message: `Transfer code ${code} copied to clipboard!`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Please copy the code manually.',
      });
    }
  };

  const handleShare = async () => {
    const url = shareUrl || `${window.location.origin}/transfer?room=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickDrop Transfer',
          text: `Join my QuickDrop peer-to-peer file transfer with code: ${code}`,
          url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Room link copied to clipboard!',
        });
      } catch {
        handleCopy();
      }
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Transfer Code
        </span>
        <span
          className={`font-mono font-bold tracking-widest text-slate-900 dark:text-white select-all ${
            size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl'
          }`}
        >
          {code}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          ariaLabel={copied ? 'Copied' : 'Copy code'}
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="text-slate-700 dark:text-slate-200"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </IconButton>

        <IconButton
          ariaLabel="Share transfer"
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="text-slate-700 dark:text-slate-200"
        >
          <Share2 className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
