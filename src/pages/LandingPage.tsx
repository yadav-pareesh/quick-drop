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
  Share2,
  Zap,
  Globe,
  ShieldCheck,
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
      desc: 'One click generates a secure room code and QR to share with your other device.',
      color: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/20',
      badge: 'text-blue-400',
    },
    {
      num: '02',
      title: 'Connect',
      desc: 'Scan the QR or type the 6-character code on your phone, tablet, or laptop.',
      color: 'from-violet-500/20 to-purple-500/20',
      border: 'border-violet-500/20',
      badge: 'text-violet-400',
    },
    {
      num: '03',
      title: 'Drop your files',
      desc: 'Drag and drop anything — photos, videos, archives, docs — any size, no limits.',
      color: 'from-cyan-500/20 to-teal-500/20',
      border: 'border-cyan-500/20',
      badge: 'text-cyan-400',
    },
    {
      num: '04',
      title: 'Transfer at full speed',
      desc: 'Files flow peer-to-peer at your network\'s maximum speed. No cloud bottleneck.',
      color: 'from-emerald-500/20 to-green-500/20',
      border: 'border-emerald-500/20',
      badge: 'text-emerald-400',
    },
  ];

  const supportedTypes = [
    { label: 'Photos & RAW', ext: '.jpg .png .heic .raw', icon: <Image className="w-6 h-6 text-indigo-400" />, bg: 'from-indigo-500/10 to-blue-500/10', border: 'border-indigo-500/20' },
    { label: 'HD Video', ext: '.mp4 .mov .mkv', icon: <Film className="w-6 h-6 text-violet-400" />, bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20' },
    { label: 'PDFs & Docs', ext: '.pdf .docx .xlsx', icon: <FileText className="w-6 h-6 text-rose-400" />, bg: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/20' },
    { label: 'Archives', ext: '.zip .7z .rar .tar', icon: <Archive className="w-6 h-6 text-amber-400" />, bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20' },
    { label: 'Code & Data', ext: '.ts .py .json .csv', icon: <FileCode className="w-6 h-6 text-emerald-400" />, bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20' },
    { label: 'Text & Links', ext: 'Clipboard transfer', icon: <Share2 className="w-6 h-6 text-cyan-400" />, bg: 'from-cyan-500/10 to-sky-500/10', border: 'border-cyan-500/20' },
  ];

  const privacyFeatures = [
    'Direct peer-to-peer — no server relay',
    'Zero file storage, zero cloud uploads',
    'Temporary ephemeral room sessions',
    'Explicit accept before every download',
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center relative overflow-hidden">
        {/* Background ambient blobs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/8 dark:bg-blue-500/12 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute top-32 -right-20 w-80 h-80 bg-indigo-500/8 dark:bg-indigo-500/12 rounded-full blur-[80px] pointer-events-none -z-10" />
        <div className="absolute top-48 -left-20 w-72 h-72 bg-cyan-500/6 dark:bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border border-blue-500/20 mb-7 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Serverless Peer-to-Peer Transfer</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.08] mb-5">
          Transfer files.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400">
            Instantly.
          </span>{' '}
          <br className="hidden sm:block" />
          No cloud. No limits.
        </h1>

        <p className="text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Browser-to-browser file transfers secured by WebRTC encryption.
          No sign-up. No storage. Just drop and send.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10 text-center">
          {[
            { icon: <Zap className="w-4 h-4 text-amber-400" />, stat: 'Full Speed', label: 'Local network LAN' },
            { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, stat: 'Encrypted', label: 'End-to-end WebRTC' },
            { icon: <Globe className="w-4 h-4 text-blue-400" />, stat: 'Cross-device', label: 'Phone · PC · Mac' },
          ].map((item) => (
            <div key={item.stat} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.stat}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Button
            size="lg"
            variant="primary"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/transfer?action=create')}
            className="w-full sm:w-auto shadow-2xl shadow-blue-500/30 text-base px-8"
          >
            Create Transfer
          </Button>
          <Button
            size="lg"
            variant="secondary"
            leftIcon={<KeyRound className="w-5 h-5" />}
            onClick={() => navigate('/transfer?action=join')}
            className="w-full sm:w-auto text-base px-8"
          >
            Join with Code
          </Button>
        </div>

        {/* Hero Demo Card */}
        <div className="max-w-2xl mx-auto">
          <ConnectionVisualizer
            localDevice={localDevice}
            remoteDevice={mockRemoteDevice}
            isTransferring={true}
          />
          <p className="text-xs text-slate-500 mt-3 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Live preview — your device is already detected
          </p>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-6 border-y border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">
              Simple Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              How QuickDrop Works
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Four steps from file selection to direct delivery. No account required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`relative p-6 rounded-3xl bg-gradient-to-br ${step.color} border ${step.border} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
              >
                <span className={`text-4xl font-black font-mono ${step.badge} opacity-40 select-none`}>
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 items-center justify-center text-[11px]">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported File Types ─────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">
            Versatile
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Send Any File Format
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Binary chunking preserves every byte — no compression, no quality loss.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {supportedTypes.map((type) => (
            <div
              key={type.label}
              className={`group p-5 rounded-2xl bg-gradient-to-br ${type.bg} border ${type.border} flex flex-col items-center text-center gap-3 hover:scale-[1.04] hover:shadow-lg transition-all duration-200 cursor-default`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.bg} border ${type.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {type.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{type.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{type.ext}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy CTA ─────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-slate-50/40 to-white dark:from-slate-900/30 dark:to-slate-950">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-2xl p-8 sm:p-14"
            style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 60%, #0d1117 100%)' }}
          >
            {/* Ambient blob */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy First Architecture</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                  Your files stay yours.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Always.</span>
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mb-6">
                  Unlike cloud services, QuickDrop never stores your files on any server.
                  Data flows directly through encrypted WebRTC peer connections — only you and your device touch it.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {privacyFeatures.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => navigate('/transfer')}
                  className="w-full md:w-auto shadow-2xl shadow-blue-500/30 text-base px-8"
                >
                  Start a Transfer
                </Button>
                <p className="text-xs text-slate-600 text-center">No account required</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
