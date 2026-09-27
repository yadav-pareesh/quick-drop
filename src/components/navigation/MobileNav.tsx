import React from 'react';
import { NavLink } from 'react-router-dom';
import { Send, History, HelpCircle, Settings } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: '/transfer', label: 'Transfer', icon: <Send className="w-5 h-5" /> },
    { to: '/history', label: 'History', icon: <History className="w-5 h-5" /> },
    { to: '/how-it-works', label: 'How it Works', icon: <HelpCircle className="w-5 h-5" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 safe-area-pb">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-3 min-w-[64px] rounded-xl text-[11px] font-medium transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            <span className="mt-1 leading-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
