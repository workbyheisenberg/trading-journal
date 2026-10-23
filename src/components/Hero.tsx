import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontOption } from '../types';
import { GlassButton } from './GlassButton';
import { Mascot } from './Mascot';
import { useTheme } from '../context/ThemeContext';
import { useWeb3 } from '../context/Web3Context';
import skyBg from '../assets/images/anime_blue_sky_1790189379897.jpg';

interface HeroProps {
  onBeginJourney: () => void;
  fontChoice: FontOption;
}

export const Hero: React.FC<HeroProps> = ({ onBeginJourney, fontChoice }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { contractAddress, tokenSymbol } = useWeb3();
  const [copied, setCopied] = useState(false);

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full min-h-[92vh] flex flex-col items-center justify-start pt-24 sm:pt-28 pb-28 px-6 overflow-hidden">
      {/* Background Image: Anime Painterly Blue Sky with Clouds */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src={skyBg} 
          alt="Anime blue sky with clouds" 
          className="absolute inset-0 w-full h-full object-cover object-top select-none opacity-95"
        />

        {/* Soft contrast gradient to keep typography clean and readable */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${
            isDark 
              ? 'bg-gradient-to-b from-[#050608]/40 via-transparent to-[#050608]' 
              : 'bg-gradient-to-b from-white/30 via-transparent to-[#f8f9fb]'
          }`} 
        />

        {/* Bottom seamless fade into next section */}
        <div 
          className={`absolute inset-x-0 bottom-0 h-44 sm:h-64 bg-gradient-to-b from-transparent transition-all duration-500 ${
            isDark 
              ? 'via-[#050608]/85 to-[#050608]' 
              : 'via-[#f8f9fb]/85 to-[#f8f9fb]'
          }`} 
        />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Tiny Rounded Pill with Token CA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.75, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 sm:mb-6"
        >
          <button
            onClick={handleCopy}
            title="Click to copy Contract Address"
            className={`group inline-flex items-center gap-1 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer select-none backdrop-blur-md ${
              isDark
                ? 'border-white/25 hover:border-white/50 bg-black/20 text-white/80'
                : 'border-slate-900/25 hover:border-slate-900/50 bg-white/60 text-slate-800 shadow-xs'
            }`}
          >
            {/* Token ticker */}
            <span className={`font-mono-code text-[11px] font-semibold transition-colors ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}>
              {tokenSymbol}
            </span>

            {/* Continuous runner: full contract address, first digit to last */}
            <div className="relative overflow-hidden w-32 sm:w-44 h-4 flex items-center">
              <motion.div
                className={`flex whitespace-nowrap font-mono-code text-[11px] transition-colors ${
                  isDark ? 'text-white/80 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950 font-medium'
                }`}
                animate={{ x: ['0%', '-50%'] }}
                transition={{
                  repeat: Infinity,
                  ease: 'linear',
                  duration: 12,
                }}
              >
                <span>{contractAddress}</span>
                <span>{contractAddress}</span>
              </motion.div>
            </div>

            {/* Micro copy icon (replaces copy text) */}
            <span
              className={`ml-1.5 p-1 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                isDark 
                  ? 'border-white/20 group-hover:border-white/40 text-white/70 group-hover:text-white' 
                  : 'border-slate-900/20 group-hover:border-slate-900/40 text-slate-700 group-hover:text-slate-950'
              }`}
              title={copied ? "Copied to clipboard" : "Copy contract address"}
            >
              {copied ? (
                <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </span>
          </button>
        </motion.div>

        {/* Main Serif Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={`${serifClass} text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal leading-[1.06] tracking-[-0.015em] max-w-3xl transition-colors duration-300 ${
            isDark 
              ? 'text-white' 
              : 'text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]'
          }`}
          style={{ textWrap: 'balance' }}
        >
          The Trading Journal for Trenchers.
        </motion.h1>

        {/* Subtitle paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-6 text-sm sm:text-[15px] font-sans-clean font-normal max-w-xl leading-relaxed tracking-wide transition-colors duration-300 ${
            isDark 
              ? 'text-white/80' 
              : 'text-slate-800 font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]'
          }`}
        >
          Markets are chaotic. You don't have to be. Write your trades, audit your emotions, and build calm discipline in the fastest trenches.
        </motion.p>

        {/* Centered Glassmorphic Button with 50% Fill Opacity */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.75, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex justify-center"
        >
          <GlassButton size="lg" variant="half" className="!text-white" onClick={onBeginJourney}>
            Open Trading Journal
          </GlassButton>
        </motion.div>

        {/* Official mascot with subtle cyan aura and gentle cloud-squish float */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 1.0, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 sm:mt-16 w-full max-w-md"
        >
          <Mascot className="h-48 sm:h-60" imgClassName="h-44 sm:h-56" />
        </motion.div>
      </div>
    </section>
  );
};
