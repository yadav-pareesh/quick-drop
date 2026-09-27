import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { AlertCircle } from 'lucide-react';
import { normalizeRoomCode } from '../../utils/validators';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onCodeScanned,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanInterval: number | null = null;

    if (isOpen) {
      setErrorMsg(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }

          // Use BarcodeDetector if available in browser
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code'],
            });

            scanInterval = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    handleDetectedValue(rawValue);
                  }
                } catch {}
              }
            }, 500);
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setErrorMsg('Camera access is unavailable or denied. You can enter the code manually.');
        });
    }

    return () => {
      if (scanInterval) window.clearInterval(scanInterval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleDetectedValue = (raw: string) => {
    // If it's a URL with ?room=QK-XXXX or just QK-XXXX
    try {
      if (raw.includes('room=')) {
        const url = new URL(raw);
        const code = url.searchParams.get('room');
        if (code) {
          onCodeScanned(normalizeRoomCode(code));
          onClose();
          return;
        }
      }
    } catch {}

    const normalized = normalizeRoomCode(raw);
    onCodeScanned(normalized);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Transfer QR Code" maxWidth="sm">
      <div className="flex flex-col items-center">
        {errorMsg ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs mb-4 text-center">
            <AlertCircle className="w-5 h-5 mx-auto mb-1.5" />
            <p>{errorMsg}</p>
          </div>
        ) : (
          <div className="relative w-full aspect-square max-w-[260px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-blue-500/50 mb-4 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanner Reticle Overlay */}
            <div className="absolute inset-8 border-2 border-cyan-400 rounded-xl pointer-events-none animate-pulse">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
          Align the QuickDrop QR code inside the viewfinder to connect automatically.
        </p>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Cancel & Enter Manually
        </Button>
      </div>
    </Modal>
  );
};
