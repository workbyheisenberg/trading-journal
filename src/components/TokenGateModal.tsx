import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWeb3 } from '../context/Web3Context';
import { getTokenExplorerUrl } from '../services/robinhoodWallet';

interface TokenGateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Light-mode token gate notice shown when a wallet without the required
 * $MUMUS holding tries to send a request in the journal.
 */
export const TokenGateModal: React.FC<TokenGateModalProps> = ({ isOpen, onClose }) => {
  const {
    tokenSymbol,
    contractAddress,
    chainId,
    tokenBalance,
    minTokenRequired,
    isConnected,
    openWalletModal
  } = useWeb3();

  if (!isOpen) return null;

  const explorerUrl = getTokenExplorerUrl(contractAddress, chainId);
  const percent = '0.05';
  const supplyExample = '1,000,000,000';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Light, airy backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
        />

        {/* Light modal window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 text-center z-10"
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="w-11 h-11 rounded-full border border-cyan-200 bg-cyan-50 flex items-center justify-center mx-auto text-cyan-600 mb-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h3 className="font-editorial text-2xl font-normal text-slate-900 tracking-tight mb-2">
            Holding Required
          </h3>

          {/* Primary requirement message */}
          <p className="text-xs font-sans-clean text-slate-600 leading-relaxed">
            You have to hold <strong className="text-slate-900">{percent}%</strong> of{' '}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-600 hover:text-cyan-700 underline underline-offset-2 font-semibold transition-colors"
              title="View contract on explorer"
            >
              {tokenSymbol}
            </a>{' '}
            to send a request.
          </p>

          {/* Tiny supply note */}
          <p className="mt-2 text-[10px] font-sans-clean text-slate-400 leading-relaxed">
            {percent}% of {tokenSymbol} from current total token supply — so if total supply is{' '}
            {supplyExample}, that means {minTokenRequired.toLocaleString()} {tokenSymbol}.
          </p>

          {/* Live holdings line */}
          {isConnected && (
            <div className="mt-3 text-[11px] font-mono-code tabular-nums text-slate-500">
              Your holdings:{' '}
              <strong className={(tokenBalance >= minTokenRequired ? 'text-emerald-600' : 'text-amber-600')}>
                {tokenBalance.toLocaleString()}
              </strong>{' '}
              / {minTokenRequired.toLocaleString()} required
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center justify-center gap-2.5">
            {!isConnected && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openWalletModal();
                }}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-sans-clean font-medium transition-all shadow-xs cursor-pointer"
              >
                Connect Wallet
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-full border text-xs font-sans-clean font-medium transition-all cursor-pointer ${
                isConnected
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
