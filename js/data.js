export const STOCKS = [
  { ticker: "NVDA", name: "NVIDIA Corporation", country: "USA", sector: "Technology", aiScore: 10, change: 1, fundamental: 9, technical: 10, sentiment: 9, lowRisk: 7, perfYtd: 26.55, price: 892.4 },
  { ticker: "MSFT", name: "Microsoft Corporation", country: "USA", sector: "Technology", aiScore: 10, change: 0, fundamental: 10, technical: 9, sentiment: 9, lowRisk: 8, perfYtd: 15.46, price: 415.2 },
  { ticker: "AAPL", name: "Apple Inc.", country: "USA", sector: "Technology", aiScore: 9, change: 0, fundamental: 9, technical: 8, sentiment: 9, lowRisk: 8, perfYtd: 8.32, price: 198.5 },
  { ticker: "META", name: "Meta Platforms Inc.", country: "USA", sector: "Technology", aiScore: 9, change: 1, fundamental: 8, technical: 9, sentiment: 10, lowRisk: 7, perfYtd: 22.18, price: 512.8 },
  { ticker: "AMZN", name: "Amazon.com Inc.", country: "USA", sector: "Consumer", aiScore: 9, change: -1, fundamental: 8, technical: 9, sentiment: 8, lowRisk: 7, perfYtd: 12.04, price: 186.3 },
  { ticker: "GOOGL", name: "Alphabet Inc.", country: "USA", sector: "Technology", aiScore: 8, change: 0, fundamental: 9, technical: 7, sentiment: 8, lowRisk: 8, perfYtd: 9.71, price: 172.6 },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", country: "USA", sector: "Financials", aiScore: 8, change: 1, fundamental: 9, technical: 7, sentiment: 7, lowRisk: 9, perfYtd: 18.22, price: 198.1 },
  { ticker: "V", name: "Visa Inc.", country: "USA", sector: "Financials", aiScore: 8, change: 0, fundamental: 9, technical: 7, sentiment: 7, lowRisk: 9, perfYtd: 11.35, price: 278.4 },
  { ticker: "UNH", name: "UnitedHealth Group", country: "USA", sector: "Healthcare", aiScore: 7, change: -1, fundamental: 8, technical: 6, sentiment: 7, lowRisk: 8, perfYtd: -4.12, price: 482.9 },
  { ticker: "TSLA", name: "Tesla Inc.", country: "USA", sector: "Consumer", aiScore: 7, change: 0, fundamental: 6, technical: 8, sentiment: 8, lowRisk: 4, perfYtd: -15.42, price: 248.7 },
  { ticker: "AMD", name: "Advanced Micro Devices", country: "USA", sector: "Technology", aiScore: 8, change: 1, fundamental: 7, technical: 9, sentiment: 8, lowRisk: 5, perfYtd: 19.88, price: 162.3 },
  { ticker: "CRM", name: "Salesforce Inc.", country: "USA", sector: "Technology", aiScore: 7, change: 0, fundamental: 8, technical: 6, sentiment: 7, lowRisk: 7, perfYtd: 5.44, price: 298.6 },
  { ticker: "NFLX", name: "Netflix Inc.", country: "USA", sector: "Communication", aiScore: 8, change: 0, fundamental: 7, technical: 8, sentiment: 9, lowRisk: 6, perfYtd: 31.2, price: 628.5 },
  { ticker: "BA", name: "Boeing Company", country: "USA", sector: "Industrials", aiScore: 5, change: -1, fundamental: 4, technical: 5, sentiment: 5, lowRisk: 3, perfYtd: -8.76, price: 178.2 },
  { ticker: "INTC", name: "Intel Corporation", country: "USA", sector: "Technology", aiScore: 4, change: 0, fundamental: 5, technical: 3, sentiment: 4, lowRisk: 5, perfYtd: -22.15, price: 42.8 },
];

export const ETFS = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", country: "USA", sector: "Broad Market", aiScore: 7, change: 0, fundamental: 7, technical: 7, sentiment: 7, lowRisk: 9, perfYtd: 10.2, price: 528.3 },
  { ticker: "QQQ", name: "Invesco QQQ Trust", country: "USA", sector: "Technology", aiScore: 8, change: 1, fundamental: 8, technical: 8, sentiment: 8, lowRisk: 7, perfYtd: 14.82, price: 445.6 },
  { ticker: "VTI", name: "Vanguard Total Stock Market", country: "USA", sector: "Broad Market", aiScore: 7, change: 0, fundamental: 7, technical: 7, sentiment: 7, lowRisk: 9, perfYtd: 9.55, price: 268.4 },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", country: "USA", sector: "Small Cap", aiScore: 6, change: -1, fundamental: 6, technical: 5, sentiment: 6, lowRisk: 6, perfYtd: 2.18, price: 198.7 },
  { ticker: "XLK", name: "Technology Select Sector SPDR", country: "USA", sector: "Technology", aiScore: 9, change: 1, fundamental: 8, technical: 9, sentiment: 9, lowRisk: 7, perfYtd: 18.44, price: 218.9 },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", country: "USA", sector: "Broad Market", aiScore: 7, change: 0, fundamental: 7, technical: 7, sentiment: 7, lowRisk: 9, perfYtd: 10.38, price: 486.2 },
  { ticker: "ARKK", name: "ARK Innovation ETF", country: "USA", sector: "Innovation", aiScore: 5, change: 0, fundamental: 4, technical: 6, sentiment: 6, lowRisk: 3, perfYtd: -6.42, price: 48.3 },
  { ticker: "GLD", name: "SPDR Gold Shares", country: "USA", sector: "Commodities", aiScore: 6, change: 1, fundamental: 6, technical: 7, sentiment: 6, lowRisk: 8, perfYtd: 12.65, price: 218.4 },
];

