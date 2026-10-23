import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontOption, TrenchTradeMessage } from '../types';
import { INITIAL_TRENCH_MESSAGES, parseTrenchMessage } from '../data/trenchData';
import { GlassButton } from './GlassButton';
import { useTheme } from '../context/ThemeContext';

interface FeatureGridProps {
  onExploreFlow: () => void;
  fontChoice: FontOption;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onExploreFlow, fontChoice }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedTag, setSelectedTag] = useState<string>('Quiet Discipline');
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>('');
  const [activeMessage, setActiveMessage] = useState<TrenchTradeMessage>(INITIAL_TRENCH_MESSAGES[0]);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);

  const serifClass = fontChoice === 'cormorant' 
    ? 'font-cormorant' 
    : fontChoice === 'playfair' 
      ? 'font-serif' 
      : 'font-editorial';

  const tags = [
    { label: 'Quiet Discipline', subtitle: 'Emotional Audit' },
    { label: 'Orderly Exits', subtitle: 'Predefined Targets' },
    { label: 'No Revenge Aping', subtitle: 'Post-Loss Cooldown' },
    { label: 'Radical Truth', subtitle: 'Conviction Scoring' },
    { label: 'Mindful Execution', subtitle: 'Trench Slang NLP' },
  ];

  const handleTagClick = (tagLabel: string, index: number) => {
    setSelectedTag(tagLabel);
    setIsClassifying(true);
    const msg = INITIAL_TRENCH_MESSAGES[index % INITIAL_TRENCH_MESSAGES.length];
    setTimeout(() => {
      setActiveMessage(msg);
      setCurrentMessageIndex(index % INITIAL_TRENCH_MESSAGES.length);
      setIsClassifying(false);
    }, 180);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setIsClassifying(true);
    setTimeout(() => {
      const parsed = parseTrenchMessage(customInput);
      setActiveMessage(parsed);
      setIsClassifying(false);
      setCustomInput('');
    }, 200);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        
        {/* Left Column: Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.85, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-2xl md:rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[480px] transition-all duration-300 ${
            isDark 
              ? 'velorah-card' 
              : 'bg-white border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.05)] backdrop-blur-md'
          }`}
        >
          <div>
            {/* Serif Title */}
            <h3 className={`${serifClass} text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Every trade is a mirror.
            </h3>

            {/* Subtext */}
            <p className={`mt-4 text-xs sm:text-sm font-sans-clean leading-relaxed max-w-md transition-colors duration-300 ${
              isDark ? 'text-white/65' : 'text-slate-600'
            }`}>
              Most trenchers lose not to bad charts, but to undisciplined minds. Nako turns your raw trade reflections into instant clarity—logging setups, catching FOMO before it spreads, and keeping your ego in check.
            </p>

            {/* Simple Glassmorphic Tag Pills */}
            <div className="mt-8 space-y-2.5">
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {tags.slice(0, 3).map((tag, idx) => {
                  const isSelected = selectedTag === tag.label;
                  return (
                    <button
                      key={tag.label}
                      onClick={() => handleTagClick(tag.label, idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-sans-clean border transition-all duration-200 cursor-pointer backdrop-blur-md select-none ${
                        isSelected 
                          ? (isDark ? 'border-white/80 bg-white/[0.15] text-white font-medium' : 'border-slate-900 bg-slate-900 text-white font-medium')
                          : (isDark ? 'border-white/50 hover:border-white/80 bg-white/[0.04] hover:bg-white/[0.09] text-white/85 hover:text-white' : 'border-slate-200 hover:border-slate-400 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950')
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {tags.slice(3, 5).map((tag, idx) => {
                  const isSelected = selectedTag === tag.label;
                  return (
                    <button
                      key={tag.label}
                      onClick={() => handleTagClick(tag.label, idx + 3)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-sans-clean border transition-all duration-200 cursor-pointer backdrop-blur-md select-none ${
                        isSelected 
                          ? (isDark ? 'border-white/80 bg-white/[0.15] text-white font-medium' : 'border-slate-900 bg-slate-900 text-white font-medium')
                          : (isDark ? 'border-white/50 hover:border-white/80 bg-white/[0.04] hover:bg-white/[0.09] text-white/85 hover:text-white' : 'border-slate-200 hover:border-slate-400 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950')
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            {/* Divider Line */}
            <div className={`w-full h-px my-8 transition-colors duration-300 ${
              isDark ? 'bg-white/10' : 'bg-slate-200'
            }`} />

            {/* Action Button */}
            <GlassButton size="md" onClick={onExploreFlow}>
              Open Trading Journal
            </GlassButton>
          </div>
        </motion.div>

        {/* Right Column: Visual Card with Starry Glow & Trench Classifier Intelligence */}
        <motion.div 
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`relative rounded-2xl md:rounded-3xl overflow-hidden flex flex-col justify-between min-h-[480px] shadow-2xl transition-all duration-300 ${
            isDark 
              ? 'border border-white/10 bg-[#070b14]' 
              : 'border border-slate-200/90 bg-white'
          }`}
        >
          {/* Card Atmospheric Background */}
          <div className="absolute inset-0 pointer-events-none">
            {isDark ? (
              <>
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse 90% 70% at 70% 30%, #0d1e3d 0%, #081122 55%, #05070c 100%)'
                  }}
                />
                <div 
                  className="absolute inset-0 opacity-60 mix-blend-screen"
                  style={{
                    backgroundImage: 'radial-gradient(1px 1px at 45px 35px, #ffffff, transparent), radial-gradient(1.5px 1.5px at 140px 95px, #ffffff, transparent), radial-gradient(1px 1px at 280px 40px, #ffffff, transparent), radial-gradient(1.5px 1.5px at 390px 180px, #ffffff, transparent)',
                    backgroundSize: '400px 300px'
                  }}
                />
                <div 
                  className="absolute -bottom-10 right-0 w-[80%] h-64 opacity-50"
                  style={{
                    background: 'radial-gradient(circle at 70% 70%, rgba(245, 175, 75, 0.45) 0%, rgba(210, 110, 45, 0.25) 40%, transparent 75%)',
                    filter: 'blur(35px)'
                  }}
                />
              </>
            ) : (
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse 90% 70% at 70% 20%, #e0f2fe 0%, #f0fdf4 40%, #ffffff 80%)'
                }}
              />
            )}
          </div>

          {/* Card Header */}
          <div className={`relative z-10 p-6 sm:p-7 flex items-center justify-between border-b backdrop-blur-sm transition-colors duration-300 ${
            isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[11px] font-sans-clean font-medium tracking-[0.18em] uppercase ${
                isDark ? 'text-white/70' : 'text-slate-700'
              }`}>
                Stoic Trade Audit · Real-Time Classifier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-sans-clean ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                {activeMessage.timestamp}
              </span>
            </div>
          </div>

          {/* Interactive Classification Display Body */}
          <div className="relative z-10 p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
            {/* Raw Degen Trench Callout */}
            <div className={`border rounded-xl p-4 backdrop-blur-md transition-colors duration-300 ${
              isDark 
                ? 'bg-white/[0.04] border-white/10' 
                : 'bg-slate-50/90 border-slate-200 shadow-xs'
            }`}>
              <div className={`text-[10px] font-sans-clean uppercase tracking-wider mb-1.5 flex items-center justify-between font-medium ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}>
                <span>Incoming Trench Trade Note</span>
                <span className={isDark ? 'text-white/80' : 'text-slate-800'}>
                  {activeMessage.chain} · <span className="font-sans-clean text-xs font-semibold">{activeMessage.token}</span>
                </span>
              </div>
              <p className={`text-xs sm:text-[13px] font-sans-clean leading-relaxed transition-opacity ${
                isClassifying ? 'opacity-30' : (isDark ? 'text-white/90' : 'text-slate-900')
              }`}>
                "{activeMessage.rawMessage}"
              </p>
            </div>

            {/* Nako Real-Time Classification Output */}
            <div className={`space-y-3 transition-opacity duration-200 ${isClassifying ? 'opacity-30' : 'opacity-100'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className={`border rounded-lg p-2.5 ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}>
                  <div className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    Setup Class
                  </div>
                  <div className={`text-xs font-sans-clean font-medium mt-0.5 truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {activeMessage.setupType}
                  </div>
                </div>

                <div className={`border rounded-lg p-2.5 ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}>
                  <div className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    Mental State
                  </div>
                  <div className={`text-xs font-sans-clean font-medium mt-0.5 truncate ${
                    activeMessage.psychologicalState.includes('FOMO') || activeMessage.psychologicalState.includes('Revenge')
                      ? 'text-rose-500 font-semibold' 
                      : 'text-emerald-500 font-semibold'
                  }`}>
                    {activeMessage.psychologicalState}
                  </div>
                </div>

                <div className={`col-span-2 sm:col-span-1 border rounded-lg p-2.5 ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}>
                  <div className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    Conviction Score
                  </div>
                  <div className="text-xs font-sans-clean font-semibold mt-0.5 flex items-center gap-1.5">
                    <span className={`font-nako-num font-bold text-sm ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                      {activeMessage.convictionScore} / 10
                    </span>
                    <span className={`text-xs font-nako-num font-bold ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      ({activeMessage.pnlPercentage > 0 ? `+${activeMessage.pnlPercentage}%` : `${activeMessage.pnlPercentage}%`})
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Edge / Mistake Analysis */}
              <div className={`border rounded-lg px-3.5 py-2.5 text-xs font-sans-clean flex items-start gap-2 ${
                isDark 
                  ? 'bg-white/[0.03] border-white/10 text-white/75' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <span className={isDark ? 'text-amber-400 select-none' : 'text-amber-600 select-none'}>✦</span>
                <span>
                  <strong className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Stoic Audit Note: 
                  </strong>
                  {' '}{activeMessage.keyMistakeOrEdge}
                </span>
              </div>
            </div>

            {/* Quick Test Bar */}
            <form onSubmit={handleCustomSubmit} className="pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Paste your raw trade: e.g. aped $PIPIN, held through dip, scaled out 2x..."
                  className={`flex-1 rounded-full px-4 py-2 text-xs outline-none transition-all font-sans-clean ${
                    isDark 
                      ? 'bg-black/50 border border-white/15 focus:border-white/40 text-white placeholder-white/40' 
                      : 'bg-slate-100 border border-slate-300 focus:border-slate-500 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <GlassButton size="sm" type="submit">
                  Audit
                </GlassButton>
              </div>
            </form>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
