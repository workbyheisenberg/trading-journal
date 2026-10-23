import { JournalSession } from '../types';
import { parseTrenchMessage } from './trenchData';

export const INITIAL_JOURNAL_SESSIONS: JournalSession[] = [];

export function generateAssistantResponse(prompt: string): {
  content: string;
  reasoningTime: string;
  tradeData?: ReturnType<typeof parseTrenchMessage>;
} {
  const lower = prompt.toLowerCase();
  const reasoningTime = `${(0.2 + Math.random() * 0.4).toFixed(2)}s`;

  const containsTradeKeywords = 
    lower.includes('sol') || 
    lower.includes('aped') || 
    lower.includes('bought') || 
    lower.includes('sold') || 
    lower.includes('fomo') || 
    lower.includes('snipe') || 
    lower.includes('pump') || 
    lower.includes('raydium') || 
    lower.includes('bonding');

  if (containsTradeKeywords) {
    const trade = parseTrenchMessage(prompt);

    let advice = '';
    if (trade.setupType === 'FOMO Top Chase') {
      advice = `### Cognitive Diagnostic: **FOMO Top Chase Detected**

You entered after extended green continuation without waiting for an hourly equilibrium.

* **Emotional Bias:** Urgency to not be left behind (Fear Of Missing Out).
* **Statistical Reality:** Entering at all-time-highs without a consolidation base carries an 81.5% loss rate in current market conditions.
* **Corrective Habit:** Place a limit order at the 50% retracement rather than market-buying green extensions.`;
    } else if (trade.setupType === 'Revenge Ape') {
      advice = `### Tilt Mitigation Warning: **Revenge Entry Identified**

Nako detected anger or frustration markers in your message. Trading to "make back" lost SOL triggers poor sizing and disregard for stop-losses.

* **Prescription:** Step away from the charts for at least 30 minutes. The market will offer new setups when your executive cognitive function is restored.`;
    } else if (trade.setupType === 'Raydium Migration') {
      advice = `### High-Conviction Analysis: **Raydium Migration Snipe**

Clean execution capturing the bonding curve graduation liquidity spike.

* **Edge Factor:** You capitalized on the liquidity migration momentum with structured take-profits.
* **PnL Recorded:** ${trade.pnlSol > 0 ? `+${trade.pnlSol} SOL` : `${trade.pnlSol} SOL`} (${trade.pnlPercentage > 0 ? `+${trade.pnlPercentage}%` : `${trade.pnlPercentage}%`}).
* **Next Action:** Stored in your permanent Nako journal ledger.`;
    } else {
      advice = `### Trade Classification: **${trade.setupType}**

Trade parameters extracted and logged to your decentralized journal.

* **Token:** ${trade.token} on Robinhood
* **Psychological State:** ${trade.psychologicalState}
* **Conviction Score:** ${trade.convictionScore}/10
* **Key Takeaway:** ${trade.keyMistakeOrEdge}`;
    }

    return {
      content: advice,
      reasoningTime,
      tradeData: trade
    };
  }

  // Conversational response
  if (lower.includes('tilt') || lower.includes('psychology') || lower.includes('mindset') || lower.includes('discipline')) {
    return {
      content: `### Nako Mindset Audit

High-frequency trench trading is 20% mechanics and 80% emotional governance. When you experience consecutive losses:
1. **Cortisol Spike:** Your brain narrows visual focus and impulsively searches for quick dopamine hits.
2. **Size Inflation:** Traders often double their normal position size to break even quickly.
3. **The 3-Trade Rule:** If you lose 3 trades consecutively, your daily allocation is halted until the next session.

Would you like to review your current win-rate distribution by setup category?`,
      reasoningTime
    };
  }

  return {
    content: `I have received and logged your reflection to the **Nako Cognitive Journal**. 

Whenever you enter a position, paste the ticker, trade size or USD amount, and your internal thought process. I will instantly classify your setup, calculate conviction, and flag any unconscious emotional bias before it costs you capital.

*Try asking:*
* *"Analyze my win rate across momentum breakouts vs dip snipes"*
* *"Audit this trade: bought $TSLA 0DTE calls after seeing pre-market rally"*
* *"Give me a 3-step checklist to stop revenge trading"*`,
    reasoningTime
  };
}
