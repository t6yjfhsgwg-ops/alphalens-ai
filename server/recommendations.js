import { clampScore } from "./scoring.js";

/** Stocks & ETFs scanned for daily recommendations */
export const STOCK_UNIVERSE = [
  "NVDA", "MSFT", "AAPL", "META", "AMZN", "GOOGL", "JPM", "V", "UNH", "TSLA",
  "AMD", "CRM", "NFLX", "BA", "INTC",
];

export const ETF_UNIVERSE = [
  "SPY", "QQQ", "VTI", "IWM", "XLK", "VOO", "ARKK", "GLD",
];

const SIGNALS = [
  { min: 9, signal: "Strong Buy", action: "bullish" },
  { min: 7, signal: "Buy", action: "bullish" },
  { min: 5, signal: "Hold", action: "neutral" },
  { min: 3, signal: "Sell", action: "bearish" },
  { min: 0, signal: "Strong Sell", action: "bearish" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function scoreSpread(subscores) {
  const vals = subscores.filter((v) => v != null);
  if (vals.length < 2) return 3;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

function pickSignal(aiScore) {
  for (const row of SIGNALS) {
    if (aiScore >= row.min) return row;
  }
  return SIGNALS[SIGNALS.length - 1];
}

function buildFactors(scores, quote) {
  const factors = [];
  const { fundamental, technical, sentiment, lowRisk, aiScore } = scores;

  if (fundamental >= 8) factors.push({ label: "Strong fundamentals", impact: "positive", weight: fundamental });
  else if (fundamental <= 4) factors.push({ label: "Weak fundamentals", impact: "negative", weight: fundamental });

  if (technical >= 8) factors.push({ label: "Bullish technical trend", impact: "positive", weight: technical });
  else if (technical <= 4) factors.push({ label: "Bearish technical setup", impact: "negative", weight: technical });

  if (sentiment >= 8) factors.push({ label: "Positive analyst sentiment", impact: "positive", weight: sentiment });
  else if (sentiment <= 4) factors.push({ label: "Negative analyst sentiment", impact: "negative", weight: sentiment });

  if (lowRisk >= 8) factors.push({ label: "Lower volatility profile", impact: "positive", weight: lowRisk });
  else if (lowRisk <= 4) factors.push({ label: "High risk / volatility", impact: "negative", weight: lowRisk });

  if (quote?.changePercent != null) {
    if (quote.changePercent > 1.5) factors.push({ label: "Strong recent momentum", impact: "positive", weight: 7 });
    else if (quote.changePercent < -1.5) factors.push({ label: "Recent price weakness", impact: "negative", weight: 3 });
  }

  if (scores.perfYtd != null) {
    if (scores.perfYtd > 15) factors.push({ label: "Strong YTD performance", impact: "positive", weight: 8 });
    else if (scores.perfYtd < -10) factors.push({ label: "Weak YTD performance", impact: "negative", weight: 3 });
  }

  factors.push({
    label: `Composite AI score ${aiScore}/10`,
    impact: aiScore >= 6 ? "positive" : "negative",
    weight: aiScore,
  });

  return factors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(({ label, impact }) => ({ label, impact }));
}

/**
 * Rule-based 3-month outlook model (educational — not ML training).
 * Combines AI sub-scores, momentum, and risk into expected return & confidence.
 */
export function generatePrediction({ scores, quote, horizon = "3M" }) {
  const { aiScore, fundamental, technical, sentiment, lowRisk, perfYtd } = scores;
  const { signal, action } = pickSignal(aiScore);

  const winProbability = clampScore(Math.round(32 + aiScore * 4.2));

  const scoreEdge = (aiScore - 5) * 1.8;
  const momentumEdge = (quote?.changePercent ?? 0) * 0.35;
  const technicalEdge = (technical - 5) * 0.4;
  const sentimentEdge = (sentiment - 5) * 0.35;
  const riskEdge = (lowRisk - 5) * 0.25;
  const ytdEdge = perfYtd != null ? clamp(perfYtd / 20, -2, 2) : 0;

  const predictedReturn = round1(
    clamp(scoreEdge + momentumEdge + technicalEdge + sentimentEdge + riskEdge + ytdEdge, -18, 28)
  );

  const spread = scoreSpread([fundamental, technical, sentiment, lowRisk]);
  const confidence = clampScore(Math.round(88 - spread * 9));

  const currentPrice = quote?.price ?? null;
  const priceTarget =
    currentPrice != null ? round1(currentPrice * (1 + predictedReturn / 100)) : null;

  const horizonMonths = horizon === "1M" ? 1 : horizon === "6M" ? 6 : 3;
  const summary = buildSummary(signal, predictedReturn, winProbability, horizon);

  return {
    ticker: quote?.ticker,
    horizon,
    horizonMonths,
    signal,
    action,
    aiScore,
    winProbability,
    predictedReturn,
    confidence,
    currentPrice,
    priceTarget,
    upside: priceTarget != null && currentPrice != null ? round1(priceTarget - currentPrice) : null,
    factors: buildFactors(scores, quote),
    summary,
    model: "alphalens-v1",
    disclaimer:
      "Model output is for education only. Not financial advice. Past patterns do not guarantee future results.",
    generatedAt: Date.now(),
  };
}

function buildSummary(signal, predictedReturn, winProbability, horizon) {
  const dir = predictedReturn >= 0 ? "outperform" : "underperform";
  const pct = Math.abs(predictedReturn);
  return (
    `${signal} — ${horizon} model expects the stock to ${dir} the market by ~${pct}% ` +
    `with ${winProbability}% estimated win probability.`
  );
}

export function rankRecommendations(items, { sort = "return", limit = 10 } = {}) {
  const sorted = [...items].sort((a, b) => {
    if (sort === "score") return b.prediction.aiScore - a.prediction.aiScore;
    if (sort === "confidence") return b.prediction.confidence - a.prediction.confidence;
    return b.prediction.predictedReturn - a.prediction.predictedReturn;
  });

  const buys = sorted.filter((i) => i.prediction.action === "bullish").slice(0, limit);
  const sells = sorted
    .filter((i) => i.prediction.action === "bearish")
    .sort((a, b) => a.prediction.predictedReturn - b.prediction.predictedReturn)
    .slice(0, Math.min(5, limit));

  return { buys, sells, all: sorted };
}
