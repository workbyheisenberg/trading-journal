import React from 'react';
import { motion } from 'motion/react';
import { FontOption } from '../types';
import { useTheme } from '../context/ThemeContext';

interface QuoteSectionProps {
  fontChoice: FontOption;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({ fontChoice }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  return (
    <section className={`relative w-full py-28 sm:py-36 md:py-48 px-6 flex flex-col items-center justify-center transition-colors duration-300 ${
      isDark ? 'bg-[#050608]' : 'bg-[#f8f9fb]'
    }`}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className={`${serifClass} text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal leading-[1.14] tracking-[-0.015em] select-none transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ textWrap: 'balance' }}
        >
          You cannot control the market.<br />
          Only your reaction to it.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-4 text-xs tracking-[0.2em] font-sans uppercase font-medium transition-colors duration-300 ${
            isDark ? 'text-white/35' : 'text-slate-400'
          }`}
        >
          Stoic trading · Mindful discipline · Zero regret
        </motion.p>
      </div>
    </section>
  );
};
