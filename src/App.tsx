/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuoteSection } from './components/QuoteSection';
import { FeatureGrid } from './components/FeatureGrid';
import { IntelligentCompanion } from './components/IntelligentCompanion';
import { PreorderSection } from './components/PreorderSection';
import { Footer } from './components/Footer';
import { TrenchModal } from './components/TrenchModal';
import { JournalPage } from './components/JournalPage';
import { AdminPage } from './components/AdminPage';
import { WalletModal } from './components/WalletModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import { FontOption } from './types';

function MainApp() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'home';
  });

  const [fontChoice] = useState<FontOption>('instrument');
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [terminalTab, setTerminalTab] = useState<'classifier' | 'journal' | 'analytics'>('classifier');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with browser URL changes (#admin or /admin)
  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setActiveTab('admin');
      } else if (window.location.hash === '#journal') {
        setActiveTab('journal');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (tab: 'home' | 'journal' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'admin') {
      window.history.pushState({}, '', '#admin');
    } else if (tab === 'journal') {
      window.history.pushState({}, '', '#journal');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenTerminal = (tab: 'classifier' | 'journal' | 'analytics' = 'classifier') => {
    setTerminalTab(tab);
    setIsTerminalOpen(true);
  };

  const handlePreorder = () => {
    showToast('Early Alpha Reservation received. Welcome to the Nako Cohort.');
  };

  const handleScheduleTour = () => {
    handleOpenTerminal('analytics');
  };

  // If user navigated to Admin Portal (/admin)
  if (activeTab === 'admin') {
    return (
      <>
        <AdminPage
          onBackToHome={() => navigateTo('home')}
          onGoToJournal={() => navigateTo('journal')}
        />
        <WalletModal />
      </>
    );
  }

  // If user navigated to the dedicated Journal page (ChatGPT-like interface)
  if (activeTab === 'journal') {
    return (
      <>
        <JournalPage
          onBackToHome={() => navigateTo('home')}
          onOpenAdmin={() => navigateTo('admin')}
        />
        <WalletModal />
      </>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col justify-between transition-colors duration-300 ${
      isDark 
        ? 'bg-[#050608] text-[#e8eaee] selection:bg-white/20 selection:text-white' 
        : 'bg-[#f8f9fb] text-slate-900 selection:bg-slate-900/20 selection:text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 text-xs px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 border ${
          isDark 
            ? 'bg-[#0d121c] border-white/25 text-white' 
            : 'bg-white border-slate-300 text-slate-900 shadow-md'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Home Page Flow */}
      <div>
        {/* Navigation Bar: Home & Journal */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => navigateTo(tab as any)}
          onOpenTerminal={() => navigateTo('journal')}
          fontChoice={fontChoice}
        />

        {/* Hero Section */}
        <Hero
          onBeginJourney={() => navigateTo('journal')}
          fontChoice={fontChoice}
        />

        {/* Interstitial Quote Section */}
        <QuoteSection fontChoice={fontChoice} />

        {/* Two-Column Feature Section */}
        <FeatureGrid
          onExploreFlow={() => navigateTo('journal')}
          fontChoice={fontChoice}
        />

        {/* Intelligent Companion Section */}
        <IntelligentCompanion
          onDiscover={() => handleOpenTerminal('analytics')}
          fontChoice={fontChoice}
        />

        {/* Preorder / Join Section */}
        <PreorderSection
          onPreorder={handlePreorder}
          onScheduleTour={handleScheduleTour}
          fontChoice={fontChoice}
        />
      </div>

      {/* Footer */}
      <Footer
        fontChoice={fontChoice}
        onOpenTerminal={() => handleOpenTerminal('journal')}
        onNavigate={(tab) => navigateTo(tab as any)}
      />

      {/* Interactive Trench Terminal & Journal Modal */}
      <TrenchModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        initialTab={terminalTab}
      />

      {/* Robinhood Account Modal */}
      <WalletModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <MainApp />
      </Web3Provider>
    </ThemeProvider>
  );
}
