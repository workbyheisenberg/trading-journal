import { TradePosition, TrenchTradeMessage, GraphExecutionTrace } from '../types/index.ts';
import { parseTrenchMessage } from '../data/trenchData.ts';

export type AgentIntent =
  | 'RECORD_ASSIST'
  | 'NEW_TRADE'
  | 'UPDATE_POSITION'
  | 'ANALYTICAL_QUERY'
  | 'GENERAL_CHAT';

export interface GraphState {
  traceId: string;
  timestamp: number;
  input: string;
  positions: TradePosition[];
  currentPosition?: TradePosition | null;

  // Graph intermediate artifacts
  normalizedInput: string;
  slangTokens: string[];
  detectedTickers: string[];
  detectedAmounts: number[];
  
  intent: AgentIntent;
  confidence: number;

  extractedTrade?: TrenchTradeMessage;
  cognitiveAnalysis?: {
    psychologicalState: string;
    convictionScore: number;
    tiltScore: number;
    riskVerdict: string;
    mandate: string;
  };

  newPosition?: TradePosition;
  updatedPosition?: TradePosition;
  pairTicker?: string;
  summaryTitle?: string;

  replyContent: string;
  quickActionChips: { label: string; prompt: string }[];

  // Graph execution telemetry
  executionPath: string[];
  nodeTimings: Record<string, number>;
  totalTimeMs: number;
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 1: INPUT NORMALIZATION & TRENCH LEXER
// ─────────────────────────────────────────────────────────────
export async function inputNormalizationNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();
  const raw = state.input.trim();
  const lower = raw.toLowerCase();

  // Trench slang lexer
  const slangVocab = [
    'aped', 'sniped', 'fomo', 'fomoed', 'rug', 'rugged', 'dev dumped', 'bonding curve',
    'raydium', 'migration', 'moon', 'paperhand', 'paperhanded', 'diamond hand', 'runner',
    'liquidated', 'cut', 'stopped out', 'breakeven', 'scale out', 'tp', 'target hit',
    'bag', 'trench', 'conviction', 'revenge'
  ];

  const matchedSlang = slangVocab.filter((term) => lower.includes(term));

  // Extract tickers with $ or without $
  const tickerMatches = raw.match(/\$[A-Za-z0-9_]+/g) || [];
  const cleanTickers = tickerMatches.map((t) => t.toUpperCase());

  // Extract numeric sol amounts
  const amountMatches = raw.match(/(\d+(\.\d+)?)\s*(?:sol|sols|solana)/gi) || [];
  const numericAmounts = amountMatches.map((m) => parseFloat(m.replace(/[^\d.]/g, '')));

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    normalizedInput: lower,
    slangTokens: matchedSlang,
    detectedTickers: cleanTickers,
    detectedAmounts: numericAmounts,
    executionPath: [...state.executionPath, 'InputNormalizer'],
    nodeTimings: { ...state.nodeTimings, InputNormalizer: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 2: INTENT CLASSIFICATION NODE
// ─────────────────────────────────────────────────────────────
export async function intentClassifierNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();
  const lower = state.normalizedInput;
  const hasTickers = state.detectedTickers.length > 0;
  const hasAmounts = state.detectedAmounts.length > 0;
  const hasActions = /\b(bought|aped|sniped|entered|fomoed|longed|shorted|traded|sold|holding)\b/i.test(lower);
  const startsWithRecord = lower.startsWith('record') || lower.startsWith('log') || lower.startsWith('journal');

  const hasConcreteTradeDetails =
    (hasTickers && (hasAmounts || hasActions || lower.includes('at') || lower.includes('@'))) ||
    (hasAmounts && hasActions) ||
    (startsWithRecord && (hasTickers || hasAmounts || hasActions));

  let intent: AgentIntent = 'GENERAL_CHAT';
  let confidence = 0.85;

  // 1. UPDATE_POSITION check
  if (state.currentPosition) {
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
      lower.includes('runner');

    if (isUpdateAction && (!hasTickers || state.detectedTickers.includes(state.currentPosition.token))) {
      intent = 'UPDATE_POSITION';
      confidence = 0.94;
    }
  }

  // 2. NEW_TRADE check
  if (intent === 'GENERAL_CHAT') {
    const isExplicitNewTrade =
      hasConcreteTradeDetails ||
      lower.includes('aped ') ||
      lower.includes('sniped ') ||
      lower.includes('bonding curve') ||
      lower.includes('raydium migration') ||
      (lower.includes('sol') && (lower.includes('bought') || lower.includes('entered') || lower.includes('into')));

    if (isExplicitNewTrade) {
      intent = 'NEW_TRADE';
      confidence = 0.96;
    }
  }

  // 3. RECORD_ASSIST check (User specifically asks for assistance / guidance to record or journal)
  if (intent === 'GENERAL_CHAT') {
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
      intent = 'RECORD_ASSIST';
      confidence = 0.98;
    }
  }

