import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ConnectionVisualizer } from '../features/device/ConnectionVisualizer';
import { useConnectionStore } from '../stores/connectionStore';
import { 
  ArrowRight, 
  KeyRound, 
  Lock, 
  FileText, 
  Image, 
  Film, 
  Archive, 
  FileCode, 
  Sparkles,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { localDevice } = useConnectionStore();

  const mockRemoteDevice = {
    id: 'demo_peer',
    name: 'MacBook Pro',
    type: 'desktop' as const,
    os: 'macOS' as const,
    browser: 'Chrome' as const,
  };

  const steps = [
    {
      num: '01',
      title: 'Create a room',
      desc: 'Start a session in one click. QuickDrop generates a temporary transfer code and QR code.',
    },
    {
      num: '02',
      title: 'Connect your device',
      desc: 'Scan the QR code with your phone or enter the 6-character code on your other device.',
    },
    {
      num: '03',
      title: 'Select files',
      desc: 'Drag and drop photos, documents, videos, or folders of any size without account sign-ups.',
    },
    {
      num: '04',
      title: 'Transfer directly',
      desc: 'Data flows directly over your local network or P2P WebRTC data channels at maximum speed.',
    },
  ];

  const supportedTypes = [
    { label: 'Photos & RAW', ext: '.jpg, .png, .raw, .heic', icon: <Image className="w-5 h-5 text-indigo-500" /> },
    { label: 'High-Res Video', ext: '.mp4, .mov, .mkv, .webm', icon: <Film className="w-5 h-5 text-violet-500" /> },
    { label: 'PDFs & Docs', ext: '.pdf, .docx, .xlsx, .pptx', icon: <FileText className="w-5 h-5 text-rose-500" /> },
    { label: 'Archives & ZIPs', ext: '.zip, .tar, .7z, .rar', icon: <Archive className="w-5 h-5 text-cyan-500" /> },
    { label: 'Code & Data', ext: '.json, .ts, .py, .csv', icon: <FileCode className="w-5 h-5 text-emerald-500" /> },
    { label: 'Text & Notes', ext: 'Instant clipboard & links', icon: <Share2 className="w-5 h-5 text-amber-500" /> },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80 mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Serverless Peer-to-Peer Transfer</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Transfer files.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400">
            Directly.
          </span>{' '}
          Privately.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Send files between your devices without uploading them to a cloud server. 
          Blazing fast, browser-to-browser transfers secured by WebRTC.
        </p>

        {/* Primary and Secondary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Button
            size="lg"
            variant="primary"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/transfer?action=create')}
            className="w-full sm:w-auto shadow-xl shadow-blue-500/20"
          >
            Create Transfer
          </Button>

          <Button
            size="lg"
            variant="secondary"
            leftIcon={<KeyRound className="w-5 h-5" />}
            onClick={() => navigate('/transfer?action=join')}
            className="w-full sm:w-auto"
          >
            Join Transfer
          </Button>
        </div>

        {/* Interactive Visualizer Card */}
        <div className="max-w-2xl mx-auto shadow-2xl rounded-3xl">
          <ConnectionVisualizer
            localDevice={localDevice}
            remoteDevice={mockRemoteDevice}
            isTransferring={true}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Simple Flow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
              How QuickDrop Works
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
              Four steps from file selection to direct peer delivery. No registration required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-blue-500/30 dark:text-blue-400/20 font-mono">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[10px]">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Transfers Section */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Versatile
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
            Send Any File Format
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            Binary chunking allows safe transfers of all types without compression loss.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {supportedTypes.map((type) => (
            <div
              key={type.label}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {type.icon}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {type.label}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 truncate w-full">
                {type.ext}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/40 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-3">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy First Architecture</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Your files stay yours.
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  Unlike traditional cloud storage services, QuickDrop never saves your files to a server database. 
                  Data travels directly through encrypted WebRTC peer connections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {[
                    'Direct peer-to-peer data channels',
                    'Zero file storage on cloud disks',
                    'Temporary ephemeral room sessions',
                    'Explicit acceptance before downloads',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => navigate('/transfer')}
                  className="w-full md:w-auto shadow-lg shadow-blue-500/25"
                >
                  Start a Transfer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
