import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Link as LinkIcon, Check } from 'lucide-react';
import { IconButton } from '../../components/common/IconButton';
import { useToastStore } from '../../stores/toastStore';

interface QRCodeCardProps {
  value: string;
  label?: string;
  size?: number;
  className?: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  value,
  label = 'Scan with mobile camera to connect',
  size = 180,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const { showToast } = useToastStore();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Direct transfer link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Failed to copy',
        message: 'Could not copy link to clipboard.',
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'quickdrop-room-qr.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}
    >
      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 shadow-inner flex items-center justify-center">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          className="rounded-lg"
        />
      </div>

      {label && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center max-w-[200px]">
          {label}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <IconButton
          ariaLabel="Copy Room Link"
          variant="secondary"
          size="sm"
          onClick={handleCopyLink}
          className="text-slate-600 dark:text-slate-300"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
        </IconButton>
        <IconButton
          ariaLabel="Download QR Code"
          variant="secondary"
          size="sm"
          onClick={handleDownloadQR}
          className="text-slate-600 dark:text-slate-300"
        >
          <Download className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
