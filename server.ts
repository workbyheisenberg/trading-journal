import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeAgentGraph, toGraphTrace } from './src/services/graphEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ─────────────────────────────────────────────────────────────
  // BACKEND GRAPH ENGINEERING API ROUTES
  // ─────────────────────────────────────────────────────────────

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      engine: 'Mumus Graph Engineering Engine v2.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Main Agent Workflow Graph Execution Endpoint
  app.post('/api/agent/graph', async (req, res) => {
    try {
      const { input, positions = [], currentPosition = null } = req.body;
      if (typeof input !== 'string' || !input.trim()) {
        res.status(400).json({ error: 'Input text is required' });
        return;
      }

      // Execute graph engine pipeline
      const graphState = await executeAgentGraph(input, positions, currentPosition);
      const graphTrace = toGraphTrace(graphState);

      res.json({
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
        graphTrace,
        totalTimeMs: graphState.totalTimeMs
      });
    } catch (err: any) {
      console.error('[Graph Engine Error]:', err);
      res.status(500).json({
        error: 'Graph pipeline failure',
        message: err?.message || 'Unknown graph processing error'
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // ADMIN & LIVE CONTRACT ADDRESS (CA) CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  let liveContractAddress = process.env.CONTRACT_ADDRESS || 'MumusK9uWJt4h8vQZ3p7vKq2wL9mE5Xy4nB7rP8pump';
  let liveTokenSymbol = '$MUMUS';
  let liveMinTokenRequired = 500000;
  let lastUpdatedAt = new Date().toISOString();

  // Get active CA
  app.get('/api/admin/ca', (_req, res) => {
    res.json({
      contractAddress: liveContractAddress,
      tokenSymbol: liveTokenSymbol,
      minTokenRequired: liveMinTokenRequired,
      updatedAt: lastUpdatedAt
    });
  });

  // Verify Admin Password
  app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === 'farmerpemula') {
      res.json({ success: true, authenticated: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
  });

  // Update Live CA
  app.post('/api/admin/ca', (req, res) => {
    const { password, contractAddress, tokenSymbol, minTokenRequired } = req.body;
    if (password !== 'farmerpemula') {
      res.status(401).json({ success: false, error: 'Unauthorized: invalid admin password' });
      return;
    }

    if (!contractAddress || typeof contractAddress !== 'string') {
      res.status(400).json({ success: false, error: 'Valid Solana Contract Address required' });
      return;
    }

    liveContractAddress = contractAddress.trim();
    if (tokenSymbol && typeof tokenSymbol === 'string') {
      liveTokenSymbol = tokenSymbol.trim();
    }
    if (minTokenRequired && typeof minTokenRequired === 'number') {
      liveMinTokenRequired = minTokenRequired;
    }
    lastUpdatedAt = new Date().toISOString();

    console.log(`[Admin Update] CA updated live to: ${liveContractAddress} (${liveTokenSymbol})`);

    res.json({
      success: true,
      contractAddress: liveContractAddress,
      tokenSymbol: liveTokenSymbol,
      minTokenRequired: liveMinTokenRequired,
      updatedAt: lastUpdatedAt
    });
  });

  // ─────────────────────────────────────────────────────────────
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
  // ─────────────────────────────────────────────────────────────
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Mumus Server] Graph Engineering backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
