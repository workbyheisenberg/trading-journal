import type { TrenchTradeMessage, TradePosition } from '../src/types/index.ts';
import { ledgerMemoryNode, type GraphState } from '../src/services/graphEngine.ts';

const INTENTS = [
  'NEW_TRADE',
  'UPDATE_POSITION',
  'ANALYTICAL_QUERY',
  'RECORD_ASSIST',
  'GENERAL_CHAT'
] as const;

export type MuseIntent = (typeof INTENTS)[number];

export interface MuseCognitive {
  psychologicalState: string;
  convictionScore: number;
  tiltScore: number;
  riskVerdict: string;
  mandate: string;
}

export interface MuseResult {
  intent: MuseIntent;
  confidence: number;
  replyContent: string;
  summaryTitle?: string;
  quickActionChips: { label: string; prompt: string }[];
  extractedTrade?: TrenchTradeMessage;
  cognitiveAnalysis?: MuseCognitive;
  usage?: { input: number; output: number; total: number };
  model: string;
  latencyMs: number;
}

const SETUP_TYPES: TrenchTradeMessage['setupType'][] = [
  'Pump.fun Snipe',
  'Raydium Migration',
  'Dev Dump Reversal',
  'FOMO Top Chase',
  'Narrative Scalp',
  'Revenge Ape'
];

const PSYCH_STATES: TrenchTradeMessage['psychologicalState'][] = [
  'Disciplined',
  'High Conviction',
  'FOMO / Emotional',
  'Paper-Hand Tilt',
  'Revenge Trading'
];

const CHAINS: TrenchTradeMessage['chain'][] = ['Robinhood', 'Solana', 'Base', 'Ethereum'];

const SYSTEM_INSTRUCTIONS = [
  'You are Mumus, an elite crypto trench-trading journal AI. You parse degen trade messages,',
  'classify intent, extract structured trade data, and write brutally honest cognitive audits.',
  '',
  'Respond with ONLY one valid JSON object. No markdown fences, no prose outside JSON.',
  '',
  'Shape:',
  '{',
  '  "intent": "NEW_TRADE" | "UPDATE_POSITION" | "ANALYTICAL_QUERY" | "RECORD_ASSIST" | "GENERAL_CHAT",',
  '  "confidence": number 0..1,',
  '  "replyContent": string markdown,',
  '  "summaryTitle": string,',
  '  "quickActionChips": [ { "label": string, "prompt": string } ],',
  '  "extractedTrade": null | {',
  '     "token": string with leading $ e.g. "$PIPIN",',
  '     "chain": "Robinhood"|"Solana"|"Base"|"Ethereum",',
  '     "setupType": "Pump.fun Snipe"|"Raydium Migration"|"Dev Dump Reversal"|"FOMO Top Chase"|"Narrative Scalp"|"Revenge Ape",',
  '     "psychologicalState": "Disciplined"|"High Conviction"|"FOMO / Emotional"|"Paper-Hand Tilt"|"Revenge Trading",',
  '     "convictionScore": number 1..10, "entryMcap": string, "exitMcap": string,',
  '     "sizeSol": number, "pnlSol": number, "pnlPercentage": number,',
  '     "keyMistakeOrEdge": string, "tags": [string] },',
  '  "cognitiveAnalysis": null | { "psychologicalState": string, "convictionScore": number,',
  '     "tiltScore": number 0..100, "riskVerdict": string, "mandate": string }',
  '}',
  '',
  'INTENT RULES (strict):',
  '- NEW_TRADE: user describes a trade they executed with a token and/or size and a past-tense action',
  '  ("aped 4 sol into $PIPIN at 720k", "sniped $GOAT 5 sol", "bought 2 sol $BONK"). Fill extractedTrade.',
  '- UPDATE_POSITION: user is managing an EXISTING open position (sold/scaled/tp/cut/stopped out/added/moved stop/closed).',
  '  A current position is given in context.',
  '- ANALYTICAL_QUERY: user asks about performance, win rate, PnL, leak/tilt, weekly summary, "how did I do".',
  '- RECORD_ASSIST: user ONLY asks how to record/journal with NO concrete trade details.',
  '- GENERAL_CHAT: anything else.',
  'Never choose RECORD_ASSIST when concrete trade details are present - that is NEW_TRADE.',
  '',
  'replyContent: sharp, specific audit referencing token, size, setup, psychology, realized PnL, the edge,',
  'and the leak, ending with a clear mandate. Under ~220 words, use a "###" heading.',
  'For non-trade intents, answer directly using the positions context.'
].join('\n');

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as { output_text?: unknown; output?: unknown };
  if (typeof d.output_text === 'string' && d.output_text.trim()) return d.output_text;
  if (!Array.isArray(d.output)) return '';

  const parts: string[] = [];
  for (const item of d.output) {
    if (!item || typeof item !== 'object') continue;
    const it = item as { type?: unknown; text?: unknown; content?: unknown };
    if (it.type === 'output_text' && typeof it.text === 'string') parts.push(it.text);
    if (Array.isArray(it.content)) {
      for (const c of it.content) {
        if (!c || typeof c !== 'object') continue;
        const cc = c as { type?: unknown; text?: unknown };
        if (typeof cc.text === 'string' && (cc.type === 'output_text' || cc.type === 'text')) {
          parts.push(cc.text);
        }
      }
    }
  }
  return parts.join('\n');
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(t.slice(start, end + 1)) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeToken(raw: unknown): string {
  const s = asString(raw).trim();
  const cleaned = s.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
  return cleaned ? `$${cleaned}` : '$TRENCH';
}

function normalizeEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T,
  kind?: 'setup' | 'psych'
): T {
  const s = asString(raw).trim().toLowerCase();
  if (!s) return fallback;
  const exact = allowed.find((a) => a.toLowerCase() === s);
  if (exact) return exact;

  if (kind === 'setup') {
    if (/snipe|pump|bonding/.test(s)) return 'Pump.fun Snipe' as T;
    if (/migration|raydium|liquidity/.test(s)) return 'Raydium Migration' as T;
    if (/dev.?dump|reversal/.test(s)) return 'Dev Dump Reversal' as T;
    if (/fomo|chase|ath|green/.test(s)) return 'FOMO Top Chase' as T;
    if (/revenge/.test(s)) return 'Revenge Ape' as T;
  }
  if (kind === 'psych') {
    if (/fomo|emotion|panic/.test(s)) return 'FOMO / Emotional' as T;
    if (/revenge|tilt/.test(s)) return 'Revenge Trading' as T;
    if (/paper|weak/.test(s)) return 'Paper-Hand Tilt' as T;
    if (/high.?conviction|confident/.test(s)) return 'High Conviction' as T;
    if (/disciplin|diamond|calm/.test(s)) return 'Disciplined' as T;
  }
  const partial = allowed.find((a) => s.includes(a.toLowerCase()) || a.toLowerCase().includes(s));
  return (partial ?? fallback) as T;
}

