import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalSession, JournalChatMessage, TradePosition } from '../types';
import { INITIAL_JOURNAL_SESSIONS } from '../data/journalData';
import {
  INITIAL_CURATED_POSITIONS,
  groupPositionsByPair
} from '../services/agentHarness';
import { dispatchGraphAgent } from '../services/apiClient';
import { useWeb3 } from '../context/Web3Context';
import { Mascot } from './Mascot';
import { TokenGateModal } from './TokenGateModal';

interface JournalPageProps {
  onBackToHome: () => void;
  onOpenAdmin?: () => void;
}

// Supporting API pill button with hover state to "Coming soon"
const ApiPillButton: React.FC<{ label: string }> = ({ label }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shrink-0 border border-slate-200/80 bg-white/40 hover:bg-white/70 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs select-none backdrop-blur-xs"
    >
      {isHovered ? 'Coming soon' : label}
    </button>
  );
};

// Inline Markdown Parser for bold and italic text
const renderInlineText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// Formatted AI message component supporting headers, bullets, numbered lists, and bold text
const FormattedAiMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-0.5" />;
        }

        // Heading 3 (e.g. ### Cognitive Trade Audit: **$PIPIN**)
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h3 key={idx} className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight pt-1.5 pb-0.5">
              {renderInlineText(headingText)}
            </h3>
          );
        }

        // Bullet point (e.g. * **Key Strength:** ...)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^(\*|-)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 sm:pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex-1 text-slate-800 leading-normal">
                {renderInlineText(bulletText)}
              </div>
            </div>
          );
        }

        // Numbered list (e.g. 1. **Raydium Migrations:** ...)
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 sm:pl-1 py-0.5">
              <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 min-w-3.5 mt-0.5">
                {numberMatch[1]}.
              </span>
              <div className="flex-1 text-slate-800 leading-normal">
                {renderInlineText(numberMatch[2])}
              </div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-800 leading-relaxed">
            {renderInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const JournalPage: React.FC<JournalPageProps> = ({ onBackToHome, onOpenAdmin }) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Curated Trade Positions Store (automatically maintained by AI Agent Harness)
  const [positions, setPositions] = useState<TradePosition[]>(INITIAL_CURATED_POSITIONS);

  // Expanded Trade Pairs State
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});

  // Always start with an empty welcoming session by default
  const [sessions, setSessions] = useState<JournalSession[]>(() => [
    {
      id: 'welcome-session-active',
      title: 'New Trade Entry / Query',
      dateCategory: 'Today',
      timestamp: 'Just now',
      preview: 'Initiate a query or command...',
      sessionType: 'general_query',
      messages: []
    },
    ...INITIAL_JOURNAL_SESSIONS
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('welcome-session-active');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState<boolean>(false);

  // Global Robinhood Web3 State & Token Gate
  const {
    walletAddress,
    solBalance,
    tokenBalance,
    isConnected,
    hasAccess,
    minTokenRequired,
    tokenSymbol,
    contractAddress,
    openWalletModal,
    connectDemoWallet,
    setCustomTokenBalance,
    formatAddress
  } = useWeb3();

  // Chat History Sorting & Filtering State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [filterCategory, setFilterCategory] = useState<'all' | 'open' | 'closed'>('all');
  const [showSortFilterMenu, setShowSortFilterMenu] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const hasMessages = activeSession && activeSession.messages && activeSession.messages.length > 0;

  // Find if current active session is bound to a curated trade position
  const activePosition = positions.find(
    (p) => p.sessionId === activeSession?.id || p.id === activeSession?.positionId
  ) || null;

  // Responsive window listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (hasMessages) {
      scrollToBottom();
    }
  }, [activeSession?.messages, isThinking, hasMessages]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputMessage]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Trader';
    if (hour < 18) return 'Good Afternoon, Trader';
    return 'Good Evening, Trader';
  };

  // Toggle expanding a pair's position list
  const togglePairExpand = (pairTicker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPairs((prev) => ({
      ...prev,
      [pairTicker]: !prev[pairTicker]
    }));
  };

  // Handle user submitting message through AI Agent Graph Pipeline
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isThinking) return;

    // Token gate: the input is always accessible, the gate is enforced on send
    if (!hasAccess) {
      setIsGateModalOpen(true);
      return;
    }

    const currentTargetId = activeSession?.id || activeSessionId;

    const userMessage: JournalChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text
    };

    // Optimistically append user message to target session
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === currentTargetId);
      if (exists) {
        return prev.map((s) => {
          if (s.id === currentTargetId) {
            return {
              ...s,
              preview: text.slice(0, 45) + '...',
              messages: [...s.messages, userMessage]
            };
          }
          return s;
        });
      } else {
        const freshSession: JournalSession = {
          id: currentTargetId,
          title: text.slice(0, 32) + '...',
          dateCategory: 'Today',
          timestamp: 'Just now',
          preview: text.slice(0, 45) + '...',
          sessionType: 'general_query',
          messages: [userMessage]
        };
        return [freshSession, ...prev];
      }
    });

    setInputMessage('');
    setIsThinking(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Execute through the Full-Stack Agent Workflow Graph
      const result = await dispatchGraphAgent(text, positions, activePosition);

      // 1. If a new position was created from graph entity extraction
      if (result.newPosition) {
        setPositions((prev) => [result.newPosition!, ...prev]);
        setExpandedPairs((prev) => ({
          ...prev,
          [result.newPosition!.pairTicker]: true
        }));
      }

      // 2. If an existing position was updated
      if (result.updatedPosition) {
        setPositions((prev) =>
          prev.map((p) => (p.id === result.updatedPosition!.id ? result.updatedPosition! : p))
        );
      }

      const assistantMessage: JournalChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: result.replyContent,
        reasoningTime: `${(result.totalTimeMs / 1000).toFixed(2)}s`,
        tradeData: result.tradeData,
        intent: result.intent,
        updatedPosition: result.updatedPosition || result.newPosition,
        quickActionChips: result.quickActionChips,
        graphTrace: result.graphTrace
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentTargetId) {
            const newTitle =
              s.title === 'New Trade Entry / Query' || s.title === 'New Audit Session'
                ? (result.summaryTitle || (result.pairTicker ? `${result.pairTicker} Trade` : text.slice(0, 32) + '...'))
                : s.title;

            return {
              ...s,
              title: newTitle,
              pairTicker: result.pairTicker || s.pairTicker,
              positionId: result.newPosition?.id || result.updatedPosition?.id || s.positionId,
              sessionType:
                result.intent === 'ANALYTICAL_QUERY' || result.intent === 'RECORD_ASSIST' || result.intent === 'GENERAL_CHAT'
                  ? 'general_query'
                  : result.pairTicker
                  ? 'pair_position'
                  : s.sessionType,
              messages: [...s.messages, assistantMessage]
            };
          }
          return s;
        })
      );
    } catch (err) {
      console.error('[Graph Execution Error]:', err);
    } finally {
      setIsThinking(false);
    }
  };

  // Start a new trade entry or general query
  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: JournalSession = {
      id: newSessionId,
      title: 'New Trade Entry / Query',
      dateCategory: 'Today',
      timestamp: 'Just now',
      preview: 'Initiate a query or command...',
      sessionType: 'general_query',
      messages: []
    };
    setSessions([newSession, ...sessions.filter((s) => s.messages.length > 0)]);
    setActiveSessionId(newSessionId);
    setInputMessage('');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Open a specific position's conversation
  const handleOpenPositionSession = (pos: TradePosition) => {
    const existing = sessions.find((s) => s.id === pos.sessionId || s.positionId === pos.id);
    if (existing) {
      setActiveSessionId(existing.id);
    } else {
      // Create a linked session if it didn't exist
      const newSessionId = `session-pos-${pos.id}`;
      const newSession: JournalSession = {
        id: newSessionId,
        title: `${pos.pairTicker} (${pos.setupType})`,
        pairTicker: pos.pairTicker,
        positionId: pos.id,
        sessionType: 'pair_position',
        dateCategory: 'Today',
        timestamp: pos.openedAt,
        preview: pos.conciseSummary,
        messages: [
          {
            id: `msg-${pos.id}-init`,
            role: 'assistant',
            timestamp: pos.openedAt,
            content: `### Active Position Memory: **${pos.pairTicker}**\n\n* **Status:** **${pos.status}**\n* **Entry:** ${pos.initialSizeSol} SOL @ ${pos.entryMcap}\n* **Realized PnL:** **${pos.realizedPnlSol >= 0 ? `+${pos.realizedPnlSol}` : pos.realizedPnlSol} SOL** (${pos.totalPnlPercentage >= 0 ? `+${pos.totalPnlPercentage}%` : `${pos.totalPnlPercentage}%`})\n* **Curated Action Summary:** *${pos.conciseSummary}*\n\nYou can continue this conversation by reporting updates (e.g. *"sold 50% at 3x"*, *"moved stop to breakeven"*). The harness will update this position and its metrics in memory.`
          }
        ]
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSessionId);
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      handleNewChat();
      return;
    }
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Group positions by pair ticker ($PIPIN / SOL, $CHILL / SOL, etc.)
  const pairGroups = groupPositionsByPair(
    positions.filter((p) => {
      if (filterCategory === 'all') return true;
      if (filterCategory === 'open') return p.status === 'OPEN' || p.status === 'PARTIAL';
      if (filterCategory === 'closed') return p.status === 'CLOSED';
      return true;
    })
  );

  // General analytical query sessions (sessions not bound to a specific pair)
  const generalSessions = sessions.filter(
    (s) => s.messages.length > 0 && s.sessionType === 'general_query' && !s.pairTicker
  );

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-white text-slate-900 font-sans-clean overflow-hidden select-none relative">
      
      {/* ─────────────────────────────────────────────────────────────
          MOBILE BACKDROP OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN RESPONSIVE SIDEBAR: TRADE HISTORY & PAIRINGS
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: 270, opacity: 1 }}
            exit={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full border-r border-slate-100 bg-[#fbfbfd] flex flex-col justify-between shrink-0 overflow-hidden ${
              isMobile
                ? 'fixed inset-y-0 left-0 z-40 w-[280px] shadow-2xl'
                : 'relative z-20 w-[270px]'
            }`}
          >
            {/* Top Section */}
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-3.5 py-4 scrollbar-none">
              
              {/* Header: Brand Name + Sidebar Collapse Button */}
              <div className="flex items-start justify-between mb-4 px-1.5">
                <div>
                  <div
                    className="flex items-center gap-1.5 cursor-pointer group"
                    onClick={onBackToHome}
                    title="Return to homepage"
                  >
                    <span className="font-editorial text-2xl font-normal text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      Mumus
                    </span>
                    <span className="text-[10px] font-sans font-light text-slate-400">®</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans-clean mt-0.5">
                    Harness & Cognitive Ledger
                  </p>
                </div>

                {/* Sidebar Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  title="Close sidebar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* [+] New Trade / Entry Button */}
              <div className="mb-4 px-1">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>New Entry / Audit</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">⌘K</span>
                </button>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TRADE HISTORY HEADER WITH SORTING & FILTERING
                 ───────────────────────────────────────────────────────────── */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2 py-1 mb-1 relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-xs font-semibold">
                      Trade History
                    </span>
                  </div>

                  {/* Filter and Sort Button on the Right */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSortFilterMenu(!showSortFilterMenu)}
                      title="Sort and filter trade history"
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer flex items-center gap-1 ${
                        filterCategory !== 'all' || sortOrder !== 'newest' ? 'text-indigo-600 bg-indigo-50/50' : ''
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Dropdown Menu for Sort and Filter */}
                    {showSortFilterMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 space-y-2 text-xs animate-in fade-in zoom-in-95">
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Status Filter
                          </div>
                          <div className="space-y-0.5">
                            {[
                              { id: 'all', label: 'All Positions' },
                              { id: 'open', label: 'Open / Partial' },
                              { id: 'closed', label: 'Closed' }
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setFilterCategory(f.id as any);
                                  setShowSortFilterMenu(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                  filterCategory === f.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <span>{f.label}</span>
                                {filterCategory === f.id && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Sort
                          </div>
                          <div className="space-y-0.5">
                            {[
                              { id: 'newest', label: 'Newest First' },
                              { id: 'oldest', label: 'Oldest First' }
                            ].map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSortOrder(s.id as any);
                                  setShowSortFilterMenu(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                  sortOrder === s.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <span>{s.label}</span>
                                {sortOrder === s.id && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    TRADE HISTORY LIST: PAIRING DESIGN WITH OVERLAPPING CIRCLES
                    AND EXPANDABLE OPENED POSITIONS LIST (INDENTED)
                   ───────────────────────────────────────────────────────────── */}
                <div className="space-y-1 overflow-y-auto scrollbar-none flex-1 pr-0.5">
                  {pairGroups.map((group) => {
                    const isExpanded = !!expandedPairs[group.pairTicker];
                    const netGroupPnl = group.positions.reduce((acc, p) => acc + p.realizedPnlSol, 0);
                    const openCount = group.positions.filter((p) => p.status !== 'CLOSED').length;

                    return (
                      <div key={group.pairTicker} className="rounded-xl transition-all">
                        {/* Parent Trade History Item (Pairing Ticker Header) */}
                        <div
                          onClick={(e) => togglePairExpand(group.pairTicker, e)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs cursor-pointer transition-colors group ${
                            isExpanded ? 'bg-slate-100/70 text-slate-900' : 'text-slate-600 hover:bg-slate-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            {/* Low contrast AI star icon */}
                            <svg
                              className="w-3 h-3 text-slate-300 fill-slate-300 group-hover:text-indigo-400 group-hover:fill-indigo-400 shrink-0 transition-colors"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z" />
                            </svg>

                            {/* Two overlapping circles ala usual trading pairing design */}
                            <div className="flex items-center shrink-0">
                              {/* Circle 1: Token logo/color circle */}
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold z-10 ${group.color} shadow-2xs`}>
                                {group.token.replace('$', '').slice(0, 1)}
                              </div>
                              {/* Circle 2: Base Token USD (Robinhood emerald gradient), overlapping with -ml-1.5 */}
                              <div className="-ml-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border border-white ring-1 ring-black/5 shadow-2xs z-20">
                                $
                              </div>
                            </div>

                            {/* Pairing ticker text: Uses clean Pretendard */}
                            <span className="font-sans-clean text-xs font-semibold text-slate-800 truncate">
                              {group.pairTicker}
                            </span>
                          </div>

                          {/* Right: Expand caret */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Caret indicating expandable state */}
                            <svg
                              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90 text-slate-700' : ''
                              }`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </div>

                        {/* Expandable Child Positions (Indented for contrast) */}
                        {isExpanded && (
                          <div className="pl-5 ml-4 border-l-2 border-slate-200/80 my-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            {group.positions.map((pos) => {
                              const isPosActive =
                                activeSession?.id === pos.sessionId ||
                                activeSession?.positionId === pos.id ||
                                activePosition?.id === pos.id;

                              return (
                                <div
                                  key={pos.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPositionSession(pos);
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between group ${
                                    isPosActive
                                      ? 'bg-indigo-50 text-indigo-900 font-medium shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        pos.status === 'OPEN'
                                          ? 'bg-emerald-500'
                                          : pos.status === 'PARTIAL'
                                          ? 'bg-amber-500'
                                          : 'bg-slate-300'
                                      }`}
                                    />
                                    <span className="truncate text-[11px]">
                                      {pos.setupType}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <span
                                      className={`text-[11px] font-sans-clean font-medium ${
                                        pos.realizedPnlSol >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                      }`}
                                    >
                                      {pos.realizedPnlSol >= 0 ? `+${pos.realizedPnlSol}` : pos.realizedPnlSol} SOL
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state — no trades recorded yet */}
                  {pairGroups.length === 0 && (
                    <div className="px-3 py-8 text-center select-none">
                      <div className="text-[11px] font-sans-clean text-slate-400 leading-relaxed">
                        No trades recorded yet.
                        <br />
                        Journal your first trade to build your history.
                      </div>
                    </div>
                  )}

                  {/* General Analytical Inquiries & Reviews (e.g. Weekly Summary) */}
                  {generalSessions.length > 0 && (
                    <div className="pt-3 mt-2 border-t border-slate-100">
                      <div className="px-2 py-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                        Analytical Inquiries
                      </div>
                      <div className="space-y-0.5">
                        {generalSessions.map((session) => {
                          const isActive = session.id === activeSessionId;
                          return (
                            <div
                              key={session.id}
                              onClick={() => handleSelectSession(session.id)}
                              className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-slate-100 text-slate-800 font-medium'
                                  : 'text-slate-400 hover:bg-slate-100/60 hover:text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <svg
                                  className={`w-3 h-3 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                <span className="truncate text-[11px]">{session.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5"
                                title="Delete session"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer: Robinhood Account & Token Gate Status */}
            <div className="p-3 border-t border-slate-100 bg-[#fbfbfd] space-y-2">
              {walletAddress ? (
                <div 
                  onClick={openWalletModal}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        hasAccess ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        hasAccess ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></span>
                    </span>
                    <div className="min-w-0">
                      <div className="font-editorial text-sm tracking-[0.06em] text-slate-900 truncate">
                        {formatAddress(walletAddress)}
                      </div>
                      <div className="text-[11px] font-sans-clean text-slate-500 tracking-tight">
                        {tokenBalance.toLocaleString()} {tokenSymbol}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold font-sans-clean tracking-wide">
                    Manage
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openWalletModal}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 text-xs font-sans-clean transition-all shadow-2xs cursor-pointer group tracking-wide"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-slate-800 transition-colors" />
                  <span>Connect Robinhood</span>
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN STAGE (Subtle cyan-white moving gradient across ALL sections)
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden animate-cyan-white-flow">
        
        {/* Top Header: Responsive buttons, Static "powered by Muse 1.3", "+ New Trade" */}
        <header className="h-14 px-3 sm:px-6 flex items-center justify-between shrink-0 bg-transparent z-10 border-b border-black/[0.04]">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar menu"
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-black/5 rounded-lg transition-colors cursor-pointer md:hidden"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Desktop Sidebar Toggle Button (only when collapsed) */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
                className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-lg transition-colors cursor-pointer mr-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M14 9l3 3-3 3" />
                </svg>
              </button>
            )}

            {/* Static "powered by Muse 1.3" */}
            <div className="flex items-baseline gap-1 sm:gap-1.5 select-none">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-sans-clean font-medium">
                powered by
              </span>
              <span className="font-editorial text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                Muse 1.3
              </span>
            </div>
          </div>

          {/* Top Right: New Entry & Back to Landing Page */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="hidden xs:inline">New Entry</span>
              <span className="xs:hidden">New</span>
            </button>

            <button
              type="button"
              onClick={onBackToHome}
              title="Back to Landing Page"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
          </div>
        </header>

        {/* Center Stage: Welcoming View OR Active Chat Thread */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 flex flex-col scrollbar-none bg-transparent">
          {!hasMessages ? (
            /* ─────────────────────────────────────────────────────────────
               WELCOMING VIEW: With Sample Agent Harness Queries
               ───────────────────────────────────────────────────────────── */
            <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center items-center py-6 sm:py-8">
              
              {/* Official mascot above the welcome headline */}
              <div className="mb-1 sm:mb-2">
                <Mascot className="h-28 sm:h-32" imgClassName="h-24 sm:h-28" />
              </div>

              {/* Headings */}
              <div className="text-center mb-6 px-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
                  {getGreeting()}
                </h1>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 mt-1">
                  How Can I{' '}
                  <span className="text-[#3b82f6] font-semibold">
                    Audit Your Trading Today?
                  </span>
                </h2>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  AI CHATBOT INPUT (always accessible — token gate checked on send)
                 ───────────────────────────────────────────────────────────── */}
                <div className="w-full relative px-1 sm:px-0">
                  <div className="w-full relative rounded-2xl bg-transparent border border-slate-300/60 shadow-[0_2px_12px_-3px_rgba(186,230,253,0.35)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(186,230,253,0.55),0_10px_25px_-5px_rgba(125,211,252,0.3)] hover:border-sky-300/90 focus-within:shadow-[0_20px_50px_-10px_rgba(186,230,253,0.55),0_10px_25px_-5px_rgba(125,211,252,0.3)] focus-within:border-sky-300/90">
                    
                    {/* Top Prompt line: Hides when input is focused or has text */}
                    {!isInputFocused && !inputMessage.trim() && (
                      <div className="pt-3 px-3.5 sm:px-4 text-xs text-slate-400 select-none pointer-events-none transition-opacity truncate">
                        Enter a trade, update an active position, or ask for weekly summary...
                      </div>
                    )}

                    {/* Textarea */}
                    <div className={`px-3.5 sm:px-4 pb-1 ${isInputFocused || inputMessage.trim() ? 'pt-3' : 'pt-0.5'}`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={2}
                        placeholder=""
                        className="w-full bg-transparent resize-none outline-none text-slate-800 text-base sm:text-sm leading-relaxed"
                      />
                    </div>

                    {/* Bottom Toolbar inside Chatbot Input */}
                    <div className="px-3 sm:px-4 pb-2.5 pt-1 flex items-center justify-between gap-2">
                      {/* Left: Scrollable Attachment + API Pills */}
                      <div className="flex items-center gap-1.5 py-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg shrink-0 border border-slate-200/80 bg-white/40 hover:bg-white/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs backdrop-blur-xs"
                          title="Attach file or screenshot"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                        </button>

                        <ApiPillButton label="FOMO API" />
                        <ApiPillButton label="GMGN API" />
                      </div>

                      {/* Right: Send Button with NO Background */}
                      <button
                        type="button"
                        disabled={!inputMessage.trim()}
                        onClick={() => handleSendMessage()}
                        className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                          inputMessage.trim()
                            ? 'text-slate-900 hover:text-blue-600'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title="Send message"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

              {/* Quick Sample Prompts for Agent Harness (No backgrounds, no icons) */}
              <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  {
                    label: "Assist me to record or journal a trade",
                    prompt: "assist to record or journaling a trade"
                  },
                  {
                    label: "How's the summary and my journal for this week?",
                    prompt: "how's the summary and my journal for this week"
                  },
                  {
                    label: "Aped 4 sol into $PIPIN at 720k bonding curve...",
                    prompt: "aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M"
                  },
                  {
                    label: "Sold 50% at 3x, moved stop to breakeven",
                    prompt: "sold 50% at 3x, moved stop to breakeven leaving runner to valhalla"
                  }
                ].map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 rounded-xl border border-slate-200/70 bg-transparent hover:bg-slate-100/50 text-xs text-slate-700 hover:text-slate-950 transition-all text-left cursor-pointer hover:border-slate-300 flex items-center justify-between group"
                  >
                    <span className="truncate pr-1">{item.label}</span>
                    <span className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0">→</span>
                  </button>
                ))}
              </div>

            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               ACTIVE CONVERSATION THREAD: WITH CURATED POSITION CARD
               ───────────────────────────────────────────────────────────── */
            <div className="max-w-2xl w-full mx-auto py-4 sm:py-6 space-y-4 sm:space-y-5 flex-1">
              
              {/* Linked Curated Position Summary Card (if active session belongs to a position) */}
              {activePosition && (
                <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.04]">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 2 Overlapping Circles */}
                      <div className="flex items-center shrink-0">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-indigo-600 shadow-2xs">
                          {activePosition.token.replace('$', '').slice(0, 1)}
                        </div>
                        <div className="-ml-2 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white bg-gradient-to-tr from-emerald-600 to-teal-400 border border-white ring-1 ring-black/5 shadow-2xs z-10">
                          $
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="font-sans-clean font-semibold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                          {activePosition.pairTicker}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activePosition.setupType} · Opened {activePosition.openedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          activePosition.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activePosition.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {activePosition.status}
                      </span>
                      <span
                        className={`text-xs font-sans-clean font-semibold ${
                          activePosition.realizedPnlSol >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {activePosition.realizedPnlSol >= 0 ? `+${activePosition.realizedPnlSol}` : activePosition.realizedPnlSol} SOL
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800 mr-1.5">Curated Action Summary:</span>
                    <span className="italic">{activePosition.conciseSummary}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-black/[0.03]">
                    <span>Initial: <strong className="text-slate-800 font-sans-clean font-medium text-[11px]">{activePosition.initialSizeSol} SOL</strong></span>
                    <span>Remaining: <strong className="text-slate-800 font-sans-clean font-medium text-[11px]">{activePosition.remainingSizeSol} SOL</strong></span>
                    <span>Events: <strong className="text-slate-800 font-sans-clean font-medium text-[11px]">{activePosition.events.length} actions</strong></span>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {activeSession.messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-semibold shrink-0 mt-0.5">
                        M
                      </div>
                    )}

                    <div className={`max-w-[92%] sm:max-w-[85%] space-y-1.5 sm:space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                      {!isUser && message.reasoningTime && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Audited in {message.reasoningTime}</span>
                          {message.intent && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold ${
                                message.intent === 'RECORD_ASSIST'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : message.intent === 'NEW_TRADE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : message.intent === 'ANALYTICAL_QUERY'
                                  ? 'bg-purple-100 text-purple-800'
                                  : message.intent === 'UPDATE_POSITION'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {message.intent.replace('_', ' ')}
                            </span>
                          )}
                          {message.graphTrace && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 bg-white/70 border border-slate-200/80 shadow-2xs">
                              <span className="text-indigo-600 font-bold">⚡ Graph:</span>
                              <span>{message.graphTrace.executionPath.join(' ➔ ')}</span>
                              <span className="text-slate-400">({message.graphTrace.totalTimeMs}ms)</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`text-xs sm:text-sm leading-relaxed rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 border-0 shadow-none transition-all break-words ${
                          isUser
                            ? 'bg-white text-black'
                            : 'bg-white/10 backdrop-blur-md text-slate-900'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-line">{message.content}</p>
                        ) : (
                          <FormattedAiMessage content={message.content} />
                        )}
                      </div>

                      {/* Quick Action / Template Chips */}
                      {!isUser && message.quickActionChips && message.quickActionChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {message.quickActionChips.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              type="button"
                              onClick={() => handleSendMessage(chip.prompt)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-white/70 hover:bg-white text-slate-700 hover:text-indigo-600 text-[11px] font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 hover:border-indigo-200"
                            >
                              <span>{chip.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Trade Audit breakdown card */}
                      {!isUser && message.tradeData && (
                        <div className="rounded-2xl p-2.5 sm:p-3 bg-white/20 backdrop-blur-md shadow-none space-y-1.5 sm:space-y-2 text-xs border-0">
                          <div className="flex items-center justify-between pb-1.5 border-b border-black/5 gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <span className="font-bold text-slate-900 truncate">{message.tradeData.token}</span>
                              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-white/40 text-slate-800 font-medium whitespace-nowrap">
                                {message.tradeData.setupType}
                              </span>
                            </div>
                            <span className={`font-semibold shrink-0 text-[11px] sm:text-xs ${message.tradeData.pnlPercentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {message.tradeData.pnlPercentage >= 0 ? `+${message.tradeData.pnlPercentage}%` : `${message.tradeData.pnlPercentage}%`} ({message.tradeData.pnlSol} SOL)
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] text-slate-700 pt-0.5">
                            <div>
                              <span className="text-slate-500 block text-[9px] sm:text-[10px]">State</span>
                              <span className="font-medium text-slate-900 truncate block">{message.tradeData.psychologicalState}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] sm:text-[10px]">Conviction</span>
                              <span className="font-medium text-slate-900">{message.tradeData.convictionScore} / 10</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`text-[9px] sm:text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                        {message.timestamp}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-semibold shrink-0 mt-0.5">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-semibold animate-pulse">
                    M
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border-0 shadow-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                    <span>Harness extracting data & updating memory...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Docked Bottom Chatbot Input (Active Chat Mode) */}
        {hasMessages && (
          <div className="shrink-0 p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-transparent border-t border-black/[0.04]">
              <div className="max-w-2xl mx-auto">
                <div className="rounded-2xl bg-transparent border border-slate-300/60 shadow-[0_2px_12px_-3px_rgba(186,230,253,0.35)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(186,230,253,0.55),0_10px_25px_-5px_rgba(125,211,252,0.3)] hover:border-sky-300/90 focus-within:shadow-[0_20px_50px_-10px_rgba(186,230,253,0.55),0_10px_25px_-5px_rgba(125,211,252,0.3)] focus-within:border-sky-300/90">
                  <div className="px-3 sm:px-3.5 pt-2.5 sm:pt-3 pb-1">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={1}
                      placeholder={
                        activePosition
                          ? `Continue ${activePosition.pairTicker}: update action (e.g. "sold 50% at 3x", "moved stop")...`
                          : "Enter a trade, update position, or ask for summary..."
                      }
                      className="w-full bg-transparent resize-none outline-none text-slate-800 placeholder-slate-400 text-base sm:text-sm leading-relaxed"
                    />
                  </div>

                  <div className="px-3 sm:px-3.5 pb-2 pt-1 flex items-center justify-between gap-2 border-t border-black/[0.03]">
                    {/* Left: Scrollable Attachment & API pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1">
                      <button
                        type="button"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                        title="Attach"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>
                      <ApiPillButton label="FOMO API" />
                      <ApiPillButton label="GMGN API" />
                    </div>

                    {/* Send Button without background */}
                    <button
                      type="button"
                      disabled={!inputMessage.trim()}
                      onClick={() => handleSendMessage()}
                      className={`p-1 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                        inputMessage.trim()
                          ? 'text-slate-900 hover:text-blue-600'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}

      </main>

      {/* Token gate notice (light mode) — shown when sending without enough $MUMUS */}
      <TokenGateModal isOpen={isGateModalOpen} onClose={() => setIsGateModalOpen(false)} />
    </div>
  );
};
