import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontOption } from '../types';
import { GlassButton } from './GlassButton';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  fontChoice: FontOption;
  onOpenTerminal: () => void;
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ fontChoice, onOpenTerminal, onNavigate }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  const links = [
    { label: 'Home', action: () => onNavigate?.('home') },
    { label: 'Trading Journal', action: () => onNavigate?.('journal') },
    { label: 'Trench Terminal', action: onOpenTerminal },
    { label: 'Stoic Principles', action: onOpenTerminal }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
  };

  return (
    <footer className={`relative w-full pt-16 pb-12 px-6 sm:px-10 transition-colors duration-300 ${
      isDark ? 'bg-[#050608] border-t border-white/5' : 'bg-white border-t border-slate-200'
    }`}>
      <motion.div 
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-40px' }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto"
      >
        {/* Upper Zone */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-16">
          
          {/* Left: Serif Headline */}
          <div className="md:col-span-4 lg:col-span-5">
            <h4 className={`${serifClass} text-2xl sm:text-3xl lg:text-4xl font-normal leading-[1.18] max-w-[240px] transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Clarity in<br />
              the trenches.
            </h4>
            <p className={`mt-3 text-xs font-sans-clean max-w-xs transition-colors duration-300 ${
              isDark ? 'text-white/40' : 'text-slate-500'
            }`}>
              The trading journal for trenchers. Master your psychology, protect your capital, and trade with quiet certainty.
            </p>
          </div>

          {/* Center: Clean Vertical Navigation Links */}
          <div className="md:col-span-3 lg:col-span-3">
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => {
                      if (link.action) link.action();
                    }}
                    className={`text-[13px] font-sans-clean transition-colors cursor-pointer text-left ${
                      isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Newsletter Block */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-start">
            <p className={`text-[13px] font-sans-clean mb-4 transition-colors duration-300 ${
              isDark ? 'text-white/70' : 'text-slate-700'
            }`}>
              Get mindful trading notes and stoic market insights.
            </p>

            {subscribed ? (
              <div className={`border rounded-full px-4 py-2.5 text-xs font-sans-clean ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                ✓ You're on the early journal alpha list.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full rounded-full px-4 py-2 text-xs outline-none transition-all font-sans-clean ${
                    isDark
                      ? 'bg-white/[0.04] border border-white/15 focus:border-white/35 text-white placeholder-white/40'
                      : 'bg-slate-50 border border-slate-300 focus:border-slate-500 text-slate-900 placeholder-slate-400'
                  }`}
                  required
                />
                <GlassButton size="sm" type="submit">
                  Subscribe
                </GlassButton>
              </form>
            )}
          </div>

        </div>

        {/* Divider Line */}
        <div className={`w-full h-px my-8 transition-colors duration-300 ${
          isDark ? 'bg-white/10' : 'bg-slate-200'
        }`} />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans-clean">
          {/* Wordmark */}
          <div className={`${serifClass} text-xl font-normal tracking-tight flex items-baseline select-none transition-colors duration-300 ${
            isDark ? 'text-white/90' : 'text-slate-900'
          }`}>
            <span>Nako</span>
            <span className="text-[9px] font-sans font-light ml-0.5 opacity-70">®</span>
          </div>

          {/* Legal & Admin Links */}
          <div className={`flex items-center gap-6 transition-colors duration-300 ${
            isDark ? 'text-white/45' : 'text-slate-500'
          }`}>
            <a href="#privacy" className={isDark ? 'hover:text-white/80' : 'hover:text-slate-900'}>
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#terms" className={isDark ? 'hover:text-white/80' : 'hover:text-slate-900'}>
              Terms & Conditions
            </a>
            <span>·</span>
            <button
              onClick={() => onNavigate?.('admin')}
              className={`hover:underline cursor-pointer ${isDark ? 'hover:text-white/80' : 'hover:text-slate-900'}`}
            >
              Admin
            </button>
          </div>
        </div>

      </motion.div>
    </footer>
  );
};
