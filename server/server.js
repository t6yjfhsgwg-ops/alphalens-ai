import "dotenv/config";
import express from "express";
import cors from "cors";
import { computeScores } from "./scoring.js";
import {
  saveStockProfile,
  getCachedQuote,
  saveQuote,
  getCachedScores,
  saveScores,
  getScoreHistory,
  getDbStats,
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:8080", "http://127.0.0.1:8080"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(null, true); // allow Vercel preview URLs during setup
      }
    },
  })
);
app.use(express.json());

function requireApiKey(res) {
  if (!FINNHUB_API_KEY) {
    res.status(500).json({
      error: "FINNHUB_API_KEY is not set. Add it to server/.env and restart.",
    });
    return false;
  }
  return true;
}

function normalizeTicker(raw) {
  return raw?.trim().toUpperCase();
}

function isValidTicker(ticker) {
  return ticker && /^[A-Z.]{1,10}$/.test(ticker);
}

async function finnhubGet(path) {
  const url = `https://finnhub.io/api/v1${path}${path.includes("?") ? "&" : "?"}token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub request failed (${response.status})`);
  }
  return response.json();
}

async function fetchQuoteFromFinnhub(ticker) {
  const data = await finnhubGet(`/quote?symbol=${encodeURIComponent(ticker)}`);
  if (data.c == null || data.c === 0) {
    throw new Error("No quote data");
  }
  return {
    ticker,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: data.t,
  };
}

async function getQuote(ticker) {
  const cached = getCachedQuote(ticker);
  if (cached) return cached;

  const quote = await fetchQuoteFromFinnhub(ticker);
  saveQuote(quote);
  return quote;
}

async function fetchProfileFromFinnhub(ticker) {
  try {
    const data = await finnhubGet(`/stock/profile2?symbol=${encodeURIComponent(ticker)}`);
    if (!data || !data.name) throw new Error("No profile");
    const profile = {
      ticker: data.ticker || ticker,
      name: data.name,
      country: data.country || "—",
      sector: data.finnhubIndustry || "—",
      exchange: data.exchange || "—",
      currency: data.currency || "USD",
      marketCap: data.marketCapitalization ?? null,
      logo: data.logo || null,
      weburl: data.weburl || null,
    };
    saveStockProfile(profile);
    return profile;
  } catch {
    return {
      ticker,
      name: ticker,
      country: "—",
      sector: "—",
      exchange: "—",
      currency: "USD",
      marketCap: null,
      logo: null,
      weburl: null,
    };
  }
}

async function fetchCandles(ticker) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 400 * 24 * 60 * 60;
    const data = await finnhubGet(
      `/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`
    );
    if (data.s !== "ok" || !data.c?.length) return { closes: [], timestamps: [] };
    return { closes: data.c, timestamps: data.t };
  } catch {
    return { closes: [], timestamps: [] };
  }
}

