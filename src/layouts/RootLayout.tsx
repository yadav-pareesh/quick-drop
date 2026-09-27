import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { MobileNav } from '../components/navigation/MobileNav';
import { Footer } from '../components/navigation/Footer';
import { ToastContainer } from '../components/common/Toast';
import { useWebRTC } from '../hooks/useWebRTC';
import { useTheme } from '../hooks/useTheme';

export const RootLayout: React.FC = () => {
  useTheme();
  useWebRTC();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 selection:text-blue-500 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />
      <MobileNav />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
