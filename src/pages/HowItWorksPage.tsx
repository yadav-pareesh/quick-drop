import React from 'react';
import { 
  ShieldCheck, 
  Network, 
  FileCheck, 
  EyeOff, 
  Cpu, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: <Network className="w-6 h-6 text-blue-500" />,
      title: 'Direct Peer-to-Peer Architecture',
      description:
        'QuickDrop relies on the WebRTC standard. Data channels communicate directly between device browsers. Files flow straight from device A to device B across your local router or direct internet routes without bouncing through intermediate cloud storage disks.',
    },
    {
      icon: <EyeOff className="w-6 h-6 text-indigo-500" />,
      title: 'Zero Storage on Cloud Servers',
      description:
        'Our signaling mechanism merely assists browsers in discovering each other (exchanging SDP descriptors and ICE candidates). The signaling mechanism never touches, parses, or retains your payload data.',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-emerald-500" />,
      title: 'Explicit Acceptance Safeguard',
      description:
        'Receiving devices are prompted with file names, sizes, and sender details before anything is downloaded. You maintain 100% control over which transfers are accepted onto your system.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-amber-500" />,
      title: 'High-Performance Binary Chunking',
      description:
        'Large files are segmented into safe 64KB chunks. Dynamic backpressure ensures the WebRTC RTCDataChannel buffer never overflows, delivering rock-solid transfers even for gigabyte-sized files.',
    },
  ];

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security & Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How QuickDrop Works
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          Demystifying the browser-to-browser peer architecture that powers seamless file transfers without cloud servers.
        </p>
      </div>

      {/* Architecture Overview Diagram */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden mb-16 border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
            The P2P WebRTC Pipeline
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Cloud Uploads vs Direct QuickDrop
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Traditional cloud tools upload files to AWS or Google servers first, wait for completion, then require the receiver to download them. QuickDrop transfers bytes directly as you send.
          </p>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Traditional Cloud
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Device A ➔ Cloud Server Disk ➔ Database ➔ Wait ➔ Cloud Server ➔ Device B
              </p>
              <div className="mt-3 text-[11px] text-slate-400">
                Slow, data stored indefinitely on 3rd-party servers, storage quotas.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-950/60 border border-blue-500/40">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                QuickDrop Direct P2P
              </span>
              <p className="text-xs text-white font-medium leading-relaxed">
                Device A ➔ [ Encrypted RTCDataChannel ] ➔ Device B
              </p>
              <div className="mt-3 text-[11px] text-emerald-400 font-semibold">
                ✓ Zero cloud retention • Direct local speeds • Unlimited file size
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {securityFeatures.map((feat) => (
          <div
            key={feat.title}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center mb-4">
              {feat.icon}
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {feat.title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {feat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Honest Privacy Guarantee */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-12">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
          Our Honest Privacy & Security Pledge
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          We believe in transparent engineering rather than marketing buzzwords. While WebRTC data channels are encrypted using DTLS/SCTP according to browser standards, NAT/firewall environments may occasionally require TURN relay servers when direct peer connectivity cannot be formed.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            No account or signup is ever required.
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            History metadata resides strictly in your browser.
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Temporary room codes expire after connection.
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Files are never sold, indexed, or analyzed.
          </li>
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <Button
          size="lg"
          variant="primary"
          rightIcon={<ArrowRight className="w-5 h-5" />}
          onClick={() => navigate('/transfer')}
        >
          Try QuickDrop Now
        </Button>
      </div>
    </div>
  );
};