async function fetchMetrics(ticker) {
  try {
    const data = await finnhubGet(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`);
    return data.metric || {};
  } catch {
    return {};
  }
}

async function fetchRecommendations(ticker) {
  try {
    return await finnhubGet(`/stock/recommendation?symbol=${encodeURIComponent(ticker)}`);
  } catch {
    return [];
  }
}

async function fetchScoresForTicker(ticker, quoteOverride = null) {
  const cached = getCachedScores(ticker);
  if (cached) return cached;

  let quote;
  try {
    quote = quoteOverride ?? (await getQuote(ticker));
  } catch (err) {
    throw new Error(err.message || "No quote data");
  }

  const [metric, candleData, recommendations] = await Promise.all([
    fetchMetrics(ticker),
    fetchCandles(ticker),
    fetchRecommendations(ticker),
  ]);

  const scores = computeScores({
    metric,
    closes: candleData.closes,
    timestamps: candleData.timestamps,
    quote,
    recommendations,
  });

  saveScores(ticker, scores);
  return scores;
}

async function searchSymbolsFromFinnhub(query) {
  const data = await finnhubGet(`/search?q=${encodeURIComponent(query)}`);
  return (data.result || [])
    .filter((r) => r.type === "Common Stock" || r.type === "ETP" || r.type === "ETF")
    .slice(0, 10)
    .map((r) => ({
      ticker: r.symbol,
      name: r.description,
      type: r.type,
      displaySymbol: r.displaySymbol || r.symbol,
    }));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "AlphaLens API is running", db: getDbStats() });
});

app.get("/api/search", async (req, res) => {
  if (!requireApiKey(res)) return;
  const q = String(req.query.q || "").trim();
  if (q.length < 1) {
    return res.status(400).json({ error: "Provide q query param, e.g. ?q=apple" });
  }
  try {
    res.json({ query: q, results: await searchSymbolsFromFinnhub(q) });
  } catch (err) {
    console.error(`Search error (${q}):`, err.message);
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

app.get("/api/scores", async (req, res) => {
  if (!requireApiKey(res)) return;

  const tickers = [...new Set(
    String(req.query.tickers || "")
      .split(",")
      .map((t) => normalizeTicker(t))
      .filter(isValidTicker)
  )].slice(0, 10);

  if (tickers.length === 0) {
    return res.status(400).json({ error: "Provide tickers query param" });
  }

  const result = {};
  for (const ticker of tickers) {
    try {
      result[ticker] = await fetchScoresForTicker(ticker);
    } catch (err) {
      result[ticker] = { error: err.message };
    }
    await sleep(250);
  }
  res.json(result);
});

app.get("/api/stock/:ticker/history", (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);
  if (!isValidTicker(ticker)) {
    return res.status(400).json({ error: "Invalid ticker symbol" });
  }
  res.json({ ticker, ...getScoreHistory(ticker) });
});

app.get("/api/stock/:ticker", async (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);
  if (!isValidTicker(ticker)) {
    return res.status(400).json({ error: "Invalid ticker symbol" });
  }
  if (!requireApiKey(res)) return;

  try {
    const quote = await getQuote(ticker);
    const [profile, scores] = await Promise.all([
      fetchProfileFromFinnhub(ticker),
      fetchScoresForTicker(ticker, quote),
    ]);
    res.json({ ...profile, quote, scores, scoreHistory: getScoreHistory(ticker) });
  } catch (err) {
    console.error(`Stock fetch error (${ticker}):`, err.message);
    res.status(404).json({ error: err.message || "Stock not found", ticker });
  }
});

app.get("/api/quote/:ticker", async (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);
  if (!isValidTicker(ticker)) {
    return res.status(400).json({ error: "Invalid ticker symbol" });
  }
  if (!requireApiKey(res)) return;

  try {
    res.json(await getQuote(ticker));
  } catch (err) {
    console.error(`Quote fetch error (${ticker}):`, err.message);
    res.status(404).json({ error: err.message || "Failed to fetch quote", ticker });
  }
});

app.get("/api/quotes", async (req, res) => {
  if (!requireApiKey(res)) return;

  const tickers = [...new Set(
    String(req.query.tickers || "")
      .split(",")
      .map((t) => normalizeTicker(t))
      .filter(isValidTicker)
  )].slice(0, 30);

  if (tickers.length === 0) {
    return res.status(400).json({ error: "Provide tickers query param, e.g. ?tickers=NVDA,AAPL" });
  }

  const entries = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        return [ticker, await getQuote(ticker)];
      } catch (err) {
        return [ticker, { ticker, error: err.message || "Failed to fetch quote" }];
      }
    })
  );

  res.json(Object.fromEntries(entries));
});

app.listen(PORT, () => {
  const stats = getDbStats();
  console.log(`AlphaLens API running at http://localhost:${PORT}`);
  console.log(`Database: ${stats.path} (${stats.historyRows} score snapshots)`);
  console.log(`Try: http://localhost:${PORT}/api/stock/NVDA`);
  if (!FINNHUB_API_KEY) {
    console.warn("Warning: FINNHUB_API_KEY is missing in server/.env");
  }
});
