import { TrenchTradeMessage, SetupAnalytics } from '../types';

export const INITIAL_TRENCH_MESSAGES: TrenchTradeMessage[] = [
  {
    id: 'tr-01',
    timestamp: '14:28:10 · 2m ago',
    rawMessage: 'aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% immediately but tg community absorbed floor, raydium migration hit locked 2x initial holding moonbag',
    token: '$PIPIN',
    chain: 'Robinhood',
    setupType: 'Pump.fun Snipe',
    psychologicalState: 'Disciplined',
    convictionScore: 8.8,
    entryMcap: '$720K',
    exitMcap: '$3.4M',
    pnlSol: 9.4,
    pnlPercentage: 235,
    tags: ['Pump.fun', 'Bonding Curve', 'Dev Dump Reversal', 'Initial Out'],
    keyMistakeOrEdge: 'Patiently held through dev dump after verifying volume absorption.'
  },
  {
    id: 'tr-02',
    timestamp: '11:05:44 · 3h ago',
    rawMessage: 'fomoed 8 sol into $CHILL at ath 18M cap down 40% in 90 seconds panic sold at the absolute bottom i hate myself',
    token: '$CHILL',
    chain: 'Robinhood',
    setupType: 'FOMO Top Chase',
    psychologicalState: 'FOMO / Emotional',
    convictionScore: 2.1,
    entryMcap: '$18.2M',
    exitMcap: '$10.9M',
    pnlSol: -3.2,
    pnlPercentage: -40,
    tags: ['FOMO Chase', 'Green Candle Entry', 'Panic Exit'],
    keyMistakeOrEdge: 'Chased 6 consecutive 1-minute green candles without waiting for pullback.'
  },
  {
    id: 'tr-03',
    timestamp: '08:42:19 · 5h ago',
    rawMessage: 'sniped raydium migration on $GOAT 5 sol entry set tight 15% trailing stop sold 75% at 3.5x leaving runner to valhalla',
    token: '$GOAT',
    chain: 'Robinhood',
    setupType: 'Raydium Migration',
    psychologicalState: 'Disciplined',
    convictionScore: 9.5,
    entryMcap: '$1.4M',
    exitMcap: '$4.9M',
    pnlSol: 12.5,
    pnlPercentage: 250,
    tags: ['Migration Snipe', 'Trailing Stop', 'Partial TP'],
    keyMistakeOrEdge: 'A+ execution on migration liquidity unlock with predefined TP rules.'
  },
  {
    id: 'tr-04',
    timestamp: 'Yesterday 22:15',
    rawMessage: 'lost 4 sol on a rug so I revenge aped 6 sol into some unverified ca without checking solscan down another 2.5 sol',
    token: '$PEPEAI',
    chain: 'Robinhood',
    setupType: 'Revenge Ape',
    psychologicalState: 'Revenge Trading',
    convictionScore: 1.8,
    entryMcap: '$240K',
    exitMcap: '$110K',
    pnlSol: -2.5,
    pnlPercentage: -41,
    tags: ['Tilt', 'Revenge Trade', 'Unverified Contract'],
    keyMistakeOrEdge: 'Violated 30-minute cooldown rule after getting rugged.'
  }
];

export const SETUP_ANALYTICS: SetupAnalytics[] = [
  { setup: 'Raydium Migration', winRate: 72.4, avgPnlSol: 8.6, totalTrades: 47, profitFactor: 3.2 },
  { setup: 'Pump.fun Snipe', winRate: 64.1, avgPnlSol: 5.2, totalTrades: 89, profitFactor: 2.4 },
  { setup: 'Dev Dump Reversal', winRate: 58.3, avgPnlSol: 4.1, totalTrades: 36, profitFactor: 1.9 },
  { setup: 'Narrative Scalp', winRate: 51.0, avgPnlSol: 1.8, totalTrades: 51, profitFactor: 1.2 },
  { setup: 'FOMO Top Chase', winRate: 18.5, avgPnlSol: -4.3, totalTrades: 27, profitFactor: 0.3 }
];

export const SAMPLE_PROMPTS = [
  "aped 4 sol into $PIPIN at 720k bonding curve dev dumped 30% held through dip sold at 3.4M",
  "fomoed 8 sol into $CHILL at 18M ath down 40% panic sold at bottom",
  "sniped raydium migration on $GOAT with 5 sol tight stop 15% 3.5x target hit",
  "revenge aped 5 sol into unverified ca after losing on previous rug -50%",
  "conviction dip buy on $WIF 20 sol entry at 1.80 TP at 3.20 executed"
];

