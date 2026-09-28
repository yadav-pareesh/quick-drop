import React from 'react';
import type { DeviceInfo } from '../../types';
import { Smartphone, Monitor, Wifi, Shield, Zap } from 'lucide-react';

interface ConnectionVisualizerProps {
  localDevice: DeviceInfo;
  remoteDevice?: DeviceInfo | null;
  isTransferring?: boolean;
  className?: string;
}

const DeviceCard: React.FC<{
  device: DeviceInfo;
  label: string;
  isConnected?: boolean;
  isPlaceholder?: boolean;
}> = ({ device, label, isConnected, isPlaceholder }) => {
  const Icon = device.type === 'mobile' ? Smartphone : Monitor;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          isPlaceholder
            ? 'bg-slate-800/40 border-2 border-dashed border-slate-700 animate-pulse'
            : isConnected
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
            : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/40 shadow-lg shadow-blue-500/20'
        }`}
      >
        {/* Glow ring on connected remote */}
        {isConnected && !isPlaceholder && (
          <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400/30 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
        )}
        <Icon
          className={`w-7 h-7 sm:w-9 sm:h-9 transition-colors ${
            isPlaceholder
              ? 'text-slate-600'
              : isConnected
              ? 'text-emerald-400'
              : 'text-blue-400'
          }`}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-100 truncate max-w-[120px]">
          {isPlaceholder ? 'Waiting...' : device.name}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[120px]">
          {isPlaceholder ? 'Other Device' : label}
        </p>
      </div>
    </div>
  );
};

export const ConnectionVisualizer: React.FC<ConnectionVisualizerProps> = React.memo(({
  localDevice,
  remoteDevice,
  isTransferring = false,
  className = '',
}) => {
  const isConnected = !!remoteDevice;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0f1629 0%, #0d1117 50%, #0a0f1e 100%)',
      }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      {isConnected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="relative p-6 sm:p-8">
        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-500 ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            {isConnected ? 'Encrypted P2P Channel Active' : 'Waiting for peer to join...'}
          </div>
        </div>

        {/* Devices + Bridge */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Local Device */}
          <DeviceCard
            device={localDevice}
            label={`${localDevice.os} · This Device`}
          />

          {/* Bridge */}
          <div className="flex-1 flex flex-col items-center gap-2 px-2">
            {/* Top label */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-slate-500">
              <Wifi className="w-3 h-3" />
              <span>WebRTC</span>
            </div>

            {/* Animated data line */}
            <div className="relative w-full h-6 flex items-center justify-center">
              {/* Track */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-slate-800" />

              {isConnected ? (
                <>
                  {/* Filled track */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400" />

                  {/* Travelling packet A→B */}
                  <span
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80"
                    style={{
                      animation: 'packetA 2s ease-in-out infinite',
                    }}
                  />
                  {/* Travelling packet B→A (offset phase) */}
                  {isTransferring && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-md shadow-indigo-400/80"
                      style={{
                        animation: 'packetB 2s ease-in-out infinite 1s',
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-slate-700 border-dashed" />
              )}
            </div>

            {/* Bottom icons */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
                  isConnected ? 'text-emerald-400/80' : 'text-slate-600'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Encrypted</span>
              </div>
              {isTransferring && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-blue-400/80">
                  <Zap className="w-3 h-3 animate-pulse" />
                  <span>Sending</span>
                </div>
              )}
            </div>
          </div>

          {/* Remote Device */}
          {isConnected ? (
            <DeviceCard
              device={remoteDevice!}
              label={`${remoteDevice!.os} · ${remoteDevice!.browser}`}
              isConnected
            />
          ) : (
            <DeviceCard
              device={{ id: '', name: '', type: 'desktop', os: 'Windows', browser: 'Chrome' }}
              label=""
              isPlaceholder
            />
          )}
        </div>
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes packetA {
          0%   { left: 5%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 95%;  opacity: 0; }
        }
        @keyframes packetB {
          0%   { left: 95%;  opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 5%;   opacity: 0; }
        }
      `}</style>
    </div>
  );
});

ConnectionVisualizer.displayName = 'ConnectionVisualizer';
