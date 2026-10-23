import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { motion } from 'motion/react';
import { GlassButton } from './GlassButton';

interface AdminPageProps {
  onBackToHome: () => void;
  onGoToJournal: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToHome, onGoToJournal }) => {
  const {
    contractAddress,
    tokenSymbol,
    minTokenRequired,
    updateContractAddress
  } = useWeb3();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nako_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [newCA, setNewCA] = useState<string>(contractAddress);
  const [newSymbol, setNewSymbol] = useState<string>(tokenSymbol);
  const [newMinTokens, setNewMinTokens] = useState<number>(minTokenRequired);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'farmerpemula') {
      setIsAuthenticated(true);
      sessionStorage.setItem('nako_admin_auth', 'true');
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect authentication password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('nako_admin_auth');
    setPasswordInput('');
  };

  const handleSaveCA = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCA = newCA.trim();
    if (!cleanCA) {
      setErrorMsg('Please enter a valid contract address or token identifier.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const ok = await updateContractAddress(cleanCA, newSymbol.trim() || '$NAKO', newMinTokens || 500000);
      if (ok) {
        setSuccessMsg('Contract Address updated live across the landing page and chat gate.');
        setTimeout(() => setSuccessMsg(''), 4500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update Contract Address.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. REFINED LUXURY LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050608] text-[#e8eaee] flex flex-col items-center justify-center p-6 selection:bg-white/20 relative overflow-hidden">
        {/* Subtle radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm bg-[#0a0d13]/90 border border-white/10 rounded-3xl p-8 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl space-y-6 text-center"
        >
          {/* Brand Wordmark */}
          <div className="space-y-1.5">
            <div className="font-editorial text-3xl font-normal tracking-tight text-white flex items-baseline justify-center">
              <span>Nako</span>
              <span className="text-[10px] font-sans font-light ml-0.5 opacity-70">®</span>
            </div>
            <div className="text-xs font-sans-clean text-white/45">
              Administrative Access Portal
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-sans-clean text-white/60 mb-2">
                Access Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter password..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-white/30 text-xs font-sans-clean outline-none focus:border-white/40 focus:bg-white/[0.07] transition-all"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-sans-clean text-rose-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-full font-sans-clean font-medium text-xs tracking-wide text-white border border-[#e25a3e]/70 hover:border-[#e25a3e] bg-[#ad3822]/90 hover:bg-[#ad3822] backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg shadow-[#ad3822]/20 active:scale-[0.98]"
            >
              Sign In to Admin
            </button>
          </form>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs font-sans-clean text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Landing Page
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED ADMIN DASHBOARD (NAKO DESIGN SYSTEM)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050608] text-[#e8eaee] flex flex-col selection:bg-white/20">
      {/* Top Navbar: Follows Top Bar Contract */}
      <header className="border-b border-white/10 bg-[#07090e]/85 backdrop-blur-md px-6 sm:px-10 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="font-editorial text-2xl font-normal tracking-tight text-white flex items-baseline cursor-pointer"
            >
              <span>Nako</span>
              <span className="text-[10px] font-sans font-light ml-0.5 opacity-70">®</span>
            </button>
            <span className="text-white/25">/</span>
            <span className="text-xs font-sans-clean text-white/60 tracking-wide">
              Contract Admin
            </span>
          </div>

          {/* Zone 2: Quiet unboxed metadata */}
          <div className="hidden md:flex items-center gap-2 text-xs font-sans-clean text-white/45">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Robinhood Uplink</span>
            <span aria-hidden="true">·</span>
            <span>Live Gate Active</span>
          </div>

          {/* Zone 3: Navigation Actions */}
          <div className="flex items-center gap-3">
            <GlassButton size="sm" onClick={onBackToHome}>
              Landing Page
            </GlassButton>
            <GlassButton size="sm" onClick={onGoToJournal}>
              Open Journal
            </GlassButton>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-sans-clean text-white/50 hover:text-white transition-colors ml-2 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-14 space-y-10">
        
        {/* Page Title & Editorial Header */}
        <div className="space-y-2">
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Robinhood Contract & Access Control
          </h1>
          <p className="text-xs sm:text-sm font-sans-clean text-white/50 max-w-2xl leading-relaxed">
            Manage the active Robinhood Chain token contract address (CA, 0x…) and holding threshold. Changes propagate instantly to the landing page carousel and enforce the access gate on the Nako AI Cognitive Trading Journal.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-sans-clean flex items-center justify-between backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium">{successMsg}</span>
            </div>
          </motion.div>
        )}

        {/* Current Active Token Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/[0.025] border border-white/10 backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="text-[11px] font-sans-clean text-white/45 tracking-wide">
                Active Configuration
              </div>
              <h2 className="font-editorial text-2xl font-normal text-white mt-0.5">
                Current Token Contract
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://robinhood.com/crypto"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-sans-clean text-white/75 hover:text-white transition-colors"
              >
                Robinhood Crypto ↗
              </a>
              <a
                href={`https://dexscreener.com/search?q=${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-sans-clean text-white/75 hover:text-white transition-colors"
              >
                Chart & Screener ↗
              </a>
            </div>
          </div>

          {/* Details Row */}
          <div className="p-5 rounded-2xl bg-[#090b10] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-sans-clean text-white/40">
                Contract / Asset Identifier (CA)
              </div>
              <code className="text-xs sm:text-sm font-mono-code tabular-nums text-emerald-400 break-all select-all font-medium tracking-wide">
                {contractAddress}
              </code>
            </div>

            <div className="flex items-center gap-6 shrink-0 text-xs font-sans-clean text-white/60">
              <div>
                <span className="text-[10px] text-white/40 block">Symbol</span>
                <span className="font-medium text-white">{tokenSymbol}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">Threshold</span>
                <span className="font-mono-code tabular-nums font-semibold text-emerald-400">
                  {minTokenRequired.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Form: Update CA & Threshold */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/[0.025] border border-white/10 backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <h2 className="font-editorial text-2xl font-normal text-white">
              Update Contract Address
            </h2>
            <p className="text-xs font-sans-clean text-white/50 leading-relaxed">
              Enter the new Robinhood Chain token contract address (0x…). When saved, the landing page hero runner, copy action, and token gate verification threshold update in real time.
            </p>
          </div>

          <form onSubmit={handleSaveCA} className="space-y-6">
            <div>
              <label className="block text-xs font-sans-clean text-white/70 mb-2">
                New Contract Address (CA)
              </label>
              <input
                type="text"
                value={newCA}
                onChange={(e) => setNewCA(e.target.value)}
                placeholder="e.g. 0xef57...938f"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-white/30 font-mono-code text-xs sm:text-sm outline-none focus:border-white/40 focus:bg-white/[0.06] transition-all"
              />
              <p className="text-[11px] font-sans-clean text-white/40 mt-1.5">
                Must be a valid 0x Robinhood Chain token contract address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-sans-clean text-white/70 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="$NAKO"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs sm:text-sm font-sans-clean outline-none focus:border-white/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-sans-clean text-white/70 mb-2">
                  Minimum Token Gate Requirement
                </label>
                <input
                  type="number"
                  value={newMinTokens}
                  onChange={(e) => setNewMinTokens(parseInt(e.target.value, 10) || 500000)}
                  placeholder="500000"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs sm:text-sm font-mono-code tabular-nums outline-none focus:border-white/40 transition-all"
                />
                <span className="text-[11px] font-sans-clean text-white/40 mt-1 block">
                  Required holdings to unlock AI agent chat (default: 500,000).
                </span>
              </div>
            </div>

            {/* Live Landing Page Preview */}
            <div className="p-4 rounded-2xl bg-[#090b10] border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-sans-clean font-semibold text-white/40 tracking-wider">
                Landing Page Pill Output
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/[0.06] text-xs font-mono-code text-white/80">
                  <span className="text-white/50">CA:</span>
                  <span className="text-white">{newCA.slice(0, 5)}...{newCA.slice(-4)}</span>
                  <span className="text-[10px] text-white/40">Copy</span>
                </div>
                <div className="text-xs font-sans-clean text-white/50">
                  Enforces: <strong className="text-emerald-400 font-mono-code">{newMinTokens.toLocaleString()} {newSymbol}</strong>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-sans-clean text-rose-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-full font-sans-clean font-medium tracking-wide text-white border border-[#e25a3e]/70 hover:border-[#e25a3e] bg-[#ad3822]/90 hover:bg-[#ad3822] backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 select-none active:scale-[0.98] px-6 py-2.5 text-xs sm:text-[13px] shadow-lg shadow-[#ad3822]/20"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deploying Live...</span>
                  </span>
                ) : (
                  <span>Save & Deploy Live</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewCA('NakoK9uWJt4h8vQZ3p7vKq2wL9mE5Xy4nB7rP8pump');
                  setNewSymbol('$NAKO');
                  setNewMinTokens(500000);
                }}
                className="px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-sans-clean transition-colors cursor-pointer"
              >
                Reset to Default
              </button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
};
