/** Clamp and scale helpers for 1–10 scores */
export function clampScore(value) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function scaleLinear(value, min, max, invert = false) {
  if (value == null || Number.isNaN(value)) return 5;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const score = 1 + t * 9;
  return clampScore(invert ? 10 - score + 1 : score);
}

export function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

function scoreRSI(rsi) {
  if (rsi == null) return 5;
  if (rsi >= 45 && rsi <= 65) return 9;
  if (rsi >= 35 && rsi <= 75) return 7;
  if (rsi > 80) return 4;
  if (rsi < 25) return 6;
  return 5;
}

function scoreFundamental(metric) {
  if (!metric || Object.keys(metric).length === 0) return 5;

  const pe = metric.peBasicExclExtraTTM ?? metric.peTTM;
  const peScore =
    pe == null ? 5 : pe <= 0 ? 3 : pe < 12 ? 7 : pe <= 25 ? 9 : pe <= 40 ? 6 : 4;

  const growth = metric.revenueGrowth3Y ?? metric.revenueGrowth5Y ?? metric.epsGrowth3Y;
  const growthScore = scaleLinear(growth, -5, 25);

  const roe = metric.roeTTM ?? metric.roiTTM;
  const roeScore = scaleLinear(roe, 0, 30);

  const margin = metric.netProfitMarginTTM ?? metric.grossMarginTTM;
  const marginScore = scaleLinear(margin, 0, 35);

  return clampScore((peScore + growthScore + roeScore + marginScore) / 4);
}

function scoreTechnical(closes, quote) {
  if (!closes.length) return 5;

  const price = quote?.price ?? closes[closes.length - 1];
  const rsi = computeRSI(closes);
  const ma50 = sma(closes, 50);
  const ma200 = sma(closes, 200);

  let trendScore = 5;
  if (ma50 != null && ma200 != null) {
    if (price > ma50 && ma50 > ma200) trendScore = 9;
    else if (price > ma50) trendScore = 7;
    else if (price < ma50 && ma50 < ma200) trendScore = 3;
    else trendScore = 5;
  } else if (ma50 != null) {
    trendScore = price > ma50 ? 7 : 4;
  }

  const momentumScore = scaleLinear(quote?.changePercent ?? 0, -3, 3);
  const rsiScore = scoreRSI(rsi);

  return clampScore((trendScore + momentumScore + rsiScore) / 3);
}

function scoreSentiment(recommendations) {
  if (!recommendations?.length) return 5;

  const latest = recommendations[0];
  const bullish = (latest.strongBuy ?? 0) + (latest.buy ?? 0);
  const bearish = (latest.sell ?? 0) + (latest.strongSell ?? 0);
  const total = bullish + bearish + (latest.hold ?? 0);
  if (total === 0) return 5;

  const ratio = (bullish - bearish) / total;
  return clampScore(5 + ratio * 5);
}

function scoreLowRisk(metric, quote) {
  const beta = metric?.beta;
  const betaScore = beta == null ? 5 : scaleLinear(beta, 0.4, 2.0, true);

  const high = metric?.["52WeekHigh"];
  const low = metric?.["52WeekLow"];
  const price = quote?.price;

  let rangeScore = 5;
  if (high != null && low != null && price != null && high > low) {
    const position = (price - low) / (high - low);
    rangeScore = scaleLinear(position, 0.2, 0.85);
  }

  return clampScore((betaScore + rangeScore) / 2);
}

export function computePerfYtd(closes, timestamps) {
  if (!closes.length) return null;

  const year = new Date().getFullYear();
  const jan1 = Math.floor(new Date(year, 0, 1).getTime() / 1000);

  let startClose = null;
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] >= jan1) {
      startClose = closes[i];
      break;
    }
  }
  if (startClose == null) startClose = closes[0];

  const current = closes[closes.length - 1];
  if (!startClose) return null;
  return ((current - startClose) / startClose) * 100;
}

function buildSignals({ metric, closes, quote, recommendations }) {
  const rsi = computeRSI(closes);
  const ma50 = sma(closes, 50);
  const ma200 = sma(closes, 200);
  const price = quote?.price ?? closes.at(-1);

  const signals = [];

  if (rsi != null) {
    signals.push({ name: "RSI (14-day)", value: clampScore(rsi / 10), raw: rsi, impact: "medium" });
  }
  if (ma50 != null && price != null) {
    const above50 = price > ma50 ? 75 : 35;
    signals.push({ name: "Price vs 50-day MA", value: above50, impact: "medium" });
  }
  if (ma200 != null && price != null) {
    const above200 = price > ma200 ? 78 : 32;
    signals.push({ name: "Price vs 200-day MA", value: above200, impact: "high" });
  }

  const pe = metric?.peBasicExclExtraTTM ?? metric?.peTTM;
  if (pe != null) {
    signals.push({ name: "P/E ratio", value: scaleLinear(pe, 8, 45, true) * 10, impact: "medium" });
  }

  const growth = metric?.revenueGrowth3Y ?? metric?.revenueGrowth5Y;
  if (growth != null) {
    signals.push({ name: "Revenue growth (3Y)", value: scaleLinear(growth, -5, 30) * 10, impact: "high" });
  }

  const roe = metric?.roeTTM ?? metric?.roiTTM;
  if (roe != null) {
    signals.push({ name: "Return on equity", value: scaleLinear(roe, 0, 30) * 10, impact: "medium" });
  }

  if (metric?.beta != null) {
    signals.push({ name: "Beta (volatility)", value: scaleLinear(metric.beta, 0.4, 2, true) * 10, impact: "medium" });
  }

  if (recommendations?.length) {
    const latest = recommendations[0];
    const bullish = (latest.strongBuy ?? 0) + (latest.buy ?? 0);
    const total = bullish + (latest.hold ?? 0) + (latest.sell ?? 0) + (latest.strongSell ?? 0);
    if (total > 0) {
      signals.push({ name: "Analyst sentiment", value: clampScore((bullish / total) * 10), impact: "high" });
    }
  }

  if (quote?.changePercent != null) {
    signals.push({
      name: "Daily momentum",
      value: scaleLinear(quote.changePercent, -4, 4) * 10,
      impact: "low",
    });
  }

  return signals.slice(0, 8).map((s) => ({
    name: s.name,
    value: clampScore(typeof s.value === "number" && s.value <= 10 ? s.value : s.value / 10),
    impact: s.impact,
  }));
}

export function computeScores({ metric = {}, closes = [], timestamps = [], quote, recommendations = [] }) {
  const fundamental = scoreFundamental(metric);
  const technical = scoreTechnical(closes, quote);
  const sentiment = scoreSentiment(recommendations);
  const lowRisk = scoreLowRisk(metric, quote);
  const aiScore = clampScore(fundamental * 0.3 + technical * 0.3 + sentiment * 0.2 + lowRisk * 0.2);
  const perfYtd = computePerfYtd(closes, timestamps);
  const signals = buildSignals({ metric, closes, quote, recommendations });

  return {
    aiScore,
    change: 0,
    fundamental,
    technical,
    sentiment,
    lowRisk,
    perfYtd,
    signals,
  };
}
