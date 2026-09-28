import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Lock, Mail } from 'lucide-react';
import { APP_NAME } from '../../constants';

const DEVELOPER = {
  name: 'Pareesh Yadav',
  github: 'https://www.github.com/yadav-pareesh',
  linkedin: 'https://www.linkedin.com/in/pareeshyadav',
  email: 'mailto:pareeshyadav@gmail.com',
};

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 py-8 mb-16 md:mb-0 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Badge */}
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

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
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

          {/* Developer Social Links */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">Developer:</span>
            <a
              href={DEVELOPER.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              title="GitHub Profile"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
            <a
              href={DEVELOPER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
              title="LinkedIn Profile"
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#0A66C2] dark:text-slate-400 dark:hover:text-[#0A66C2] hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.5a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z" />
              </svg>
            </a>
            <a
              href={DEVELOPER.email}
              aria-label="Send Email"
              title="Send Email"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Sub-row */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <span>Built with WebRTC, React 19 & TypeScript</span>
          <span>
            Developed by{' '}
            <a
              href={DEVELOPER.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors"
            >
              {DEVELOPER.name}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