function normalizeIntent(raw: unknown, fallback: MuseIntent): MuseIntent {
  const s = asString(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  return INTENTS.find((i) => i === s) ?? fallback;
}

function normalizeTrade(raw: unknown): TrenchTradeMessage | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const tagsRaw = Array.isArray(r.tags) ? r.tags : [];
  const tags = tagsRaw.map((t) => asString(t).trim()).filter(Boolean).slice(0, 8);

  return {
    id: `tr-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    rawMessage: asString(r.rawMessage),
    token: normalizeToken(r.token),
    chain: normalizeEnum(r.chain, CHAINS, 'Robinhood'),
    setupType: normalizeEnum(r.setupType, SETUP_TYPES, 'Narrative Scalp', 'setup'),
    psychologicalState: normalizeEnum(r.psychologicalState, PSYCH_STATES, 'Disciplined', 'psych'),
    convictionScore: clamp(asNumber(r.convictionScore, 6), 1, 10),
    entryMcap: asString(r.entryMcap, 'N/A'),
    exitMcap: asString(r.exitMcap) || undefined,
    pnlSol: asNumber(r.pnlSol, 0),
    pnlPercentage: asNumber(r.pnlPercentage, 0),
    tags: tags.length ? tags : ['Journaled'],
    keyMistakeOrEdge: asString(r.keyMistakeOrEdge, 'Journaled via Mumus AI.')
  };
}

function normalizeCognitive(raw: unknown): MuseCognitive | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    psychologicalState: asString(r.psychologicalState, 'Disciplined'),
    convictionScore: clamp(asNumber(r.convictionScore, 6), 1, 10),
    tiltScore: clamp(asNumber(r.tiltScore, 15), 0, 100),
    riskVerdict: asString(r.riskVerdict, 'Balanced risk geometry'),
    mandate: asString(r.mandate, 'Plan partial take-profit levels before entry.')
  };
}

function normalizeChips(raw: unknown): { label: string; prompt: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { label: string; prompt: string }[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const cc = c as Record<string, unknown>;
    const label = asString(cc.label).trim();
    const prompt = asString(cc.prompt).trim();
    if (label && prompt) out.push({ label, prompt });
    if (out.length >= 4) break;
  }
  return out;
}

function summarizePositions(positions: TradePosition[]): unknown[] {
  return (Array.isArray(positions) ? positions : []).slice(0, 12).map((p) => ({
    pairTicker: p.pairTicker,
    token: p.token,
    status: p.status,
    setupType: p.setupType,
    psychologicalState: p.psychologicalState,
    realizedPnlSol: p.realizedPnlSol,
    remainingSizeSol: p.remainingSizeSol,
    conciseSummary: p.conciseSummary
  }));
}

function makeBaseState(
  input: string,
  positions: TradePosition[],
  currentPosition: TradePosition | null
): GraphState {
  return {
    traceId: `muse-${Date.now().toString(36)}`,
    timestamp: Date.now(),
    input,
    positions,
    currentPosition,
    normalizedInput: input.toLowerCase(),
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
}

export interface MuseInvocation {
  result: MuseResult;
  newPosition?: TradePosition;
}

function readUsage(data: unknown): { input: number; output: number; total: number } | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const u = (data as { usage?: unknown }).usage;
  if (!u || typeof u !== 'object') return undefined;
  const uu = u as Record<string, unknown>;
  return {
    input: asNumber(uu.input_tokens, 0),
    output: asNumber(uu.output_tokens, 0),
    total: asNumber(uu.total_tokens, 0)
  };
}

export async function runMuseAgent(
  env: Env,
  input: string,
  positions: TradePosition[],
  currentPosition: TradePosition | null,
  sessionId: string,
  baselineIntent: MuseIntent,
  baselineNewPosition?: TradePosition
): Promise<MuseInvocation> {
  const apiKey = env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error('OPENCODE_API_KEY is not configured');

  const baseUrl = env.AI_BASE_URL || 'https://opencode.ai/zen/go/v1';
  const model = env.AI_MODEL || 'muse-spark-1.3-contributor';

  const context = {
    userMessage: input,
    openPositions: summarizePositions(positions),
    currentPosition: currentPosition
      ? {
          pairTicker: currentPosition.pairTicker,
          status: currentPosition.status,
          initialSizeSol: currentPosition.initialSizeSol,
          remainingSizeSol: currentPosition.remainingSizeSol,
          realizedPnlSol: currentPosition.realizedPnlSol,
          events: currentPosition.events.slice(-4).map((e) => ({
            action: e.action,
            sizeSol: e.sizeSol,
            notes: e.notes
          }))
        }
      : null,
    deterministicIntentHint: baselineIntent
  };

  const started = Date.now();
  const res = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'user-agent': 'mumus-trading-journal/1.0',
      'x-opencode-session': sessionId,
      accept: 'application/json'
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_INSTRUCTIONS,
      input: JSON.stringify(context),
      max_output_tokens: 4096
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Muse API HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data: unknown = await res.json();
  const text = extractOutputText(data);
  const parsed = extractJsonObject(text);
  if (!parsed) throw new Error('Muse API returned no parseable JSON');

  const intent = normalizeIntent(parsed.intent, baselineIntent);
  const trade = normalizeTrade(parsed.extractedTrade);
  const rawTrade = (parsed.extractedTrade ?? null) as Record<string, unknown> | null;
  const sizeSol = rawTrade ? clamp(asNumber(rawTrade.sizeSol, 2.5), 0, 100000) : 2.5;

  let newPosition: TradePosition | undefined;
  if (intent === 'NEW_TRADE' && trade) {
    const ledger = await ledgerMemoryNode({
      ...makeBaseState(input, positions, currentPosition),
      intent: 'NEW_TRADE',
      extractedTrade: trade,
      detectedAmounts: [sizeSol],
      pairTicker: `${trade.token} / SOL`
    });
    newPosition = ledger.newPosition ?? baselineNewPosition;
  } else if (intent === 'NEW_TRADE') {
    newPosition = baselineNewPosition;
  }

  const result: MuseResult = {
    intent,
    confidence: clamp(asNumber(parsed.confidence, 0.9), 0, 1),
    replyContent: asString(parsed.replyContent).trim(),
    summaryTitle: asString(parsed.summaryTitle).trim() || undefined,
    quickActionChips: normalizeChips(parsed.quickActionChips),
    extractedTrade: trade,
    cognitiveAnalysis: normalizeCognitive(parsed.cognitiveAnalysis),
    usage: readUsage(data),
    model,
    latencyMs: Date.now() - started
  };

  return { result, newPosition };
}
