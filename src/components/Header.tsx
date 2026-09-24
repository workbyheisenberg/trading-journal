import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { FontOption } from '../types';
import { GlassButton } from './GlassButton';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useWeb3 } from '../context/Web3Context';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTerminal: () => void;
  fontChoice: FontOption;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTerminal,
  fontChoice
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    isConnected,
    walletAddress,
    tokenBalance,
    hasAccess,
    tokenSymbol,
    openWalletModal,
    formatAddress
  } = useWeb3();

  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;
    // When scrolling down past 60px, move top bar up hiding
    if (diff > 5 && latest > 60) {
      setHidden(true);
    } else if (diff < -5 || latest <= 25) {
      // When scrolling back up or at the very top, smoothly slide back down
      setHidden(false);
    }
  });

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Journal', id: 'journal' }
  ];

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  return (
    <motion.header 
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: '-100%', opacity: 0 }
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md select-none transition-colors duration-300 ${
        isDark 
          ? 'bg-white/10 border-b border-white/15' 
          : 'bg-white/80 border-b border-slate-200/80 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Zone 1: Wordmark Logo */}
        <div className="flex items-center">
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`${serifClass} text-2xl sm:text-3xl font-normal tracking-tight flex items-baseline select-none group transition-colors duration-200 cursor-pointer ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Mumus</span>
            <span className="text-[10px] sm:text-[11px] font-sans font-light ml-0.5 opacity-80 group-hover:opacity-100 transition-opacity">®</span>
          </button>
        </div>

        {/* Zone 2: Theme Toggle & Connect Wallet Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {/* Connect Robinhood Account */}
          <GlassButton
            size="sm"
            onClick={openWalletModal}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {/* Status Indicator Dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                !isConnected
                  ? (isDark ? 'bg-white/40' : 'bg-slate-400')
                  : hasAccess
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
              }`}
            />
            
            {isConnected ? (
              <span className="font-editorial tracking-[0.06em] text-xs">
                {formatAddress()}
              </span>
            ) : (
              <span className="tracking-[0.06em] text-xs font-medium">Connect Robinhood</span>
            )}
          </GlassButton>
        </div>
      </div>
    </motion.header>
  );
};
