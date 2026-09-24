import { JournalSession } from '../types';
import { parseTrenchMessage } from './trenchData';

export const INITIAL_JOURNAL_SESSIONS: JournalSession[] = [
  {
    id: 'session-1',
    title: '$PIPIN Bonding Curve Snipe',
    pairTicker: '$PIPIN / SOL',
    positionId: 'pos-pipin-1',
    sessionType: 'pair_position',
    dateCategory: 'Today',
    timestamp: '14:32',
    preview: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30%...',
    messages: [
      {
        id: 'm-1-1',
        role: 'user',
        timestamp: '14:30',
        content: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% immediately but tg community absorbed floor, raydium migration hit locked 2x initial holding moonbag'
      },
      {
        id: 'm-1-2',
        role: 'assistant',
        timestamp: '14:30',
        reasoningTime: '0.38s',
        content: `### Cognitive Trade Audit: **$PIPIN**

**Verdict: High-Edge Execution · A-Grade Conviction**

You navigated the high-frequency volatility zone with precision. Rather than panic-selling when the dev dumped 30% of supply, you verified volume absorption on the orderbook before taking decisive action. Taking your initial capital out at 2x de-risked the trade completely.

* **Key Strength:** Patience under early drawdown. You trusted orderbook flow over panic sentiment.
* **Suggested Next Step:** Set a trailing stop on your moonbag at the previous 15-minute swing low to avoid round-tripping profit.`,
        tradeData: parseTrenchMessage('aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% immediately but tg community absorbed floor, raydium migration hit locked 2x initial holding moonbag')
      }
    ]
  },
  {
    id: 'session-2',
    title: 'FOMO Top Chase Audit ($CHILL)',
    pairTicker: '$CHILL / SOL',
    positionId: 'pos-chill-1',
    sessionType: 'pair_position',
    dateCategory: 'Today',
    timestamp: '11:15',
    preview: 'fomoed 8 sol into $CHILL at ath 18M cap down 40%...',
    messages: [
      {
        id: 'm-2-1',
        role: 'user',
        timestamp: '11:12',
        content: 'fomoed 8 sol into $CHILL at ath 18M cap down 40% in 90 seconds panic sold at the absolute bottom i hate myself'
      },
      {
        id: 'm-2-2',
        role: 'assistant',
        timestamp: '11:13',
        reasoningTime: '0.45s',
        content: `### Behavioral Tilt Alert: **Severe FOMO Top Chase**

**Diagnosis: Emotional Chase → Capitulation Liquidity**

You bought into 6 consecutive 1-minute green candles without an invalidation level or pullback. When the inevitable mean-reversion occurred, lack of conviction led directly to market-selling the local bottom.

* **Behavioral Leak:** Chasing green candles driven by social media euphoria.
* **Prescribed Rule:** 45-minute mandatory screen timeout. Step away from your Robinhood terminal until your heart rate and dopamine baseline reset.`,
        tradeData: parseTrenchMessage('fomoed 8 sol into $CHILL at ath 18M cap down 40% in 90 seconds panic sold at the absolute bottom')
      }
    ]
  },
  {
    id: 'session-3',
    title: 'Raydium Migration & Trailing Stop',
    pairTicker: '$GOAT / SOL',
    positionId: 'pos-goat-1',
    sessionType: 'pair_position',
    dateCategory: 'Yesterday',
    timestamp: 'Yesterday 19:40',
    preview: 'sniped raydium migration on $GOAT 5 sol entry set tight 15% trailing stop...',
    messages: [
      {
        id: 'm-3-1',
        role: 'user',
        timestamp: 'Yesterday 19:35',
        content: 'sniped raydium migration on $GOAT 5 sol entry set tight 15% trailing stop sold 75% at 3.5x leaving runner to valhalla'
      },
      {
        id: 'm-3-2',
        role: 'assistant',
        timestamp: 'Yesterday 19:36',
        reasoningTime: '0.29s',
        content: `### Systematic Execution: **$GOAT Migration**

**Performance Rating: 9.5 / 10**

Clean mechanics on liquidity migration unlock. Pre-calculating the 15% trailing stop prevented emotional discretion, while the 75% scale-out locked in +12.5 SOL net profit.

* **Compounding Rule:** Keep adhering strictly to predefined partial profit targets. This is how 7-figure trench portfolios are sustained.`,
        tradeData: parseTrenchMessage('sniped raydium migration on $GOAT 5 sol entry set tight 15% trailing stop sold 75% at 3.5x leaving runner')
      }
    ]
  },
  {
    id: 'session-4',
    title: 'Weekly Tilt Mitigation & Discipline Review',
    sessionType: 'general_query',
    dateCategory: 'Previous 7 Days',
    timestamp: '3 days ago',
    preview: 'Review my last 10 trades and tell me which emotional bias hurts me most...',
    messages: [
      {
        id: 'm-4-1',
        role: 'user',
        timestamp: '3 days ago',
        content: 'Review my last 10 trades and tell me which emotional bias hurts me most'
      },
      {
        id: 'm-4-2',
        role: 'assistant',
        timestamp: '3 days ago',
        reasoningTime: '0.62s',
        content: `### Macro Behavioral Summary: **Past 10 Trades**

Based on your Mumus trade ledger:
1. **Raydium Migrations:** +34.2 SOL (83% Win Rate) — *Your true statistical edge.*
2. **Planned Bonding Curve Snipes:** +18.6 SOL (65% Win Rate) — *Solid risk-reward.*
3. **Post-Loss Chases (< 10 min after red trade):** -41.8 SOL (14% Win Rate) — *Your single largest leak.*

**Mumus Mandate:** If you simply eliminate entries within 20 minutes of a stop-out, your overall monthly PnL doubles.`
      }
    ]
  }
];

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