  // 4. ANALYTICAL_QUERY check
  if (intent === 'GENERAL_CHAT') {
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
      intent = 'ANALYTICAL_QUERY';
      confidence = 0.92;
    }
  }

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    intent,
    confidence,
    executionPath: [...state.executionPath, `IntentClassifier:${intent}`],
    nodeTimings: { ...state.nodeTimings, IntentClassifier: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 3: TRADE ENTITY EXTRACTION NODE
// ─────────────────────────────────────────────────────────────
export async function entityExtractionNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();
  const parsed = parseTrenchMessage(state.input);

  // If detected ticker was found earlier and parseTrenchMessage used fallback
  if (state.detectedTickers.length > 0 && parsed.token === '$TRENCH') {
    parsed.token = state.detectedTickers[0];
  }

  // If numeric sol was detected earlier
  if (state.detectedAmounts.length > 0) {
    const explicitSol = state.detectedAmounts[0];
    parsed.pnlSol = parseFloat((explicitSol * (parsed.pnlPercentage / 100)).toFixed(2));
  }

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    extractedTrade: parsed,
    pairTicker: `${parsed.token} / SOL`,
    executionPath: [...state.executionPath, 'EntityExtractor'],
    nodeTimings: { ...state.nodeTimings, EntityExtractor: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 4: COGNITIVE STATE EVALUATOR NODE
// ─────────────────────────────────────────────────────────────
export async function cognitiveEvaluationNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();
  const trade = state.extractedTrade;

  let psychologicalState = trade?.psychologicalState || 'Disciplined';
  let convictionScore = trade?.convictionScore || 7.5;
  let tiltScore = 15;
  let riskVerdict = 'Optimal Risk-Reward Geometry';
  let mandate = 'Adhere to initial stop-loss parameters.';

  if (psychologicalState === 'FOMO / Emotional') {
    tiltScore = 82;
    riskVerdict = 'High Tilt Danger · Elevated Chasing Velocity';
    mandate = 'Impose mandatory 30-minute cooling interval before engaging additional liquidity.';
  } else if (psychologicalState === 'Revenge Trading') {
    tiltScore = 95;
    riskVerdict = 'Critical Cognitive Degradation · Revenge Impulses';
    mandate = 'Cease execution immediately. Reset baseline dopamine and exit all margin exposure.';
  } else if (trade?.pnlPercentage && trade.pnlPercentage > 150) {
    tiltScore = 20;
    riskVerdict = 'High Conviction Expansion · Edge Realized';
    mandate = 'Protect capital by trailing profit stops. Avoid speculative re-entry on higher timeframes.';
  }

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    cognitiveAnalysis: {
      psychologicalState,
      convictionScore,
      tiltScore,
      riskVerdict,
      mandate
    },
    executionPath: [...state.executionPath, 'CognitiveEvaluator'],
    nodeTimings: { ...state.nodeTimings, CognitiveEvaluator: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 5: LEDGER MEMORY GRAPH MUTATION NODE
// ─────────────────────────────────────────────────────────────
export async function ledgerMemoryNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();

  if (state.intent === 'NEW_TRADE' && state.extractedTrade) {
    const trade = state.extractedTrade;
    const initialSol = state.detectedAmounts[0] || 2.5;

    const newPosition: TradePosition = {
      id: `pos-${Date.now()}`,
      token: trade.token,
      baseToken: 'SOL',
      pairTicker: `${trade.token} / SOL`,
      status: trade.pnlPercentage < -20 ? 'CLOSED' : 'OPEN',
      setupType: trade.setupType,
      psychologicalState: trade.psychologicalState,
      convictionScore: trade.convictionScore,
      openedAt: 'Just now',
      lastUpdatedAt: 'Just now',
      entryMcap: trade.entryMcap,
      currentMcap: trade.exitMcap || trade.entryMcap,
      initialSizeSol: initialSol,
      remainingSizeSol: trade.pnlPercentage < -20 ? 0 : initialSol,
      realizedPnlSol: trade.pnlSol,
      totalPnlPercentage: trade.pnlPercentage,
      conciseSummary: `${initialSol} SOL on ${trade.token} / SOL @ ${trade.entryMcap}. Setup: ${trade.setupType}. State: ${trade.psychologicalState}.`,
      keyTakeaway: trade.keyMistakeOrEdge,
      sessionId: `session-${Date.now()}`,
      events: [
        {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'ENTRY_BUY',
          sizeSol: initialSol,
          priceOrMcap: trade.entryMcap,
          notes: state.input
        }
      ]
    };

    const elapsed = Math.round(performance.now() - start);
    return {
      ...state,
      newPosition,
      summaryTitle: `${trade.token} Trade Audit`,
      executionPath: [...state.executionPath, 'LedgerMemoryGraph'],
      nodeTimings: { ...state.nodeTimings, LedgerMemoryGraph: elapsed }
    };
  }

  if (state.intent === 'UPDATE_POSITION' && state.currentPosition) {
    const lower = state.normalizedInput;
    const cur = state.currentPosition;
    let updatedStatus = cur.status;
    let newRealizedPnl = cur.realizedPnlSol;
    let remainingSol = cur.remainingSizeSol;
    let actionType: TradePosition['events'][0]['action'] = 'SCALE_OUT';
    let updateNotes = state.input;

    if (lower.includes('sold 50%') || lower.includes('half')) {
      const sold = remainingSol * 0.5;
      remainingSol -= sold;
      newRealizedPnl += sold * 1.5;
      actionType = 'SCALE_OUT';
      updatedStatus = remainingSol <= 0.2 ? 'CLOSED' : 'PARTIAL';
    } else if (lower.includes('sold 75%')) {
      const sold = remainingSol * 0.75;
      remainingSol -= sold;
      newRealizedPnl += sold * 2.0;
      actionType = 'SCALE_OUT';
      updatedStatus = remainingSol <= 0.2 ? 'CLOSED' : 'PARTIAL';
    } else if (lower.includes('closed') || lower.includes('exit') || lower.includes('cut') || lower.includes('stopped out')) {
      actionType = lower.includes('stopped out') ? 'STOP_LOSS' : 'EXIT_ALL';
      remainingSol = 0;
      updatedStatus = 'CLOSED';
    } else if (lower.includes('breakeven') || lower.includes('moved stop')) {
      actionType = 'NOTE';
      updateNotes = 'Trailing stop adjusted to breakeven';
    } else if (lower.includes('added') || lower.includes('dip')) {
      actionType = 'ADD_SIZE';
      remainingSol += 1.0;
    }

    const newEvent = {
      id: `ev-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionType,
      sizeSol: cur.remainingSizeSol - remainingSol,
      notes: updateNotes
    };

    const newConciseSummary = `${cur.initialSizeSol} SOL entry on ${cur.pairTicker}. Latest update: ${state.input.slice(0, 60)}. Realized PnL: ${newRealizedPnl >= 0 ? `+${newRealizedPnl.toFixed(1)}` : newRealizedPnl.toFixed(1)} SOL (${updatedStatus}).`;

    const updatedPos: TradePosition = {
      ...cur,
      status: updatedStatus,
      remainingSizeSol: Math.max(0, parseFloat(remainingSol.toFixed(2))),
      realizedPnlSol: parseFloat(newRealizedPnl.toFixed(1)),
      lastUpdatedAt: 'Just now',
      conciseSummary: newConciseSummary,
      events: [...cur.events, newEvent]
    };

    const elapsed = Math.round(performance.now() - start);
    return {
      ...state,
      updatedPosition: updatedPos,
      summaryTitle: `${cur.pairTicker} Update`,
      executionPath: [...state.executionPath, 'LedgerMemoryGraph'],
      nodeTimings: { ...state.nodeTimings, LedgerMemoryGraph: elapsed }
    };
  }

  const elapsed = Math.round(performance.now() - start);
  return {
    ...state,
    executionPath: [...state.executionPath, 'LedgerMemoryGraph'],
    nodeTimings: { ...state.nodeTimings, LedgerMemoryGraph: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 6: ANALYTICAL SYNTHESIS NODE
// ─────────────────────────────────────────────────────────────
export async function analyticalSynthesisNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();
  const isThisWeek = state.normalizedInput.includes('week');
  const scopeLabel = isThisWeek ? 'This Week' : 'Recent Trading Ledger';

  const totalPositions = state.positions.length;
  const wins = state.positions.filter((p) => p.realizedPnlSol > 0);
  const losses = state.positions.filter((p) => p.realizedPnlSol < 0);
  const winRate = totalPositions > 0 ? ((wins.length / totalPositions) * 100).toFixed(1) : '0.0';
  const totalPnl = state.positions.reduce((acc, p) => acc + p.realizedPnlSol, 0).toFixed(2);
  const totalSolDeployed = state.positions.reduce((acc, p) => acc + p.initialSizeSol, 0).toFixed(1);

  const bestTrade = state.positions.reduce((prev, cur) =>
    (prev.realizedPnlSol > cur.realizedPnlSol ? prev : cur), state.positions[0] || { token: '$SOL', realizedPnlSol: 0, setupType: 'N/A' });
  const worstTrade = state.positions.reduce((prev, cur) =>
    (prev.realizedPnlSol < cur.realizedPnlSol ? prev : cur), state.positions[0] || { token: '$SOL', realizedPnlSol: 0, setupType: 'N/A' });

  const replyContent = `### Cognitive Audit & Performance Summary: **${scopeLabel}**

**Executive Verdict: Net Statistical Edge Preserved (+${totalPnl} SOL)**

Based on your curated trade ledger for ${scopeLabel.toLowerCase()}:

* **Win Rate:** ${winRate}% (${wins.length} Wins / ${losses.length} Losses across ${totalPositions} positions)
* **Net Realized PnL:** **${parseFloat(totalPnl) >= 0 ? `+${totalPnl}` : totalPnl} SOL** (from ${totalSolDeployed} SOL deployed)
* **Highest-Conviction Edge:** **${bestTrade.token} / SOL** (+${bestTrade.realizedPnlSol} SOL, ${bestTrade.setupType})
* **Primary Psychological Leak:** **${worstTrade.token} / SOL** (${worstTrade.realizedPnlSol} SOL, ${worstTrade.setupType})

### Curated Position Summary:
${state.positions.map((p, idx) => `${idx + 1}. **${p.pairTicker}** (${p.status}) — ${p.setupType}
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

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    replyContent,
    summaryTitle: `Weekly Summary (${scopeLabel})`,
    quickActionChips,
    executionPath: [...state.executionPath, 'AnalyticalSynthesizer'],
    nodeTimings: { ...state.nodeTimings, AnalyticalSynthesizer: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH NODE 7: RESPONSE COMPOSER NODE
// ─────────────────────────────────────────────────────────────
export async function responseComposerNode(state: GraphState): Promise<GraphState> {
  const start = performance.now();

  // If already computed by analytical synthesizer
  if (state.replyContent) {
    const elapsed = Math.round(performance.now() - start);
    return {
      ...state,
      executionPath: [...state.executionPath, 'ResponseComposer'],
      nodeTimings: { ...state.nodeTimings, ResponseComposer: elapsed }
    };
  }

  let replyContent = '';
  let quickActionChips: { label: string; prompt: string }[] = [];

  // Handle RECORD_ASSIST
  if (state.intent === 'RECORD_ASSIST') {
    replyContent = `### Trade Recording & Journaling Assistant

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

    quickActionChips = [
      { label: '⚡ Pump.fun Snipe (4 SOL)', prompt: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M' },
      { label: '🌊 Raydium Migration (5 SOL)', prompt: 'sniped raydium migration on $GOAT 5 sol tight stop 15% scaled 75% at 3.5x' },
      { label: '🛑 Disciplined Stop Cut (-15%)', prompt: 'bought 2.5 sol $BONK at 1.2M stopped out at -15% disciplined cut' },
      { label: '⚠️ FOMO Top Chase (-40%)', prompt: 'fomoed 8 sol into $CHILL at 18M ath down 40% panic sold at bottom' }
    ];
  } else if (state.intent === 'NEW_TRADE' && state.newPosition && state.extractedTrade) {
    const trade = state.extractedTrade;
    const pos = state.newPosition;
    const cog = state.cognitiveAnalysis;

    replyContent = `### Cognitive Trade Audit: **${pos.token}**

**Verdict: ${cog?.riskVerdict || 'Disciplined Execution · High Expectancy'}**

Position successfully indexed into your **${pos.pairTicker}** trade history:

* **Pair:** ${pos.pairTicker}
* **Entry Size:** ${pos.initialSizeSol} SOL @ ${trade.entryMcap}
* **Setup Classification:** ${trade.setupType}
* **Psychological State:** ${trade.psychologicalState} (Conviction: ${trade.convictionScore}/10 · Tilt Index: ${cog?.tiltScore || 15}%)
* **Estimated PnL:** ${trade.pnlPercentage >= 0 ? `+${trade.pnlPercentage}%` : `${trade.pnlPercentage}%`} (${trade.pnlSol} SOL)

### Concise Summary:
*${pos.conciseSummary}*

* **Key Edge / Lesson:** ${trade.keyMistakeOrEdge}
* **Cognitive Mandate:** ${cog?.mandate || 'Plan your partial take-profit levels now.'}`;

    quickActionChips = [
      { label: '💰 Sold 50% (Scale Out)', prompt: 'sold 50% at 2x profit, moved stop to breakeven' },
      { label: '🛑 Trailing Stop Moved', prompt: 'moved trailing stop to breakeven to eliminate risk' },
      { label: '📊 Audit Weekly Performance', prompt: "how's the summary and my journal for this week" }
    ];
  } else if (state.intent === 'UPDATE_POSITION' && state.updatedPosition) {
    const pos = state.updatedPosition;
    replyContent = `### Position Memory Updated: **${pos.pairTicker}**

**Action Recorded into Trade Graph**

The Nako graph harness has registered your update into persistent trade memory:

* **Position Status:** **${pos.status}**
* **Remaining Capital at Risk:** **${pos.remainingSizeSol} SOL** (from ${pos.initialSizeSol} SOL initial)
* **Updated Realized PnL:** **${pos.realizedPnlSol >= 0 ? `+${pos.realizedPnlSol}` : pos.realizedPnlSol} SOL**
* **Concise Record:** *${pos.conciseSummary}*

### Cognitive Feedback:
Securing partial profit locks your mathematical expectancy. Keeping a runner eliminates psychological regret of selling too early.`;

    quickActionChips = [
      { label: '📊 Audit Weekly Performance', prompt: "how's the summary and my journal for this week" },
      { label: '📝 Record Another Trade', prompt: 'assist to record or journaling a trade' }
    ];
  } else {
    // GENERAL_CHAT
    replyContent = `### Nako Cognitive Assistant

I am observing your trade psychology and execution ledger through our graph-engineered agent pipeline.

* **To journal a trade:** Type naturally in your own style (e.g. *"aped 3 sol into $PNUT at 600k bonding curve dev sold..."*).
* **To update an active position:** Simply report what you did (e.g. *"sold 50% at 3x, moved stop to breakeven"*).
* **To review performance:** Ask anytime (e.g. *"how's the summary and my journal for this week?"*).

How would you like to proceed with your ledger today?`;

    quickActionChips = [
      { label: '📝 Assist Me to Record / Journal', prompt: 'assist to record or journaling a trade' },
      { label: '📊 How did I do this week?', prompt: "how's the summary and my journal for this week" },
      { label: '⚡ Record Pump.fun Snipe', prompt: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M' }
    ];
  }

  const elapsed = Math.round(performance.now() - start);

  return {
    ...state,
    replyContent,
    quickActionChips,
    executionPath: [...state.executionPath, 'ResponseComposer'],
    nodeTimings: { ...state.nodeTimings, ResponseComposer: elapsed }
  };
}

// ─────────────────────────────────────────────────────────────
// GRAPH RUNNER / ORCHESTRATOR
// ─────────────────────────────────────────────────────────────
export async function executeAgentGraph(
  input: string,
  positions: TradePosition[],
  currentPosition?: TradePosition | null
): Promise<GraphState> {
  const globalStart = performance.now();

  let state: GraphState = {
    traceId: `trc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    input,
    positions,
    currentPosition,
    normalizedInput: '',
    slangTokens: [],
    detectedTickers: [],
    detectedAmounts: [],
    intent: 'GENERAL_CHAT',
    confidence: 0,
    replyContent: '',
    quickActionChips: [],
    executionPath: [],
    nodeTimings: {},
    totalTimeMs: 0
  };

  // 1. Traverse Input Normalization
  state = await inputNormalizationNode(state);

  // 2. Traverse Intent Classifier
  state = await intentClassifierNode(state);

  // 3. Conditional Graph Edge Routing based on Intent
  if (state.intent === 'RECORD_ASSIST') {
    // Assist flow: Straight to Response Composer
    state = await responseComposerNode(state);
  } else if (state.intent === 'NEW_TRADE') {
    // New Trade Flow: Entity Extraction -> Cognitive Evaluation -> Ledger Memory -> Response Composer
    state = await entityExtractionNode(state);
    state = await cognitiveEvaluationNode(state);
    state = await ledgerMemoryNode(state);
    state = await responseComposerNode(state);
  } else if (state.intent === 'UPDATE_POSITION') {
    // Update Flow: Ledger Memory -> Response Composer
    state = await ledgerMemoryNode(state);
    state = await responseComposerNode(state);
  } else if (state.intent === 'ANALYTICAL_QUERY') {
    // Analytical Flow: Synthesis -> Response Composer
    state = await analyticalSynthesisNode(state);
    state = await responseComposerNode(state);
  } else {
    // General Chat Flow
    state = await responseComposerNode(state);
  }

  state.totalTimeMs = Math.round(performance.now() - globalStart);
  return state;
}

export function toGraphTrace(state: GraphState): GraphExecutionTrace {
  return {
    traceId: state.traceId,
    executionPath: state.executionPath,
    totalTimeMs: state.totalTimeMs,
    nodeTimings: state.nodeTimings,
    confidence: state.confidence
  };
}
