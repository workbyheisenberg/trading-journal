import { TradePosition, JournalChatMessage, GraphExecutionTrace } from '../types/index.ts';
import { executeAgentGraph, toGraphTrace } from './graphEngine.ts';

export interface GraphApiResponse {
  success: boolean;
  traceId: string;
  intent: JournalChatMessage['intent'];
  confidence: number;
  replyContent: string;
  quickActionChips: { label: string; prompt: string }[];
  tradeData?: any;
  cognitiveAnalysis?: any;
  newPosition?: TradePosition;
  updatedPosition?: TradePosition;
  pairTicker?: string;
  summaryTitle?: string;
  graphTrace: GraphExecutionTrace;
  totalTimeMs: number;
  engine?: string;
  usedModel?: boolean;
  usage?: { input: number; output: number; total: number };
  modelError?: string | null;
}

function getAgentSessionId(): string {
  try {
    const key = 'nako_agent_session';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `nako-${Date.now().toString(36)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `nako-${Date.now().toString(36)}`;
  }
}

export async function dispatchGraphAgent(
  input: string,
  positions: TradePosition[],
  currentPosition?: TradePosition | null
): Promise<GraphApiResponse> {
  try {
    const res = await fetch('/api/agent/graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        positions,
        currentPosition,
        sessionId: getAgentSessionId()
      })
    });

    if (!res.ok) {
      throw new Error(`Backend returned HTTP ${res.status}`);
    }

    const data: GraphApiResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('[Graph Client] Backend call skipped or offline, using isomorphic graph engine:', err);
    // Isomorphic Fallback: Run directly on client graph engine
    const graphState = await executeAgentGraph(input, positions, currentPosition);
    return {
      success: true,
      traceId: graphState.traceId,
      intent: graphState.intent,
      confidence: graphState.confidence,
      replyContent: graphState.replyContent,
      quickActionChips: graphState.quickActionChips,
      tradeData: graphState.extractedTrade,
      cognitiveAnalysis: graphState.cognitiveAnalysis,
      newPosition: graphState.newPosition,
      updatedPosition: graphState.updatedPosition,
      pairTicker: graphState.pairTicker,
      summaryTitle: graphState.summaryTitle,
      graphTrace: toGraphTrace(graphState),
      totalTimeMs: graphState.totalTimeMs
    };
  }
}
