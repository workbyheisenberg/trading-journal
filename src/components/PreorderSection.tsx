import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontOption } from '../types';
import { GlassButton } from './GlassButton';
import { useTheme } from '../context/ThemeContext';

interface PreorderSectionProps {
  onPreorder: () => void;
  onScheduleTour: () => void;
  fontChoice: FontOption;
}

export const PreorderSection: React.FC<PreorderSectionProps> = ({
  onPreorder,
  onScheduleTour,
  fontChoice
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reserved, setReserved] = useState(false);

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  return (
    <section className={`relative w-full min-h-[750px] py-32 sm:py-40 px-6 flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#040609]' : 'bg-[#f8f9fb]'
    }`}>
      {/* Radiant Horizon Streak Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Background base */}
        <div className={`absolute inset-0 transition-colors duration-300 ${isDark ? 'bg-[#040609]' : 'bg-[#f8f9fb]'}`} />

        {/* Luminous twilight gradient streak */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: isDark ? 0.8 : 0.6, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[160%] max-w-[1700px] h-[480px]"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 65% 35% at 50% 60%, rgba(205, 80, 45, 0.55) 0%, rgba(180, 50, 25, 0.35) 30%, rgba(60, 110, 160, 0.25) 55%, rgba(15, 20, 35, 0.1) 80%, transparent 100%)'
              : 'radial-gradient(ellipse 65% 35% at 50% 60%, rgba(245, 140, 100, 0.45) 0%, rgba(253, 186, 116, 0.35) 30%, rgba(186, 230, 253, 0.3) 55%, rgba(241, 245, 249, 0.1) 80%, transparent 100%)',
            transform: 'rotate(-4deg)',
            filter: 'blur(45px)'
          }}
        />

        {/* Secondary fiery streak */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: isDark ? 0.65 : 0.45 }}
          viewport={{ once: false }}
          transition={{ duration: 1.5, delay: 0.15, ease: 'easeOut' }}
          className="absolute bottom-16 left-[20%] w-[60%] h-[180px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(240, 100, 50, 0.4) 30%, rgba(255, 140, 70, 0.5) 50%, rgba(70, 160, 210, 0.3) 80%, transparent 100%)',
            transform: 'rotate(-6deg)',
            filter: 'blur(30px)'
          }}
        />

        {/* Crisp horizon beam */}
        <div 
          className="absolute bottom-28 inset-x-0 h-[2px] opacity-40"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 120, 70, 0.6) 35%, rgba(255, 200, 150, 0.8) 50%, rgba(100, 200, 255, 0.6) 65%, transparent 100%)',
            filter: 'blur(1px)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Upper Tracked Label */}
        <motion.p 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`text-[10px] sm:text-[11px] font-sans-clean font-medium tracking-[0.28em] uppercase mb-4 transition-colors duration-300 ${
            isDark ? 'text-white/65' : 'text-slate-500'
          }`}
        >
          Trench Mindset · Stoic Discipline
        </motion.p>

        {/* Serif Heading: Silence the noise */}
        <motion.h2 
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.9, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className={`${serifClass} text-5xl sm:text-7xl md:text-8xl lg:text-[88px] font-normal leading-[1.04] tracking-[-0.02em] mb-6 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ textWrap: 'balance' }}
        >
          Silence the noise.
        </motion.h2>

        {/* Subtitle paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`text-xs sm:text-[15px] font-sans-clean font-normal max-w-xl leading-relaxed tracking-wide mb-12 transition-colors duration-300 ${
            isDark ? 'text-white/75' : 'text-slate-600'
          }`}
        >
          Stop trading on blind impulse. Step into the journal built for trenchers—trade less, observe your triggers, and cultivate unwavering composure in the heat of the market.
        </motion.p>

        {/* Dual Pill Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-30px' }}
          transition={{ duration: 0.85, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
        >
          {/* Primary Rust Button */}
          <GlassButton
            variant="rust"
            size="lg"
            onClick={() => {
              setReserved(true);
              onPreorder();
            }}
          >
            {reserved ? 'Access Granted' : 'Launch Trading Journal'}
          </GlassButton>

          {/* Secondary Button */}
          <GlassButton
            variant="glass"
            size="lg"
            onClick={onScheduleTour}
          >
            Explore Trench Insights
          </GlassButton>
        </motion.div>
      </div>
    </section>
  );
};