Mumus detected anger or frustration markers in your message. Trading to "make back" lost SOL triggers poor sizing and disregard for stop-losses.

* **Prescription:** Step away from the charts for at least 30 minutes. The market will offer new setups when your executive cognitive function is restored.`;
    } else if (trade.setupType === 'Raydium Migration') {
      advice = `### High-Conviction Analysis: **Raydium Migration Snipe**

Clean execution capturing the bonding curve graduation liquidity spike.

* **Edge Factor:** You capitalized on the liquidity migration momentum with structured take-profits.
* **PnL Recorded:** ${trade.pnlSol > 0 ? `+${trade.pnlSol} SOL` : `${trade.pnlSol} SOL`} (${trade.pnlPercentage > 0 ? `+${trade.pnlPercentage}%` : `${trade.pnlPercentage}%`}).
* **Next Action:** Stored in your permanent Mumus journal ledger.`;
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
      content: `### Mumus Mindset Audit

High-frequency trench trading is 20% mechanics and 80% emotional governance. When you experience consecutive losses:
1. **Cortisol Spike:** Your brain narrows visual focus and impulsively searches for quick dopamine hits.
2. **Size Inflation:** Traders often double their normal position size to break even quickly.
3. **The 3-Trade Rule:** If you lose 3 trades consecutively, your daily allocation is halted until the next session.

Would you like to review your current win-rate distribution by setup category?`,
      reasoningTime
    };
  }

  return {
    content: `I have received and logged your reflection to the **Mumus Cognitive Journal**. 

Whenever you enter a position, paste the ticker, trade size or USD amount, and your internal thought process. I will instantly classify your setup, calculate conviction, and flag any unconscious emotional bias before it costs you capital.

*Try asking:*
* *"Analyze my win rate across momentum breakouts vs dip snipes"*
* *"Audit this trade: bought $TSLA 0DTE calls after seeing pre-market rally"*
* *"Give me a 3-step checklist to stop revenge trading"*`,
    reasoningTime
  };
}
