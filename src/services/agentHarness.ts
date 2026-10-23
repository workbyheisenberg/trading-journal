import { TradePosition, TradePairGroup, JournalChatMessage, TrenchTradeMessage } from '../types';
import { parseTrenchMessage } from '../data/trenchData';

// Initial curated trading positions
export const INITIAL_CURATED_POSITIONS: TradePosition[] = [];

// Color generator for token badge
export function getTokenColor(token: string): string {
  const hash = token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-emerald-500 text-white',
    'bg-indigo-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-cyan-500 text-white',
    'bg-violet-500 text-white',
    'bg-fuchsia-500 text-white',
    'bg-blue-500 text-white'
  ];
  return colors[hash % colors.length];
}

// Group positions by pair
export function groupPositionsByPair(positions: TradePosition[]): TradePairGroup[] {
  const groupsMap = new Map<string, TradePosition[]>();

  for (const pos of positions) {
    const list = groupsMap.get(pos.pairTicker) || [];
    list.push(pos);
    groupsMap.set(pos.pairTicker, list);
  }

  const groups: TradePairGroup[] = [];
  groupsMap.forEach((posList, pairTicker) => {
    const first = posList[0];
    groups.push({
      pairTicker,
      token: first.token,
      baseToken: first.baseToken || 'SOL',
      color: getTokenColor(first.token),
      positions: posList.sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    });
  });

  return groups;
}

// Intent Classification Types
export type AgentIntent = 'NEW_TRADE' | 'UPDATE_POSITION' | 'ANALYTICAL_QUERY' | 'RECORD_ASSIST' | 'GENERAL_CHAT';

export interface AgentWorkflowResult {
  intent: AgentIntent;
  replyContent: string;
  reasoningTime: string;
  tradeData?: TrenchTradeMessage;
  updatedPosition?: TradePosition;
  newPosition?: TradePosition;
  pairTicker?: string;
  summaryTitle?: string;
  quickActionChips?: { label: string; prompt: string }[];
}

// Classify user intent accurately
export function detectUserIntent(
  rawInput: string,
  currentPosition?: TradePosition | null
): AgentIntent {
  const lower = rawInput.toLowerCase().trim();

  // Check if input contains concrete trade execution details (token ticker, sol amount, action verbs)
  const hasTokenSymbol = /\$[a-zA-Z0-9_]+/i.test(rawInput);
  const hasSolAmount = /\d+(\.\d+)?\s*(sol|sols|solana)\b/i.test(rawInput);
  const hasMcap = /(at|@|\$)?\d+(\.\d+)?\s*[kmbKMB]\b/i.test(rawInput);
  const hasActionVerb = /\b(bought|aped|sniped|entered|fomoed|longed|shorted|traded|sold|holding|rug|liquidated)\b/i.test(lower);
  
  // Specific trade recording prefixes
  const startsWithRecord = lower.startsWith('record') || lower.startsWith('log') || lower.startsWith('journal');

  // Trade details test
  const hasConcreteTradeDetails =
    (hasTokenSymbol && (hasSolAmount || hasMcap || hasActionVerb || lower.includes('into') || lower.includes('on'))) ||
    (hasSolAmount && (hasActionVerb || hasMcap || lower.includes('into') || lower.includes('on'))) ||
    (startsWithRecord && (hasTokenSymbol || hasSolAmount || hasActionVerb || hasMcap));

  // 1. UPDATE_POSITION check (if inside an active position context or explicitly updating an existing position)
  if (currentPosition) {
    const isUpdateAction =
      lower.includes('sold') ||
      lower.includes('scale out') ||
      lower.includes('tp') ||
      lower.includes('profit') ||
      lower.includes('cut') ||
      lower.includes('stopped out') ||
      lower.includes('stop loss') ||
      lower.includes('stop moved') ||
      lower.includes('breakeven') ||
      lower.includes('added') ||
      lower.includes('bought more') ||
      lower.includes('closed') ||
      lower.includes('exit') ||
      lower.includes('dev dumped') ||
      lower.includes('runner') ||
      lower.includes('liquidated');

    // Only update if not specifying an entirely different token
    if (isUpdateAction && (!hasTokenSymbol || rawInput.includes(currentPosition.token))) {
      return 'UPDATE_POSITION';
    }
  }

  // 2. NEW_TRADE check:
  // If user provided concrete trade details to log/record
  const isExplicitNewTrade =
    hasConcreteTradeDetails ||
    lower.includes('aped ') ||
    lower.includes('sniped ') ||
    lower.includes('bonding curve') ||
    lower.includes('raydium migration') ||
    (lower.includes('sol') && (lower.includes('bought') || lower.includes('entered') || lower.includes('into')));

  if (isExplicitNewTrade) {
    return 'NEW_TRADE';
  }

  // 3. RECORD_ASSIST check:
  // User explicitly asks to record or asks for assistance/guidance on journaling or recording a trade
  const isAskingForRecordAssist =
    lower === 'record' ||
    lower === 'record trade' ||
    lower === 'record a trade' ||
    lower === 'journal' ||
    lower === 'journaling' ||
    lower.includes('want to record') ||
    lower.includes('help me record') ||
    lower.includes('assist to record') ||
    lower.includes('assist me to record') ||
    lower.includes('assist to journal') ||
    lower.includes('assist me to journal') ||
    lower.includes('assist with journaling') ||
    lower.includes('how do i record') ||
    lower.includes('how to record') ||
    lower.includes('how do i journal') ||
    lower.includes('how to journal') ||
    lower.includes('record or journaling') ||
    lower.includes('record or journal') ||
    lower.includes('can you help me record') ||
    lower.includes('start recording') ||
    lower.includes('log a trade') ||
    lower.includes('log my trade') ||
    lower.includes('journal a trade') ||
    lower.includes('journal my trade') ||
    (startsWithRecord && !hasConcreteTradeDetails);

  if (isAskingForRecordAssist) {
    return 'RECORD_ASSIST';
  }

  // 4. ANALYTICAL_QUERY check:
  // User asks generally around overall performance, weekly summary, win rate, leak, tilt
  const isAnalyticalQuery =
    lower.includes('summary') ||
    lower.includes('how did i do') ||
    lower.includes('how am i doing') ||
    lower.includes('this week') ||
    lower.includes('today') ||
    lower.includes('win rate') ||
    lower.includes('winrate') ||
    lower.includes('pnl') ||
    lower.includes('performance') ||
    lower.includes('leak') ||
    lower.includes('tilt report') ||
    lower.includes('my positions') ||
    lower.includes('review my') ||
    lower.includes('overall') ||
    lower.includes('ledger status');

  if (isAnalyticalQuery) {
    return 'ANALYTICAL_QUERY';
  }

  return 'GENERAL_CHAT';
}

