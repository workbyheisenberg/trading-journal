import React, { useState } from 'react';
import { TrenchTradeMessage } from '../types';
import { INITIAL_TRENCH_MESSAGES, SETUP_ANALYTICS, SAMPLE_PROMPTS, parseTrenchMessage } from '../data/trenchData';
import { useTheme } from '../context/ThemeContext';

interface TrenchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'classifier' | 'journal' | 'analytics';
}

export const TrenchModal: React.FC<TrenchModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'classifier'
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<'classifier' | 'journal' | 'analytics'>(initialTab);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<TrenchTradeMessage[]>(INITIAL_TRENCH_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState<TrenchTradeMessage>(INITIAL_TRENCH_MESSAGES[0]);
  const [isParsing, setIsParsing] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('All');

  if (!isOpen) return null;

  const handleClassify = (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      const parsed = parseTrenchMessage(text);
      setMessages(prev => [parsed, ...prev]);
      setSelectedMessage(parsed);
      setIsParsing(false);
      setInputMessage('');
    }, 220);
  };

  const filteredMessages = filterTag === 'All' 
    ? messages 
    : messages.filter(m => m.setupType.toLowerCase().includes(filterTag.toLowerCase()) || m.psychologicalState.toLowerCase().includes(filterTag.toLowerCase()));

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 backdrop-blur-xl animate-in fade-in duration-200 ${
      isDark ? 'bg-black/85' : 'bg-slate-900/40'
    }`}>
      <div 
        className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col border rounded-2xl md:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#0b0e14] border-white/15 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Titlebar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className={`font-editorial text-xl font-normal ml-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Nako Terminal
            </span>
            <span className={`text-[10px] font-sans-clean font-medium px-2 py-0.5 rounded ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-slate-200/80 text-slate-700'
            }`}>
              v1.4 Trench Cognition
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher Pills */}
            <div className={`hidden sm:flex items-center p-0.5 rounded-full border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setTab('classifier')}
                className={`px-4 py-1 text-xs rounded-full transition-all cursor-pointer font-sans-clean ${
                  tab === 'classifier' 
                    ? (isDark ? 'bg-white/20 text-white' : 'bg-white text-slate-950 font-medium shadow-xs') 
                    : (isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Live Classifier
              </button>
              <button
                onClick={() => setTab('journal')}
                className={`px-4 py-1 text-xs rounded-full transition-all cursor-pointer font-sans-clean ${
                  tab === 'journal' 
                    ? (isDark ? 'bg-white/20 text-white' : 'bg-white text-slate-950 font-medium shadow-xs') 
                    : (isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Trade Journal ({messages.length})
              </button>
              <button
                onClick={() => setTab('analytics')}
                className={`px-4 py-1 text-xs rounded-full transition-all cursor-pointer font-sans-clean ${
                  tab === 'analytics' 
                    ? (isDark ? 'bg-white/20 text-white' : 'bg-white text-slate-950 font-medium shadow-xs') 
                    : (isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Alpha Analytics
              </button>
            </div>

            <button
              onClick={onClose}
              className={`px-3 py-1 text-xs rounded-full border font-sans-clean cursor-pointer transition-all ${
                isDark 
                  ? 'border-white/20 hover:border-white/40 text-white/80 bg-white/5' 
                  : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-slate-100'
              }`}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tab 1: Live Classifier */}
        {tab === 'classifier' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Input & Prompt Helpers */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-2">
                  <label className={`text-xs font-sans-clean font-medium flex items-center justify-between ${
                    isDark ? 'text-white/80' : 'text-slate-700'
                  }`}>
                    <span>Input Trench Message (Telegram call / Voice transcription)</span>
                    <span className="text-emerald-500 text-[11px] font-sans-clean font-medium">● NLP Agent Active</span>
                  </label>
                  <textarea
                    rows={4}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="e.g. aped 6 sol into $FARTCOIN at 1.2M mcap bonding curve dev dumped 30% held through dip sold at 5M +320%"
                    className={`w-full border rounded-xl p-3.5 text-xs outline-none transition-all font-sans-clean leading-relaxed ${
                      isDark 
                        ? 'bg-black/50 border-white/15 focus:border-white/40 text-white placeholder-white/40' 
                        : 'bg-slate-50 border-slate-300 focus:border-slate-500 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleClassify(inputMessage)}
                    disabled={isParsing || !inputMessage.trim()}
                    className={`px-6 py-2.5 text-xs rounded-full font-sans-clean font-medium border transition-all cursor-pointer disabled:opacity-40 ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 border-white/30 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                    }`}
                  >
                    {isParsing ? 'Parsing Trench Slang...' : 'Classify & Add to Journal'}
                  </button>

                  <span className={`text-[11px] font-sans-clean ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    Understands dev dumps, bonding curves, FOMO chases, & migrations
                  </span>
                </div>

                {/* Pre-made Trench Scenarios */}
                <div className="pt-2">
                  <p className={`text-[11px] font-sans-clean font-medium uppercase mb-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Click to load typical trench scenarios:
                  </p>
                  <div className="flex flex-col gap-2">
                    {SAMPLE_PROMPTS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputMessage(sample);
                          handleClassify(sample);
                        }}
                        className={`text-left border rounded-lg p-2.5 text-xs transition-all cursor-pointer font-sans-clean ${
                          isDark 
                            ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20 text-white/70 hover:text-white' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        <span className="text-amber-500 mr-1.5 font-bold">›</span> {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time Classification Tree Card */}
              <div className={`lg:col-span-5 flex flex-col border rounded-xl p-5 space-y-4 ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <span className={`text-xs font-sans-clean uppercase font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Nako Cognitive Audit
                  </span>
                  <span className="text-xs font-sans-clean text-emerald-500 font-semibold">
                    Confidence: 98.4%
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                      Setup Category
                    </span>
                    <div className={`text-sm font-sans-clean font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedMessage.setupType}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Mental State
                      </span>
                      <div className={`text-xs font-sans-clean font-medium mt-0.5 ${
                        selectedMessage.psychologicalState.includes('FOMO') || selectedMessage.psychologicalState.includes('Revenge')
                          ? 'text-rose-500 font-semibold' 
                          : 'text-emerald-500 font-semibold'
                      }`}>
                        {selectedMessage.psychologicalState}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Conviction Score
                      </span>
                      <div className={`text-xs font-sans-clean font-bold mt-0.5 ${
                        isDark ? 'text-amber-300' : 'text-amber-600'
                      }`}>
                        {selectedMessage.convictionScore} / 10
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Est. PnL (Sol)
                      </span>
                      <div className={`text-xs font-sans-clean font-bold mt-0.5 ${
                        selectedMessage.pnlSol >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {selectedMessage.pnlSol >= 0 ? `+${selectedMessage.pnlSol} SOL` : `${selectedMessage.pnlSol} SOL`}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Mcap Shift
                      </span>
                      <div className={`text-xs font-sans-clean font-medium mt-0.5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                        {selectedMessage.entryMcap} → {selectedMessage.exitMcap || 'Active'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-[10px] font-sans-clean uppercase font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                      Trench Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedMessage.tags.map((t, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-sans-clean font-medium ${
                          isDark ? 'bg-white/10 text-white/80' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`border rounded-lg p-3 mt-2 ${
                    isDark ? 'bg-white/[0.04] border-white/10' : 'bg-amber-50/80 border-amber-200'
                  }`}>
                    <span className={`text-[10px] font-sans-clean uppercase tracking-wide font-medium ${
                      isDark ? 'text-amber-400' : 'text-amber-700 font-semibold'
                    }`}>
                      AI Behavioral Feedback
                    </span>
                    <p className={`text-xs font-sans-clean mt-1 leading-relaxed ${
                      isDark ? 'text-white/80' : 'text-slate-800'
                    }`}>
                      {selectedMessage.keyMistakeOrEdge}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Trade Journal */}
        {tab === 'journal' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['All', 'Pump.fun', 'Raydium', 'FOMO', 'Revenge'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterTag(f)}
                    className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-all ${
                      filterTag === f 
                        ? (isDark ? 'bg-white/20 text-white border-white/40' : 'bg-slate-900 text-white border-slate-900 font-medium')
                        : (isDark ? 'text-white/60 border-white/10 hover:border-white/30' : 'text-slate-600 border-slate-200 hover:border-slate-300')
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className={`text-xs font-sans-clean font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                {filteredMessages.length} entries recorded
              </span>
            </div>

            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedMessage.id === msg.id 
                      ? (isDark ? 'bg-white/[0.08] border-white/30 shadow-md' : 'bg-slate-100 border-slate-400 shadow-xs') 
                      : (isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-sans-clean font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {msg.token}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans-clean font-medium ${
                        isDark ? 'bg-white/10 text-white/80' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {msg.setupType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans-clean font-medium ${
                        msg.psychologicalState.includes('FOMO') || msg.psychologicalState.includes('Revenge')
                          ? 'bg-rose-500/20 text-rose-500 font-medium'
                          : 'bg-emerald-500/20 text-emerald-600 font-medium'
                      }`}>
                        {msg.psychologicalState}
                      </span>
                    </div>
                    <div className={`font-sans-clean font-semibold ${msg.pnlPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {msg.pnlPercentage >= 0 ? `+${msg.pnlPercentage}% (+${msg.pnlSol} SOL)` : `${msg.pnlPercentage}% (${msg.pnlSol} SOL)`}
                    </div>
                  </div>
                  <p className={`text-xs font-sans-clean line-clamp-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    "{msg.rawMessage}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Alpha Analytics */}
        {tab === 'analytics' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <h3 className={`font-editorial text-2xl font-normal mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Trench Performance & Bias Attribution
              </h3>
              <p className={`text-xs font-sans-clean ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                Empirical breakdown of which setups make you money vs which emotional states drain your wallet.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`border rounded-xl p-4 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-sans-clean font-medium uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Net PnL
                </span>
                <div className="text-2xl font-sans-clean font-bold text-emerald-500 mt-1">+248.6 SOL</div>
                <span className={`text-[10px] font-sans-clean ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Across 249 trench trades
                </span>
              </div>

              <div className={`border rounded-xl p-4 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-sans-clean font-medium uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Best Win Setup
                </span>
                <div className={`text-2xl font-editorial font-normal mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Raydium Migrations
                </div>
                <span className="text-[10px] font-sans-clean text-emerald-500 font-medium">72.4% Win Rate</span>
              </div>

              <div className={`border rounded-xl p-4 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-sans-clean font-medium uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Worst Drain
                </span>
                <div className="text-2xl font-editorial font-normal text-rose-500 mt-1">
                  FOMO Top Chases
                </div>
                <span className="text-[10px] font-sans-clean text-rose-500 font-medium">-$116 SOL cumulative loss</span>
              </div>

              <div className={`border rounded-xl p-4 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-sans-clean font-medium uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Tilt Mitigation Index
                </span>
                <div className={`text-2xl font-sans-clean font-bold mt-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  84%
                </div>
                <span className={`text-[10px] font-sans-clean ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Disciplined cooldown adherence
                </span>
              </div>
            </div>

            {/* Setup Breakdown Table */}
            <div className={`border rounded-xl overflow-hidden ${
              isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white'
            }`}>
              <div className={`px-4 py-3 border-b text-xs font-sans-clean font-medium flex justify-between ${
                isDark ? 'bg-white/[0.03] border-white/10 text-white/50' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span>Setup Archetype</span>
                <span>Win Rate · Avg PnL · Profit Factor</span>
              </div>
              <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
                {SETUP_ANALYTICS.map((s) => (
                  <div key={s.setup} className="px-4 py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className={`font-medium font-sans-clean ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {s.setup}
                      </span>
                      <span className={`text-[11px] font-sans-clean ml-2 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        ({s.totalTrades} logged)
                      </span>
                    </div>
                    <div className="flex items-center gap-6 font-sans-clean">
                      <span className={s.winRate >= 50 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                        {s.winRate}% WR
                      </span>
                      <span className={isDark ? 'text-white/70' : 'text-slate-700'}>
                        {s.avgPnlSol > 0 ? `+${s.avgPnlSol} SOL` : `${s.avgPnlSol} SOL`}
                      </span>
                      <span className={isDark ? 'text-amber-300 font-semibold' : 'text-amber-600 font-semibold'}>
                        {s.profitFactor}x PF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
