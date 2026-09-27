import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Lock } from 'lucide-react';
import { APP_NAME } from '../../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 py-8 mb-16 md:mb-0 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Zap className="w-3 h-3 fill-current" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {APP_NAME}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>Zero Cloud Storage P2P</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/transfer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Transfer
          </Link>
          <Link to="/history" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            History
          </Link>
          <Link to="/how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy & Architecture
          </Link>
          <Link to="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Settings
          </Link>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>Built with WebRTC & React</span>
        </div>
      </div>
    </footer>
  );
};
