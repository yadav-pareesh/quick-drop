import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useToastStore } from '../stores/toastStore';
import { checkBrowserCompatibility } from '../utils/platform';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Button } from '../components/common/Button';
import { 
  Settings, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Network, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Save, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { localDevice, setLocalDeviceName } = useConnectionStore();
  const { showToast } = useToastStore();

  const [deviceNameInput, setDeviceNameInput] = useState(settings.deviceName || localDevice.name);
  const [signalingUrlInput, setSignalingUrlInput] = useState(settings.signalingServerUrl);
  const [useSignalingServer, setUseSignalingServer] = useState(settings.useSignalingServer);
  const [chunkSize, setChunkSize] = useState(settings.chunkSize);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [autoAccept, setAutoAccept] = useState(settings.autoAcceptFromKnown);

  const compat = checkBrowserCompatibility();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      deviceName: deviceNameInput.trim(),
      signalingServerUrl: signalingUrlInput.trim(),
      useSignalingServer,
      chunkSize,
      soundEnabled,
      autoAcceptFromKnown: autoAccept,
    });

    if (deviceNameInput.trim()) {
      setLocalDeviceName(deviceNameInput.trim());
    }

    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated.',
    });
  };

  const handleReset = () => {
    updateSettings(DEFAULT_SETTINGS);
    setDeviceNameInput(localDevice.name);
    setSignalingUrlInput(DEFAULT_SETTINGS.signalingServerUrl);
    setUseSignalingServer(DEFAULT_SETTINGS.useSignalingServer);
    setChunkSize(DEFAULT_SETTINGS.chunkSize);
    setSoundEnabled(DEFAULT_SETTINGS.soundEnabled);
    setAutoAccept(DEFAULT_SETTINGS.autoAcceptFromKnown);

    showToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'Restored default settings.',
    });
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Customize your device identity, theme, and WebRTC transfer configurations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Device Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span>Device Profile</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            How your device appears to others during connection handshakes.
          </p>

          <div className="max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Device Name
            </label>
            <input
              type="text"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              placeholder="e.g. Pareesh's MacBook"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Current system: {localDevice.os} • {localDevice.browser}
            </span>
          </div>
        </div>

        {/* Appearance & Sound Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Appearance & Feedback</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Color Theme
              </label>
              <ThemeToggle showLabels={true} />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Sound Effects
              </label>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Audio Chimes Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* WebRTC Tuning & Signaling Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-500" />
            <span>WebRTC & Signaling Mesh</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Configure how peers locate each other and optimize chunking performance.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  Signaling Mode
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {useSignalingServer
                    ? 'WebSocket Server (Connects cross-device across WiFi / LAN / Internet)'
                    : 'BroadcastChannel (Instant multi-tab & multi-window discovery without server)'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setUseSignalingServer(!useSignalingServer)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  useSignalingServer
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}
              >
                {useSignalingServer ? 'WebSocket' : 'Local Mesh'}
              </button>
            </div>

            {useSignalingServer && (
              <div className="max-w-md animate-in fade-in duration-200">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Signaling Server WebSocket URL
                </label>
                <input
                  type="text"
                  value={signalingUrlInput}
                  onChange={(e) => setSignalingUrlInput(e.target.value)}
                  placeholder="ws://localhost:4000 or wss://..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Transfer Chunk Size (DataChannel buffer limit)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '32 KB', size: 32 * 1024 },
                  { label: '64 KB (Recommended)', size: 64 * 1024 },
                  { label: '128 KB', size: 128 * 1024 },
                  { label: '256 KB', size: 256 * 1024 },
                ].map((c) => (
                  <button
                    key={c.size}
                    type="button"
                    onClick={() => setChunkSize(c.size)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      chunkSize === c.size
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Browser Capability Checklist */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span>Browser Capabilities Diagnostic</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Live verification of APIs required for WebRTC peer-to-peer file transfer.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'WebRTC RTCPeerConnection', ok: compat.webRTC },
              { label: 'WebRTC RTCDataChannel', ok: compat.dataChannel },
              { label: 'HTML5 File & Blob API', ok: compat.fileAPI },
              { label: 'IndexedDB Local Storage', ok: compat.indexedDB },
              { label: 'Web Crypto SHA-256', ok: compat.webCrypto },
              { label: 'Web Share API', ok: compat.webShare },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {item.label}
                </span>
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-700"
          >
            Reset Defaults
          </Button>

          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