export function parseTrenchMessage(raw: string): TrenchTradeMessage {
  const lower = raw.toLowerCase();
  
  // 1. Token extraction
  let token = '$TRENCH';
  const tokenMatch = raw.match(/\$[A-Za-z0-9_]+/);
  if (tokenMatch) {
    token = tokenMatch[0].toUpperCase();
  } else {
    // Try to find token name after keywords (e.g. "bought 2 sol of wif", "into pnut", "sniped bonk")
    const commonStopwords = new Set(['the', 'a', 'an', 'some', 'my', 'this', 'that', 'sol', 'solana', 'trade', 'bonding', 'dip', 'ath', 'high', 'low', 'top', 'bottom', 'curve']);
    const contextMatch = raw.match(/(?:into|on|of|bought|sniped|aped|traded|holding|longed)\s+([A-Za-z0-9]{2,10})/i);
    if (contextMatch && !commonStopwords.has(contextMatch[1].toLowerCase())) {
      token = `$${contextMatch[1].toUpperCase()}`;
    }
  }
  
  // 2. Extract sol amount
  const solMatch = raw.match(/(\d+(\.\d+)?)\s*(?:sol|sols|solana)/i);
  const solAmount = solMatch ? parseFloat(solMatch[1]) : 2.5;

  // 3. Extract entry mcap / price
  let entryMcap = '$650K';
  const mcapMatch = raw.match(/(?:at|@|mcap|cap)\s*(\$?\d+(\.\d+)?\s*[kmbKMB])/i) || raw.match(/(\$?\d+(\.\d+)?\s*[kmbKMB])/i);
  if (mcapMatch) {
    const val = mcapMatch[1].trim();
    entryMcap = val.startsWith('$') ? val.toUpperCase() : `$${val.toUpperCase()}`;
  }

  // 4. Setup, Psychology, and PnL determination
  let setupType: TrenchTradeMessage['setupType'] = 'Narrative Scalp';
  let psychologicalState: TrenchTradeMessage['psychologicalState'] = 'Disciplined';
  let convictionScore = 7.0;
  let pnlPercentage = 45;
  let keyMistakeOrEdge = 'Standard momentum execution with calculated entry parameters.';
  const tags: string[] = [];

  // Check explicit PnL mentioned in text
  const pctMatch = raw.match(/([+-]?\d+(\.\d+)?)\s*%/);
  const multMatch = raw.match(/(\d+(\.\d+)?)\s*x/i);
  const solPnlMatch = raw.match(/([+-]\d+(\.\d+)?)\s*sol/i);

  if (lower.includes('fomo') || lower.includes('ath') || lower.includes('green candle') || lower.includes('chased')) {
    setupType = 'FOMO Top Chase';
    psychologicalState = 'FOMO / Emotional';
    convictionScore = 2.4;
    pnlPercentage = pctMatch ? parseFloat(pctMatch[1]) : -38;
    keyMistakeOrEdge = 'Chased an extended pump without waiting for volume consolidation.';
    tags.push('FOMO Chase', 'Emotional Entry');
  } else if (lower.includes('revenge') || lower.includes('hate myself') || lower.includes('rage') || lower.includes('lost') || lower.includes('panic')) {
    setupType = 'Revenge Ape';
    psychologicalState = 'Revenge Trading';
    convictionScore = 1.9;
    pnlPercentage = pctMatch ? parseFloat(pctMatch[1]) : -45;
    keyMistakeOrEdge = 'Emotional tilt trading post-loss. Cooldown protocol recommended.';
    tags.push('Tilt Detected', 'Revenge Trade');
  } else if (lower.includes('migration') || lower.includes('raydium')) {
    setupType = 'Raydium Migration';
    psychologicalState = 'Disciplined';
    convictionScore = 9.2;
    pnlPercentage = multMatch ? (parseFloat(multMatch[1]) - 1) * 100 : (pctMatch ? parseFloat(pctMatch[1]) : 210);
    keyMistakeOrEdge = 'Systematic migration snipe with predefined risk and trailing stops.';
    tags.push('Migration Snipe', 'High Edge');
  } else if (lower.includes('pump') || lower.includes('bonding') || lower.includes('curve') || lower.includes('dev dump')) {
    setupType = 'Pump.fun Snipe';
    psychologicalState = 'High Conviction';
    convictionScore = 8.4;
    pnlPercentage = multMatch ? (parseFloat(multMatch[1]) - 1) * 100 : (pctMatch ? parseFloat(pctMatch[1]) : 165);
    keyMistakeOrEdge = 'High conviction play navigating early volatility with tight risk.';
    tags.push('Pump.fun', 'Bonding Curve', 'Absorption');
  } else if (lower.includes('conviction') || lower.includes('target') || lower.includes('tp') || lower.includes('dip')) {
    setupType = 'Dev Dump Reversal';
    psychologicalState = 'High Conviction';
    convictionScore = 9.0;
    pnlPercentage = multMatch ? (parseFloat(multMatch[1]) - 1) * 100 : (pctMatch ? parseFloat(pctMatch[1]) : 180);
    keyMistakeOrEdge = 'Strong patience and adherence to predefined exit plan.';
    tags.push('Conviction Hold', 'Discipline');
  } else if (pctMatch) {
    pnlPercentage = parseFloat(pctMatch[1]);
    if (pnlPercentage < 0) {
      setupType = 'FOMO Top Chase';
      psychologicalState = 'Paper-Hand Tilt';
      convictionScore = 3.5;
    }
  }

  let pnlSol = solPnlMatch
    ? parseFloat(solPnlMatch[1])
    : parseFloat(((solAmount * (pnlPercentage / 100))).toFixed(2));

  let exitMcap = pnlPercentage > 0 ? '$2.8M' : '$390K';
  const exitMcapMatch = raw.match(/(?:sold\s+at|tp\s+at|out\s+at|exit\s+at)\s*(\$?\d+(\.\d+)?\s*[kmbKMB])/i);
  if (exitMcapMatch) {
    const val = exitMcapMatch[1].trim();
    exitMcap = val.startsWith('$') ? val.toUpperCase() : `$${val.toUpperCase()}`;
  }

  return {
    id: `tr-${Date.now().toString().slice(-4)}`,
    timestamp: 'Just now',
    rawMessage: raw,
    token,
    chain: 'Robinhood',
    setupType,
    psychologicalState,
    convictionScore,
    entryMcap,
    exitMcap,
    pnlSol,
    pnlPercentage,
    tags,
    keyMistakeOrEdge
  };
}
