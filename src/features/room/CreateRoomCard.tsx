import React, { useState, useEffect } from 'react';
import { RoomCode } from './RoomCode';
import { QRCodeCard } from './QRCodeCard';
import { ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';

interface CreateRoomCardProps {
  roomId: string;
  onCancel?: () => void;
  className?: string;
}

export const CreateRoomCard: React.FC<CreateRoomCardProps> = ({
  roomId,
  className = '',
}) => {
  const { localDevice } = useConnectionStore();
  const [networkOrigin, setNetworkOrigin] = useState<string>(window.location.origin);
  const isMobile = localDevice.type === 'mobile';

  // Automatically fetch LAN IP from Vite server if running on localhost
  useEffect(() => {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    if (isLocalhost) {
      fetch('/api/network-ip')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.url && data.ip !== 'localhost') {
            setNetworkOrigin(data.url);
          }
        })
        .catch(() => {});
    }
  }, []);

  const shareUrl = `${networkOrigin}/transfer?room=${roomId}&action=join`;

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-blue-500/5 ${className}`}
    >
      <div className="text-center max-w-md mx-auto mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Session Ready</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isMobile ? 'Scan this QR code' : 'Connect your other device'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {isMobile
            ? 'Open QuickDrop on your computer or tablet to transfer directly.'
            : 'Scan the QR code with your mobile camera or enter the transfer code.'}
        </p>

        {/* Network indicator badge */}
        {networkOrigin !== window.location.origin && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span>LAN Network URL generated for mobile device</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-xl mx-auto">
        {/* QR Code */}
        <div className="w-full sm:w-auto flex justify-center">
          <QRCodeCard
            value={shareUrl}
            size={180}
            label={isMobile ? 'Point camera to join' : 'Scan with mobile camera'}
          />
        </div>

        {/* Room Code & Info */}
        <div className="w-full flex-1 flex flex-col gap-4">
          <RoomCode code={roomId} shareUrl={shareUrl} />

          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                End-to-End Direct Connection
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Your transfer code is temporary. Devices communicate directly using WebRTC without uploading files to a cloud server.
              </p>
            </div>
          </div>

          {/* Waiting animation */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>Waiting for device</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
