import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { ScannerModal } from './ScannerModal';
import { QrCode, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { isValidRoomCode, normalizeRoomCode } from '../../utils/validators';

interface JoinRoomCardProps {
  onJoin: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  className?: string;
}

export const JoinRoomCard: React.FC<JoinRoomCardProps> = ({
  onJoin,
  isLoading = false,
  errorMessage,
  className = '',
}) => {
  const [inputCode, setInputCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const val = e.target.value.toUpperCase();
    setInputCode(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = normalizeRoomCode(inputCode);
    if (!isValidRoomCode(formatted)) {
      setValidationError('Please enter a valid transfer code (e.g., QK-4829).');
      return;
    }
    setValidationError(null);
    onJoin(formatted);
  };

  const handleScannedCode = (code: string) => {
    setInputCode(code);
    if (isValidRoomCode(code)) {
      onJoin(code);
    }
  };

  const activeError = validationError || errorMessage;

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-blue-500/5 max-w-md mx-auto ${className}`}
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Join Transfer
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter the code displayed on the creating device.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="room-code-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
          >
            Transfer Code
          </label>
          <input
            id="room-code-input"
            type="text"
            value={inputCode}
            onChange={handleInputChange}
            placeholder="e.g. QK-4829"
            maxLength={10}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center text-xl sm:text-2xl font-bold tracking-widest uppercase placeholder:normal-case placeholder:text-base placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {activeError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full"
        >
          Join Transfer
        </Button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
          or
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="md"
        leftIcon={<QrCode className="w-4 h-4" />}
        onClick={() => setIsScannerOpen(true)}
        className="w-full"
      >
        Scan QR Code
      </Button>

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={handleScannedCode}
      />
    </div>
  );
};