// Process user input through the AI agent harness
export function processAgentHarness(
  input: string,
  positions: TradePosition[],
  currentPosition?: TradePosition | null
): AgentWorkflowResult {
  const intent = detectUserIntent(input, currentPosition);
  const reasoningTime = `${(0.18 + Math.random() * 0.25).toFixed(2)}s`;

  // ─────────────────────────────────────────────────────────────
  // 1. RECORD_ASSIST (User specifically asks for assist to record or journal)
  // ─────────────────────────────────────────────────────────────
  if (intent === 'RECORD_ASSIST') {
    const replyContent = `### Trade Recording & Journaling Assistant

I am ready to assist you in recording and journaling your trade into your curated cognitive ledger.

You can record trades using **natural trench slang**, concise trade notes, or raw execution logs. I will automatically parse:
* **Token Pair:** e.g. \`$WIF / SOL\`, \`$PIPIN / SOL\`
* **Entry Size & Valuation:** Capital deployed in SOL and Market Cap
* **Setup Classification:** Pump.fun Snipe, Raydium Migration, Dev Dump Reversal, FOMO Chase, etc.
* **Psychological State & Conviction:** Disciplined, High Conviction, FOMO, or Revenge Tilt
* **Realized PnL & Key Takeaway:** Math expectancy and lessons learned

---

### Quick Templates to Record Immediately:
1. **Pump.fun Snipe:**
   > *"aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M"*
2. **Raydium Migration:**
   > *"sniped raydium migration on $GOAT 5 sol tight stop 15% scaled 75% at 3.5x"*
3. **Disciplined Invalidation:**
   > *"bought 2.5 sol $BONK at 1.2M stopped out at -15% disciplined cut"*
4. **Emotional FOMO Audit:**
   > *"fomoed 8 sol into $CHILL at 18M ath down 40% panic sold at bottom"*

Drop your raw trade details below (e.g. *"bought 2 sol of $WIF at 1.50"* or *"record trade: 3 sol $BONK"*), or click any quick template!`;

    const quickActionChips = [
      { label: '⚡ Pump.fun Snipe (4 SOL)', prompt: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M' },
      { label: '🌊 Raydium Migration (5 SOL)', prompt: 'sniped raydium migration on $GOAT 5 sol tight stop 15% scaled 75% at 3.5x' },
      { label: '🛑 Disciplined Stop Cut (-15%)', prompt: 'bought 2.5 sol $BONK at 1.2M stopped out at -15% disciplined cut' },
      { label: '⚠️ FOMO Top Chase (-40%)', prompt: 'fomoed 8 sol into $CHILL at 18M ath down 40% panic sold at bottom' }
    ];

    return {
      intent,
      replyContent,
      reasoningTime,
      summaryTitle: 'Journaling Assistant',
      quickActionChips
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ANALYTICAL QUERY (e.g. "how's the summary and my journal for this week")
  // ─────────────────────────────────────────────────────────────
  if (intent === 'ANALYTICAL_QUERY') {
    const isThisWeek = input.toLowerCase().includes('week');
    const scopeLabel = isThisWeek ? 'This Week' : 'Recent Trading Ledger';

    // Calculate aggregated metrics from curated memory
    const totalPositions = positions.length;
    const wins = positions.filter((p) => p.realizedPnlSol > 0);
    const losses = positions.filter((p) => p.realizedPnlSol < 0);
    const winRate = totalPositions > 0 ? ((wins.length / totalPositions) * 100).toFixed(1) : '0.0';
    const totalPnl = positions.reduce((acc, p) => acc + p.realizedPnlSol, 0).toFixed(2);
    const totalSolDeployed = positions.reduce((acc, p) => acc + p.initialSizeSol, 0).toFixed(1);

    const bestTrade = positions.reduce((prev, current) => 
      (prev.realizedPnlSol > current.realizedPnlSol) ? prev : current, positions[0]);
    const worstTrade = positions.reduce((prev, current) => 
      (prev.realizedPnlSol < current.realizedPnlSol) ? prev : current, positions[0]);

    const replyContent = `### Cognitive Audit & Performance Summary: **${scopeLabel}**

**Executive Verdict: Net Statistical Edge Preserved (+${totalPnl} SOL)**

Based on your curated trade ledger for ${scopeLabel.toLowerCase()}:

* **Win Rate:** ${winRate}% (${wins.length} Wins / ${losses.length} Losses across ${totalPositions} positions)
* **Net Realized PnL:** **${parseFloat(totalPnl) >= 0 ? `+${totalPnl}` : totalPnl} SOL** (from ${totalSolDeployed} SOL deployed)
* **Highest-Conviction Edge:** **${bestTrade.token} / SOL** (+${bestTrade.realizedPnlSol} SOL, ${bestTrade.setupType})
* **Primary Psychological Leak:** **${worstTrade.token} / SOL** (${worstTrade.realizedPnlSol} SOL, ${worstTrade.setupType})

### Curated Position Summary:
${positions.map((p, idx) => `${idx + 1}. **${p.pairTicker}** (${p.status}) — ${p.setupType}
   * PnL: **${p.realizedPnlSol >= 0 ? `+${p.realizedPnlSol}` : p.realizedPnlSol} SOL** (${p.totalPnlPercentage >= 0 ? `+${p.totalPnlPercentage}` : p.totalPnlPercentage}%)
   * Summary: *${p.conciseSummary}*`).join('\n')}

### Behavioral Diagnostics:
1. **Rule Adherence:** When you plan stops in advance (e.g. ${bestTrade.token}), your profit factor exceeds 3.0x.
2. **Tilt Prevention:** Chasing 1-minute breakout candles without pullback invalidation is your only red leak this week.

**Nako Mandate:** Maintain your 15% trailing stop rule. Prohibit any market buys when dopamine or FOMO levels surge after watching green candles on Twitter.`;

    const quickActionChips = [
      { label: '📝 Record / Journal a Trade', prompt: 'assist to record or journaling a trade' },
      { label: '⚡ Pump.fun Snipe Log', prompt: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M' },
      { label: '🎯 Tilt & Leak Diagnostics', prompt: 'what is my win rate and my biggest emotional leak so far?' }
    ];

    return {
      intent,
      replyContent,
      reasoningTime,
      summaryTitle: `Weekly Summary (${scopeLabel})`,
      quickActionChips
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. UPDATE EXISTING POSITION (Continuation of trade conversation)
  // ─────────────────────────────────────────────────────────────
  if (intent === 'UPDATE_POSITION' && currentPosition) {
    const lower = input.toLowerCase();
    let updatedStatus = currentPosition.status;
    let newRealizedPnl = currentPosition.realizedPnlSol;
    let remainingSol = currentPosition.remainingSizeSol;
    let actionType: TradePosition['events'][0]['action'] = 'SCALE_OUT';
    let updateNotes = input;

    // Detect exit / scale out amount
    if (lower.includes('sold 50%') || lower.includes('half')) {
      const soldAmount = remainingSol * 0.5;
      remainingSol -= soldAmount;
      const profitBoost = soldAmount * 1.5;
      newRealizedPnl += profitBoost;
      actionType = 'SCALE_OUT';
      updatedStatus = remainingSol <= 0.2 ? 'CLOSED' : 'PARTIAL';
    } else if (lower.includes('sold 75%')) {
      const soldAmount = remainingSol * 0.75;
      remainingSol -= soldAmount;
      const profitBoost = soldAmount * 2.0;
      newRealizedPnl += profitBoost;
      actionType = 'SCALE_OUT';
      updatedStatus = remainingSol <= 0.2 ? 'CLOSED' : 'PARTIAL';
    } else if (lower.includes('closed') || lower.includes('exit all') || lower.includes('cut') || lower.includes('stopped out')) {
      actionType = lower.includes('stopped out') ? 'STOP_LOSS' : 'EXIT_ALL';
      remainingSol = 0;
      updatedStatus = 'CLOSED';
    } else if (lower.includes('breakeven') || lower.includes('moved stop')) {
      actionType = 'NOTE';
      updateNotes = 'Trailing stop moved to breakeven';
    } else if (lower.includes('added') || lower.includes('dip')) {
      actionType = 'ADD_SIZE';
      remainingSol += 1.0;
    }

    const newEvent: TradePosition['events'][0] = {
      id: `ev-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionType,
      sizeSol: currentPosition.remainingSizeSol - remainingSol,
      notes: updateNotes
    };

    const newConciseSummary = `${currentPosition.initialSizeSol} SOL entry on ${currentPosition.pairTicker}. Latest update: ${input.slice(0, 60)}. Realized PnL: ${newRealizedPnl >= 0 ? `+${newRealizedPnl.toFixed(1)}` : newRealizedPnl.toFixed(1)} SOL (${updatedStatus}).`;

    const updatedPos: TradePosition = {
      ...currentPosition,
      status: updatedStatus,
      remainingSizeSol: Math.max(0, parseFloat(remainingSol.toFixed(2))),
      realizedPnlSol: parseFloat(newRealizedPnl.toFixed(1)),
      lastUpdatedAt: 'Just now',
      conciseSummary: newConciseSummary,
      events: [...currentPosition.events, newEvent]
    };

    const replyContent = `### Position Memory Updated: **${updatedPos.pairTicker}**

**Action Recorded: ${actionType.replace('_', ' ')}**

The Nako harness has registered your update into persistent trade memory:

* **Position Status:** **${updatedStatus}**
* **Remaining Capital at Risk:** **${updatedPos.remainingSizeSol} SOL** (from ${updatedPos.initialSizeSol} SOL initial)
* **Updated Realized PnL:** **${updatedPos.realizedPnlSol >= 0 ? `+${updatedPos.realizedPnlSol}` : updatedPos.realizedPnlSol} SOL**
* **Concise Record:** *${newConciseSummary}*

### Cognitive Feedback:
${actionType === 'SCALE_OUT' ? 'Securing partial profit locks your mathematical expectancy. Keeping a runner eliminates psychological regret of selling too early.' : ''}
${actionType === 'STOP_LOSS' ? 'Honoring your invalidation prevents a catastrophic drawdown. Good discipline taking the loss promptly.' : ''}
${actionType === 'NOTE' ? 'Active risk management reduces emotional discretion. Excellent habit.' : ''}`;

    const quickActionChips = [
      { label: '📊 Audit Weekly Performance', prompt: "how's the summary and my journal for this week" },
      { label: '📝 Record Another Trade', prompt: 'assist to record or journaling a trade' }
    ];

    return {
      intent,
      replyContent,
      reasoningTime,
      updatedPosition: updatedPos,
      pairTicker: updatedPos.pairTicker,
      summaryTitle: `${updatedPos.pairTicker} Update`,
      quickActionChips
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. NEW TRADE ENTRY (e.g. "record: bought 2 sol of $WIF" or "aped 4 sol into $PIPIN...")
  // ─────────────────────────────────────────────────────────────
  if (intent === 'NEW_TRADE') {
    const tradeData = parseTrenchMessage(input);
    const token = tradeData.token;
    const pairTicker = `${token} / SOL`;
    const solMatch = input.match(/(\d+(\.\d+)?)\s*(?:sol|sols|solana)/i);
    const initialSol = solMatch ? parseFloat(solMatch[1]) : 2.5;

    const newPosition: TradePosition = {
      id: `pos-${Date.now()}`,
      token,
      baseToken: 'SOL',
      pairTicker,
      status: tradeData.pnlPercentage < -20 ? 'CLOSED' : 'OPEN',
      setupType: tradeData.setupType,
      psychologicalState: tradeData.psychologicalState,
      convictionScore: tradeData.convictionScore,
      openedAt: 'Just now',
      lastUpdatedAt: 'Just now',
      entryMcap: tradeData.entryMcap,
      currentMcap: tradeData.exitMcap || tradeData.entryMcap,
      initialSizeSol: initialSol,
      remainingSizeSol: tradeData.pnlPercentage < -20 ? 0 : initialSol,
      realizedPnlSol: tradeData.pnlSol,
      totalPnlPercentage: tradeData.pnlPercentage,
      conciseSummary: `${initialSol} SOL entry on ${pairTicker} @ ${tradeData.entryMcap}. Setup: ${tradeData.setupType}. State: ${tradeData.psychologicalState}.`,
      keyTakeaway: tradeData.keyMistakeOrEdge,
      sessionId: `session-${Date.now()}`,
      events: [
        {
          id: `ev-${Date.now()}-1`,
          timestamp: 'Just now',
          action: 'ENTRY_BUY',
          sizeSol: initialSol,
          priceOrMcap: tradeData.entryMcap,
          notes: input
        }
      ]
    };

    const replyContent = `### Cognitive Trade Audit: **${token}**

**Verdict: ${tradeData.psychologicalState === 'Disciplined' ? 'Disciplined Execution · High Expectancy' : 'Psychological Warning · Emotional Drift Detected'}**

Position successfully indexed into your **${pairTicker}** trade history:

* **Pair:** ${pairTicker}
* **Entry Size:** ${initialSol} SOL @ ${tradeData.entryMcap}
* **Setup Classification:** ${tradeData.setupType}
* **Psychological State:** ${tradeData.psychologicalState} (Conviction: ${tradeData.convictionScore}/10)
* **Estimated PnL:** ${tradeData.pnlPercentage >= 0 ? `+${tradeData.pnlPercentage}%` : `${tradeData.pnlPercentage}%`} (${tradeData.pnlSol} SOL)

### Concise Summary:
*${newPosition.conciseSummary}*

* **Key Edge / Lesson:** ${tradeData.keyMistakeOrEdge}
* **Next Action:** ${tradeData.psychologicalState === 'FOMO / Emotional' ? 'Take a mandatory 30-minute timeout before taking another trade.' : 'Plan your partial take-profit levels now.'}`;

    const quickActionChips = [
      { label: '💰 Sold 50% (Scale Out)', prompt: 'sold 50% at 2x profit, moved stop to breakeven' },
      { label: '🛑 Trailing Stop Moved', prompt: 'moved trailing stop to breakeven to eliminate risk' },
      { label: '📊 Audit Weekly Performance', prompt: "how's the summary and my journal for this week" }
    ];

    return {
      intent,
      replyContent,
      reasoningTime,
      tradeData,
      newPosition,
      pairTicker,
      summaryTitle: `${token} Trade Audit`,
      quickActionChips
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5. GENERAL CONVERSATIONAL CHAT
  // ─────────────────────────────────────────────────────────────
  const quickActionChips = [
    { label: '📝 Assist Me to Record / Journal', prompt: 'assist to record or journaling a trade' },
    { label: '📊 How did I do this week?', prompt: "how's the summary and my journal for this week" },
    { label: '⚡ Record Pump.fun Snipe', prompt: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M' }
  ];

  return {
    intent: 'GENERAL_CHAT',
    reasoningTime,
    replyContent: `### Nako Cognitive Assistant

I am observing your trade psychology and execution ledger.

* **To journal a trade:** Type naturally in your own style (e.g. *"aped 3 sol into $PNUT at 600k bonding curve dev sold..."*).
* **To update an active position:** Simply report what you did (e.g. *"sold 50% at 3x, moved stop to breakeven"*).
* **To review performance:** Ask anytime (e.g. *"how's the summary and my journal for this week?"*).

How would you like to proceed with your ledger today?`,
    quickActionChips
  };
}
