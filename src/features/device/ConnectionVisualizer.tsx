import React from 'react';
import type { DeviceInfo } from '../../types';
import { Smartphone, Monitor, Lock, ShieldCheck, ArrowLeftRight } from 'lucide-react';

interface ConnectionVisualizerProps {
  localDevice: DeviceInfo;
  remoteDevice?: DeviceInfo | null;
  isTransferring?: boolean;
  className?: string;
}

export const ConnectionVisualizer: React.FC<ConnectionVisualizerProps> = ({
  localDevice,
  remoteDevice,
  isTransferring = false,
  className = '',
}) => {
  const getIcon = (type: string) => {
    return type === 'mobile' ? <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />;
  };

  const isConnected = !!remoteDevice;

  return (
    <div
      className={`relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3 sm:gap-6">
        {/* Device A (Local) */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 transition-transform hover:scale-105">
            {getIcon(localDevice.type)}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate w-full">
            {localDevice.name}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate w-full">
            {localDevice.os} (This Device)
          </span>
        </div>

        {/* Animated Bridge */}
        <div className="flex-[1.2] flex flex-col items-center justify-center px-1">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mb-1">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Direct P2P</span>
          </div>

          {/* Connection line with animated data packets */}
          <div className="relative w-full h-2 flex items-center">
            {/* Background track */}
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
              {isConnected && (
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 ${
                    isTransferring ? 'animate-pulse' : ''
                  }`}
                />
              )}
            </div>

            {/* Moving packet dot */}
            {isConnected && (
              <div
                className={`absolute w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 top-1/2 -translate-y-1/2 ${
                  isTransferring
                    ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]'
                    : ''
                }`}
                style={{
                  animation: isTransferring
                    ? 'packetMove 1.8s infinite linear'
                    : undefined,
                  left: isTransferring ? '50%' : '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
            {isConnected ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>WebRTC DataChannel</span>
              </>
            ) : (
              <span>Waiting for peer</span>
            )}
          </div>
        </div>

        {/* Device B (Remote or Placeholder) */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center mb-2 transition-all ${
              isConnected
                ? 'bg-white dark:bg-slate-800 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 animate-pulse'
            }`}
          >
            {isConnected ? getIcon(remoteDevice.type) : <ArrowLeftRight className="w-5 h-5 opacity-40" />}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate w-full">
            {isConnected ? remoteDevice.name : 'Waiting...'}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate w-full">
            {isConnected ? `${remoteDevice.os} • ${remoteDevice.browser}` : 'Other Device'}
          </span>
        </div>
      </div>
    </div>
  );
};
