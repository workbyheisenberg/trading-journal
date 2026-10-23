import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWeb3 } from '../context/Web3Context';
import { ROBINHOOD_WALLET_DOWNLOAD_URL } from '../services/robinhoodWallet';

export const WalletModal: React.FC = () => {
  const {
    isWalletModalOpen,
    closeWalletModal,
    walletAddress,
    tokenBalance,
    isConnected,
    isConnecting,
    hasAccess,
    minTokenRequired,
    tokenSymbol,
    isRobinhoodInstalled,
    chainName,
    connectionError,
    connectRobinhood,
    connectDemoWallet,
    disconnectWallet,
    signAuthMessage,
    formatAddress
  } = useWeb3();

  // Wallet modal is always rendered in light mode by design.
  const isDark = false;
  const [signStatus, setSignStatus] = useState<string | null>(null);

  if (!isWalletModalOpen) return null;

  const handleRealConnect = async () => {
    setSignStatus(null);
    await connectRobinhood();
  };

  const handleSignTest = async () => {
    setSignStatus('Prompting Robinhood...');
    const sig = await signAuthMessage();
    if (sig) {
      setSignStatus('Signature verified ✓');
      setTimeout(() => setSignStatus(null), 3000);
    } else {
      setSignStatus('Cancelled');
      setTimeout(() => setSignStatus(null), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-white/20">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeWalletModal}
          className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-sm rounded-3xl overflow-hidden border backdrop-blur-2xl transition-all duration-300 z-10 ${
            isDark
              ? 'bg-[#090b10]/95 border-white/15 text-[#e8eaee] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)]'
              : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? (hasAccess ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-400'
                } shrink-0`}
              />
              <h3 className="font-editorial text-lg tracking-[0.04em] font-normal">
                {isConnected ? formatAddress(walletAddress) : 'Robinhood Wallet'}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeWalletModal}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Close modal"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {isConnected ? (
              /* Ultra-simplified Connected State: MUMUS amount, verification badge, disconnect */
              <div className="space-y-5 text-center">
                {/* 1. Amount of MUMUS with small Pretendard font */}
                <div className="space-y-1">
                  <div
                    className={`text-[10px] font-sans-clean font-semibold uppercase tracking-wider ${
                      isDark ? 'text-white/40' : 'text-slate-400'
                    }`}
                  >
                    Holdings · {chainName}
                  </div>
                  <div className="font-sans-clean font-medium text-lg sm:text-xl tabular-nums text-slate-900">
                    {tokenBalance.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ${tokenSymbol}
                    </span>
                  </div>
                </div>

                {/* 2. Verification Badge */}
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans-clean font-medium border ${
                      hasAccess
                        ? isDark
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isDark
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${hasAccess ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
                    />
                    <span>
                      {hasAccess ? 'Verified Holder' : `Need ${minTokenRequired.toLocaleString()} ${tokenSymbol}`}
                    </span>
                  </span>
                </div>

                {/* Optional Signature test feedback */}
                {signStatus && (
                  <div className="text-[11px] font-sans-clean text-emerald-500">{signStatus}</div>
                )}

                {/* Actions: Disconnect button + subtle test sign */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-sans-clean font-medium border transition-all cursor-pointer ${
                      isDark
                        ? 'border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                        : 'border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700'
                    }`}
                  >
                    Disconnect Wallet
                  </button>

                  <button
                    type="button"
                    onClick={handleSignTest}
                    className={`w-full py-1.5 text-[10px] font-sans-clean transition-colors cursor-pointer ${
                      isDark ? 'text-white/35 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Sign Verification Challenge (personal_sign)
                  </button>
                </div>
              </div>
            ) : (
              /* Real Robinhood Wallet Connect Options */
              <div className="space-y-3">
                {/* Extension status indicator */}
                <div className="flex items-center justify-between text-[11px] font-sans-clean px-1">
                  <span className={isDark ? 'text-white/45' : 'text-slate-500'}>Extension Status</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isRobinhoodInstalled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className={isRobinhoodInstalled ? 'text-emerald-500 font-medium' : (isDark ? 'text-white/50' : 'text-slate-500')}>
                      {isRobinhoodInstalled ? 'Detected' : 'Not installed'}
                    </span>
                  </span>
                </div>

                {/* Primary Real Connect Button */}
                <button
                  type="button"
                  onClick={handleRealConnect}
                  disabled={isConnecting}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-sans-clean font-medium transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/15 bg-white/[0.08] hover:bg-white/[0.14] text-white shadow-sm'
                      : 'border-slate-200 bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Clean Robinhood Feather/Leaf Icon */}
                  <svg
                    className="w-4 h-4 shrink-0 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </svg>
                  <span>{isConnecting ? 'Connecting Robinhood...' : 'Connect Robinhood Wallet'}</span>
                </button>

                {/* Connection Error / Missing Extension Hint */}
                {connectionError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] font-sans-clean leading-relaxed">
                    <div>{connectionError}</div>
                    <div className="mt-1.5">
                      <a
                        href={ROBINHOOD_WALLET_DOWNLOAD_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-medium hover:opacity-80 inline-flex items-center gap-1"
                      >
                        Install Robinhood Wallet ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* Demo / Sandbox Option */}
                <button
                  type="button"
                  onClick={() => connectDemoWallet('sufficient')}
                  className={`w-full py-2 px-3 rounded-xl border text-[11px] font-sans-clean transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]'
                      : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Demo Account (1,250,000 $MUMUS)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
