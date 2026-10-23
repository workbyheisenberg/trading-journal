import React from 'react';
import { motion } from 'motion/react';
import { FontOption } from '../types';
import { GlassButton } from './GlassButton';
import { useTheme } from '../context/ThemeContext';

interface IntelligentCompanionProps {
  onDiscover: () => void;
  fontChoice: FontOption;
}

export const IntelligentCompanion: React.FC<IntelligentCompanionProps> = ({
  onDiscover,
  fontChoice
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  const metrics = [
    { value: '0.2s', label: 'Instant Logging', detail: 'Zero Friction Entry' },
    { value: '100%', label: 'Radical Honesty', detail: 'No Filter Journaling' },
    { value: 'Zero', label: 'Emotional Tilt', detail: 'Calm After Drawdowns' },
    { value: 'Daily', label: 'Inner Clarity', detail: 'Mindful Compounding' }
  ];

  return (
    <section className={`relative w-full py-28 sm:py-36 px-6 overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#050608]' : 'bg-[#f8f9fb]'
    }`}>
      {/* Ambient atmospheric glow */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] pointer-events-none transition-opacity duration-300 ${
          isDark ? 'opacity-25' : 'opacity-40'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(55, 90, 160, 0.35) 0%, rgba(30, 20, 70, 0.15) 50%, transparent 80%)'
            : 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(186, 230, 253, 0.5) 0%, rgba(224, 231, 255, 0.25) 50%, transparent 80%)',
          filter: 'blur(70px)'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Double-stacked uppercase tracked label */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1 select-none"
        >
          <p className={`text-[10px] sm:text-[11px] font-sans-clean font-medium tracking-[0.28em] uppercase transition-colors duration-300 ${
            isDark ? 'text-white/50' : 'text-slate-400'
          }`}>
            Mindful Trading Framework
          </p>
          <p className={`text-[10px] sm:text-[11px] font-sans-clean font-medium tracking-[0.28em] uppercase transition-colors duration-300 ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}>
            The Stoic Trencher
          </p>
        </motion.div>

        {/* Serif Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.85, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className={`${serifClass} text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-[-0.015em] mt-6 mb-6 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ textWrap: 'balance' }}
        >
          Trade with conviction.<br />
          Reflect with peace.
        </motion.h2>

        {/* Subparagraph */}
        <motion.p 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`text-xs sm:text-[15px] font-sans-clean font-normal max-w-xl leading-relaxed tracking-wide mb-16 transition-colors duration-300 ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}
        >
          True edge isn't clicking faster—it's mastering yourself. Nako gives trenchers a quiet space to record every entry, dissect mistakes without guilt, and build the calm consistency required to survive and win.
        </motion.p>

        {/* 4 Metrics in a horizontal row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 pt-4 pb-6">
          {metrics.map((item, idx) => (
            <motion.div 
              key={item.label} 
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-30px' }}
              transition={{ duration: 0.8, delay: 0.28 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center group"
            >
              <span className={`${serifClass} text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {item.value}
              </span>
              <span className={`text-[12px] font-sans-clean font-normal tracking-wide mt-2 transition-colors duration-300 ${
                isDark ? 'text-white/55' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Center Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-30px' }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12"
        >
          <GlassButton size="md" onClick={onDiscover}>
            Open Trading Journal
          </GlassButton>
        </motion.div>
      </div>
    </section>
  );
};
