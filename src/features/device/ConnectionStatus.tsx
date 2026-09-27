import React from 'react';
import type { ConnectionState } from '../../types';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  state: ConnectionState;
  latencyMs?: number | null;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  latencyMs,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        return {
          label: 'Connected',
          subtext: latencyMs !== null && latencyMs !== undefined ? `${latencyMs}ms latency` : 'Direct P2P',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50',
          icon: <Wifi className="w-3.5 h-3.5" />,
        };
      case 'waiting_for_peer':
        return {
          label: 'Waiting for device...',
          subtext: 'Share code or QR',
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dot: 'bg-blue-500 animate-ping',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        };
      case 'connecting':
      case 'creating_room':
      case 'joining_room':
        return {
          label: 'Connecting...',
          subtext: 'Exchanging keys',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500 animate-pulse',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        };
      case 'reconnecting':
        return {
          label: 'Reconnecting...',
          subtext: 'Network changed',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500 animate-pulse',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        };
      case 'disconnected':
      case 'failed':
        return {
          label: 'Disconnected',
          subtext: 'Session ended',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: <WifiOff className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: 'Ready',
          subtext: 'Standby',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: <WifiOff className="w-3.5 h-3.5" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${config.bg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span className="font-semibold">{config.label}</span>
      <span className="opacity-60 text-[11px]">• {config.subtext}</span>
    </div>
  );
};
