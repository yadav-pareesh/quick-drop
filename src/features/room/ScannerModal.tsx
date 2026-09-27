import React, { useRef, useState, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Camera, Image as ImageIcon, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInsecureContext, setIsInsecureContext] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);


  const handleDetectedValue = useCallback(
    (raw: string) => {
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
    },
    [onCodeScanned, onClose]
  );

  // Check camera support & devices
  useEffect(() => {
    if (!isOpen) return;

    const isSecure = window.isSecureContext;
    const hasMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    if (!isSecure && !hasMedia) {
      setIsInsecureContext(true);
      setErrorMsg(
        'Mobile browsers require HTTPS to access the live video camera directly. You can snap a photo with your camera shutter below or enter the code manually.'
      );
      return;
    }

    if (!hasMedia) {
      setErrorMsg('Camera access is not supported on this browser or device.');
      return;
    }

    // Check if device has multiple cameras (back / front)
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {});
  }, [isOpen]);

  // Start live camera stream
  useEffect(() => {
    if (!isOpen) return;

    const isSecure = window.isSecureContext;
    const hasMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    if (!isSecure && !hasMedia) return;

    let stream: MediaStream | null = null;
    let scanAnimationId: number | null = null;
    let offscreenCanvas: HTMLCanvasElement | null = null;
    let offscreenCtx: CanvasRenderingContext2D | null = null;

    setErrorMsg(null);

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(console.warn);
        }

        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        // Continuous frame scanning using jsQR
        let lastScanTime = 0;
        const scanLoop = (timestamp: number) => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA &&
            offscreenCanvas &&
            offscreenCtx
          ) {
            // Scan every 150ms for low CPU usage & instant response
            if (timestamp - lastScanTime > 150) {
              lastScanTime = timestamp;
              const video = videoRef.current;
              const width = video.videoWidth;
              const height = video.videoHeight;

              if (width > 0 && height > 0) {
                offscreenCanvas.width = width;
                offscreenCanvas.height = height;
                offscreenCtx.drawImage(video, 0, 0, width, height);

                const imageData = offscreenCtx.getImageData(0, 0, width, height);
                const code = jsQR(imageData.data, width, height, {
                  inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                  handleDetectedValue(code.data);
                  return; // Stop scanning loop on detection
                }
              }
            }
          }

          scanAnimationId = requestAnimationFrame(scanLoop);
        };

        scanAnimationId = requestAnimationFrame(scanLoop);
      })
      .catch((err) => {
        console.warn('Camera stream error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings, or use the photo button below.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera hardware found on this device.');
        } else {
          setErrorMsg('Unable to open live camera. Use the photo button below or enter the code manually.');
        }
      });

    return () => {
      if (scanAnimationId) cancelAnimationFrame(scanAnimationId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, handleDetectedValue]);

  // Decode QR from uploaded / snapped image file
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleDetectedValue(code.data);
          } else {
            setErrorMsg('No QR code found in the image. Please make sure the code is in clear focus and try again.');
          }
        }
      } catch (err) {
        setErrorMsg('Failed to process image. Please try again.');
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setErrorMsg('Failed to load selected photo.');
    };

    img.src = objectUrl;
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Transfer QR Code" maxWidth="sm">
      <div className="flex flex-col items-center">
        {/* Hidden file inputs for photo capture and gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageFile}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />

        {/* Insecure context warning if on plain HTTP over LAN */}
        {isInsecureContext && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs mb-4">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Camera Security Notice</span>
            </div>
            <p className="leading-relaxed mb-3">
              Mobile browsers require HTTPS to stream live video. You can easily snap a photo of the QR code using your phone's camera shutter below!
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Snap Photo with Camera
              </Button>
            </div>
          </div>
        )}

        {/* Live Camera Viewfinder (if supported) */}
        {!isInsecureContext && !errorMsg && (
          <div className="relative w-full aspect-square max-w-[270px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-blue-500/50 mb-4 flex items-center justify-center shadow-lg">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Viewfinder Target Reticle */}
            <div className="absolute inset-8 border-2 border-cyan-400/90 rounded-2xl pointer-events-none">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 shadow-sm shadow-cyan-400 animate-pulse" />
            </div>

            {/* Flip Camera Button */}
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Error / Fallback Card */}
        {errorMsg && !isInsecureContext && (
          <div className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs mb-4 text-center">
            <AlertCircle className="w-5 h-5 mx-auto mb-1.5 text-rose-500" />
            <p className="mb-3">{errorMsg}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Take Camera Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
                onClick={() => galleryInputRef.current?.click()}
              >
                From Gallery
              </Button>
            </div>
          </div>
        )}

        {/* Quick action buttons for photo upload */}
        <div className="w-full flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Camera className="w-4 h-4 text-blue-500" />}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 text-xs"
          >
            Snap Photo
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ImageIcon className="w-4 h-4 text-indigo-500" />}
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 text-xs"
          >
            From Gallery
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
          Align the QuickDrop QR code in the viewfinder, or snap a photo of it.
        </p>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Cancel & Enter Manually
        </Button>
      </div>
    </Modal>
  );
};