export const TRADE_IDEAS = [
  { ticker: "NVDA", name: "NVIDIA Corporation", signal: "Strong Buy", winRate: 72, horizon: "3M", aiScore: 10 },
  { ticker: "MSFT", name: "Microsoft Corporation", signal: "Strong Buy", winRate: 68, horizon: "3M", aiScore: 10 },
  { ticker: "META", name: "Meta Platforms Inc.", signal: "Buy", winRate: 65, horizon: "3M", aiScore: 9 },
  { ticker: "AMD", name: "Advanced Micro Devices", signal: "Buy", winRate: 63, horizon: "1M", aiScore: 8 },
  { ticker: "INTC", name: "Intel Corporation", signal: "Sell", winRate: 61, horizon: "3M", aiScore: 4 },
  { ticker: "BA", name: "Boeing Company", signal: "Sell", winRate: 60, horizon: "6M", aiScore: 5 },
];

export const ALPHA_SIGNALS = {
  NVDA: [
    { name: "Revenue growth YoY", value: 94, impact: "high" },
    { name: "RSI momentum", value: 82, impact: "high" },
    { name: "Analyst sentiment", value: 88, impact: "medium" },
    { name: "EPS surprise trend", value: 91, impact: "high" },
    { name: "Institutional buying", value: 76, impact: "medium" },
    { name: "Price vs 200-day MA", value: 85, impact: "medium" },
    { name: "Volatility (low risk)", value: 62, impact: "low" },
    { name: "Social media buzz", value: 79, impact: "medium" },
  ],
  MSFT: [
    { name: "Cloud revenue growth", value: 90, impact: "high" },
    { name: "Profit margin trend", value: 86, impact: "high" },
    { name: "Analyst sentiment", value: 84, impact: "medium" },
    { name: "RSI momentum", value: 72, impact: "medium" },
    { name: "Free cash flow yield", value: 88, impact: "high" },
    { name: "Insider activity", value: 65, impact: "low" },
    { name: "Beta (low risk)", value: 78, impact: "medium" },
    { name: "News sentiment", value: 80, impact: "medium" },
  ],
  AAPL: [
    { name: "Services revenue growth", value: 82, impact: "high" },
    { name: "Brand sentiment", value: 85, impact: "medium" },
    { name: "EPS growth", value: 78, impact: "high" },
    { name: "RSI momentum", value: 68, impact: "medium" },
    { name: "Buyback activity", value: 90, impact: "medium" },
    { name: "Price vs 50-day MA", value: 74, impact: "medium" },
    { name: "Volatility (low risk)", value: 72, impact: "medium" },
    { name: "Analyst upgrades", value: 76, impact: "medium" },
  ],
  TSLA: [
    { name: "Delivery growth", value: 55, impact: "high" },
    { name: "Margin compression", value: 42, impact: "high" },
    { name: "Social sentiment", value: 72, impact: "medium" },
    { name: "RSI momentum", value: 58, impact: "medium" },
    { name: "Competition pressure", value: 38, impact: "high" },
    { name: "Volatility (low risk)", value: 28, impact: "high" },
    { name: "Short interest trend", value:  45, impact: "medium" },
    { name: "Analyst sentiment", value: 52, impact: "medium" },
  ],
};

export function getScoreHistory(ticker, months = 12) {
  const base = STOCKS.find((s) => s.ticker === ticker)?.aiScore ?? ETFS.find((e) => e.ticker === ticker)?.aiScore ?? 7;
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
    const drift = (Math.sin(i * 0.8 + ticker.charCodeAt(0)) * 1.2) + (Math.random() - 0.5);
    data.push(Math.max(1, Math.min(10, Math.round(base + drift))));
  }
  data[data.length - 1] = base;
  return { labels, data };
}

export function getAllAssets() {
  return [...STOCKS, ...ETFS];
}

export function findAsset(ticker) {
  return getAllAssets().find((a) => a.ticker === ticker.toUpperCase());
}

export function getSignals(ticker) {
  return ALPHA_SIGNALS[ticker] ?? [
    { name: "Fundamental strength", value: 65 + Math.floor(Math.random() * 20), impact: "medium" },
    { name: "Technical momentum", value: 60 + Math.floor(Math.random() * 25), impact: "medium" },
    { name: "Market sentiment", value: 55 + Math.floor(Math.random() * 30), impact: "medium" },
    { name: "Risk-adjusted return", value: 50 + Math.floor(Math.random() * 35), impact: "low" },
    { name: "Analyst consensus", value: 58 + Math.floor(Math.random() * 28), impact: "medium" },
    { name: "Volume trend", value: 62 + Math.floor(Math.random() * 22), impact: "low" },
  ];
}

export function scoreClass(score) {
  return `score-${score}`;
}

export function formatChange(change) {
  if (change > 0) return `<span class="change-up">▲ ${change}</span>`;
  if (change < 0) return `<span class="change-down">▼ ${Math.abs(change)}</span>`;
  return `<span class="change-neutral">—</span>`;
}

export function formatPerf(perf) {
  const cls = perf >= 0 ? "perf-positive" : "perf-negative";
  const sign = perf >= 0 ? "+" : "";
  return `<span class="${cls}">${sign}${perf.toFixed(2)}%</span>`;
}

export function renderScoreBadge(score) {
  return `<span class="ai-score ${scoreClass(score)}">${score}</span>`;
}

export function renderSubScore(score) {
  return `<span class="sub-score">${score}</span>`;
}
