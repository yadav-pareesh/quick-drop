import React from 'react';
import type { DeviceInfo } from '../../types';
import { Smartphone, Tablet, Monitor, CheckCircle2 } from 'lucide-react';

interface DeviceCardProps {
  device: DeviceInfo;
  isSelf?: boolean;
  isConnected?: boolean;
  className?: string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSelf = false,
  isConnected = true,
  className = '',
}) => {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Tablet className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  return (
    <div
      className={`relative p-4 rounded-2xl bg-white dark:bg-slate-900 border ${
        isConnected
          ? 'border-blue-500/30 dark:border-blue-500/20 shadow-md shadow-blue-500/5'
          : 'border-slate-200 dark:border-slate-800'
      } flex items-center gap-3.5 ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          isConnected
            ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }`}
      >
        {getDeviceIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {device.name}
          </h4>
          {isSelf && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {device.os} • {device.browser}
        </p>
      </div>

      {isConnected && (
        <div className="flex items-center text-emerald-500 dark:text-emerald-400 text-xs font-medium gap-1 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">Active</span>
        </div>
      )}
    </div>
  );
};
