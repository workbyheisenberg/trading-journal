export type FontOption = 'instrument' | 'cormorant' | 'playfair';

export interface TrenchTradeMessage {
  id: string;
  timestamp: string;
  rawMessage: string;
  token: string;
  chain: 'Robinhood' | 'Solana' | 'Base' | 'Ethereum';
  setupType: 'Pump.fun Snipe' | 'Raydium Migration' | 'Dev Dump Reversal' | 'FOMO Top Chase' | 'Narrative Scalp' | 'Revenge Ape';
  psychologicalState: 'Disciplined' | 'High Conviction' | 'FOMO / Emotional' | 'Paper-Hand Tilt' | 'Revenge Trading';
  convictionScore: number; // 1-10
  entryMcap: string;
  exitMcap?: string;
  pnlSol: number;
  pnlPercentage: number;
  tags: string[];
  keyMistakeOrEdge: string;
}

export interface SetupAnalytics {
  setup: string;
  winRate: number;
  avgPnlSol: number;
  totalTrades: number;
  profitFactor: number;
}

export interface TradeEvent {
  id: string;
  timestamp: string;
  action: 'ENTRY_BUY' | 'SCALE_OUT' | 'ADD_SIZE' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'EXIT_ALL' | 'NOTE';
  sizeSol: number;
  priceOrMcap?: string;
  pnlSol?: number;
  pnlPercent?: number;
  notes?: string;
}

export interface TradePosition {
  id: string;
  token: string;              // e.g. '$PIPIN'
  baseToken: string;          // e.g. 'SOL'
  pairTicker: string;         // e.g. '$PIPIN / SOL'
  status: 'OPEN' | 'PARTIAL' | 'CLOSED';
  setupType: 'Pump.fun Snipe' | 'Raydium Migration' | 'Dev Dump Reversal' | 'FOMO Top Chase' | 'Narrative Scalp' | 'Revenge Ape' | 'Discretionary';
  psychologicalState: 'Disciplined' | 'High Conviction' | 'FOMO / Emotional' | 'Paper-Hand Tilt' | 'Revenge Trading';
  convictionScore: number;    // 1-10
  openedAt: string;
  lastUpdatedAt: string;
  entryMcap: string;
  currentMcap?: string;
  initialSizeSol: number;
  remainingSizeSol: number;
  realizedPnlSol: number;
  totalPnlPercentage: number;
  conciseSummary: string;
  keyTakeaway: string;
  events: TradeEvent[];
  sessionId: string;          // maps to JournalSession.id
}

export interface TradePairGroup {
  pairTicker: string;         // e.g. '$PIPIN / SOL'
  token: string;              // e.g. '$PIPIN'
  baseToken: string;          // 'SOL'
  color: string;              // Color theme for token avatar
  positions: TradePosition[];
}

export interface GraphExecutionTrace {
  traceId: string;
  executionPath: string[];
  totalTimeMs: number;
  nodeTimings: Record<string, number>;
  confidence?: number;
}

export interface JournalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  content: string;
  tradeData?: TrenchTradeMessage;
  reasoningTime?: string;
  intent?: 'NEW_TRADE' | 'UPDATE_POSITION' | 'ANALYTICAL_QUERY' | 'RECORD_ASSIST' | 'GENERAL_CHAT';
  updatedPosition?: TradePosition;
  quickActionChips?: { label: string; prompt: string }[];
  graphTrace?: GraphExecutionTrace;
}

export interface JournalSession {
  id: string;
  title: string;
  pairTicker?: string;        // e.g. '$PIPIN / SOL'
  positionId?: string;        // maps to TradePosition.id
  sessionType?: 'pair_position' | 'general_query';
  dateCategory: 'Today' | 'Yesterday' | 'Previous 7 Days';
  timestamp: string;
  preview: string;
  messages: JournalChatMessage[];
}
