import { executeAgentGraph, toGraphTrace } from '../src/services/graphEngine.ts';
import { runMuseAgent, type MuseIntent } from './muse.ts';

const DEFAULT_CA = '0xef5749726f8ea6c45bc3d931fd4af8aa8d8d938f';
const DEFAULT_SYMBOL = '$MUMUS';
const DEFAULT_MIN_TOKEN = 500000;
const CA_KEY = 'live_ca';

interface CaConfig {
  contractAddress: string;
  tokenSymbol: string;
  minTokenRequired: number;
  updatedAt: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

async function timingSafeEqual(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function getCaConfig(env: Env): Promise<CaConfig> {
  try {
    const stored = await env.MUMUS_CONFIG.get<CaConfig>(CA_KEY, 'json');
    if (stored && stored.contractAddress) {
      return stored;
    }
  } catch (err) {
    console.warn(
      JSON.stringify({ message: 'CA config read failed, using defaults', error: String(err) })
    );
  }
  return {
    contractAddress: env.CONTRACT_ADDRESS || DEFAULT_CA,
    tokenSymbol: DEFAULT_SYMBOL,
    minTokenRequired: DEFAULT_MIN_TOKEN,
    updatedAt: new Date().toISOString()
  };
}

async function handleGraph(request: Request, env: Env): Promise<Response> {
  let body: { input?: unknown; positions?: unknown; currentPosition?: unknown; sessionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { input, positions = [], currentPosition = null } = body;
  if (typeof input !== 'string' || !input.trim()) {
    return json({ error: 'Input text is required' }, 400);
  }

  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.trim()
      ? body.sessionId.trim()
      : `mumus-${crypto.randomUUID()}`;

  // Deterministic graph engine: always runs, provides baseline + fallback.
  const baseline = await executeAgentGraph(
    input,
    (positions as never[]) ?? [],
    (currentPosition as never) ?? null
  );

  const positionsArr = (Array.isArray(positions) ? positions : []) as Parameters<typeof runMuseAgent>[2];
  const currentPos = (currentPosition ?? null) as Parameters<typeof runMuseAgent>[3];

  let invocation: Awaited<ReturnType<typeof runMuseAgent>> | null = null;
  let modelError: string | null = null;
  try {
    invocation = await runMuseAgent(
      env,
      input,
      positionsArr,
      currentPos,
      sessionId,
      baseline.intent as MuseIntent,
      baseline.newPosition
    );
  } catch (err) {
    modelError = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ message: 'Muse agent failed, using deterministic fallback', error: modelError }));
  }

  if (!invocation) {
    return json({
      success: true,
      traceId: baseline.traceId,
      intent: baseline.intent,
      confidence: baseline.confidence,
      replyContent: baseline.replyContent,
      quickActionChips: baseline.quickActionChips,
      tradeData: baseline.extractedTrade,
      cognitiveAnalysis: baseline.cognitiveAnalysis,
      newPosition: baseline.newPosition,
      updatedPosition: baseline.updatedPosition,
      pairTicker: baseline.pairTicker,
      summaryTitle: baseline.summaryTitle,
      graphTrace: toGraphTrace(baseline),
      totalTimeMs: baseline.totalTimeMs,
      engine: 'graph-fallback',
      usedModel: false,
      modelError
    });
  }

  const r = invocation.result;
  const intent = r.intent;
  const replyContent = r.replyContent || baseline.replyContent;
  const summaryTitle = r.summaryTitle || baseline.summaryTitle;
  const quickActionChips = r.quickActionChips.length ? r.quickActionChips : baseline.quickActionChips;
  const cognitiveAnalysis = r.cognitiveAnalysis || baseline.cognitiveAnalysis;
  const newPosition = invocation.newPosition ?? baseline.newPosition;
  const updatedPosition = baseline.updatedPosition;
  const tradeData = r.extractedTrade ?? baseline.extractedTrade;
  const pairTicker =
    newPosition?.pairTicker ||
    (intent === 'NEW_TRADE' && tradeData ? `${tradeData.token} / SOL` : baseline.pairTicker);

  const graphTrace = {
    traceId: baseline.traceId,
    executionPath: [...baseline.executionPath, `MuseAgent:${r.model}`],
    totalTimeMs: baseline.totalTimeMs + r.latencyMs,
    nodeTimings: { ...baseline.nodeTimings, MuseAgent: r.latencyMs },
    confidence: r.confidence
  };

  return json({
    success: true,
    traceId: baseline.traceId,
    intent,
    confidence: r.confidence,
    replyContent,
    quickActionChips,
    tradeData,
    cognitiveAnalysis,
    newPosition,
    updatedPosition,
    pairTicker,
    summaryTitle,
    graphTrace,
    totalTimeMs: baseline.totalTimeMs + r.latencyMs,
    engine: r.model,
    usedModel: true,
    usage: r.usage
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (pathname === '/api/health' && method === 'GET') {
    return json({
      status: 'ok',
      engine: 'Mumus AI Journal Engine v3.0',
      aiProvider: 'opencode-go',
      aiModel: env.AI_MODEL || 'muse-spark-1.3-contributor',
      aiConfigured: Boolean(env.OPENCODE_API_KEY),
      runtime: 'cloudflare-workers',
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/agent/graph' && method === 'POST') {
    return handleGraph(request, env);
  }

  if (pathname === '/api/admin/ca' && method === 'GET') {
    return json(await getCaConfig(env));
  }

  if (pathname === '/api/admin/ca' && method === 'POST') {
    return handleCaUpdate(request, env);
  }

  if (pathname === '/api/admin/verify' && method === 'POST') {
    let body: { password?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const password = typeof body.password === 'string' ? body.password : '';
    const ok = await timingSafeEqual(password, env.ADMIN_PASSWORD);
    return ok
      ? json({ success: true, authenticated: true })
      : json({ success: false, error: 'Invalid admin credentials' }, 401);
  }

  return json({ error: 'Not found' }, 404);
}

async function handleCaUpdate(request: Request, env: Env): Promise<Response> {
  let body: {
    password?: unknown;
    contractAddress?: unknown;
    tokenSymbol?: unknown;
    minTokenRequired?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const ok = await timingSafeEqual(password, env.ADMIN_PASSWORD);
  if (!ok) {
    return json({ success: false, error: 'Unauthorized: invalid admin password' }, 401);
  }

  if (typeof body.contractAddress !== 'string' || !body.contractAddress.trim()) {
    return json({ success: false, error: 'Valid Contract Address required' }, 400);
  }

  const current = await getCaConfig(env);
  const next: CaConfig = {
    contractAddress: body.contractAddress.trim(),
    tokenSymbol:
      typeof body.tokenSymbol === 'string' && body.tokenSymbol.trim()
        ? body.tokenSymbol.trim()
        : current.tokenSymbol,
    minTokenRequired:
      typeof body.minTokenRequired === 'number' ? body.minTokenRequired : current.minTokenRequired,
    updatedAt: new Date().toISOString()
  };

  await env.MUMUS_CONFIG.put(CA_KEY, JSON.stringify(next));

  console.log(
    JSON.stringify({ message: 'CA updated', contractAddress: next.contractAddress, symbol: next.tokenSymbol })
  );

  return json({ success: true, ...next });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) {
        return await handleApi(request, env);
      }
      return await env.ASSETS.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(JSON.stringify({ message: 'unhandled error', error: message, path: url.pathname }));
      return json({ error: 'Internal server error' }, 500);
    }
  }
} satisfies ExportedHandler<Env>;
