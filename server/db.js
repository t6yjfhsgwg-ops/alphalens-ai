import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, "data", "alphalens.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS stocks (
    ticker TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    sector TEXT,
    exchange TEXT,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quote_cache (
    ticker TEXT PRIMARY KEY,
    price REAL,
    change REAL,
    change_percent REAL,
    high REAL,
    low REAL,
    open REAL,
    previous_close REAL,
    ts INTEGER,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS score_cache (
    ticker TEXT PRIMARY KEY,
    ai_score INTEGER,
    fundamental INTEGER,
    technical INTEGER,
    sentiment INTEGER,
    low_risk INTEGER,
    perf_ytd REAL,
    signals_json TEXT,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS score_history (
    ticker TEXT NOT NULL,
    score_date TEXT NOT NULL,
    ai_score INTEGER,
    fundamental INTEGER,
    technical INTEGER,
    sentiment INTEGER,
    low_risk INTEGER,
    PRIMARY KEY (ticker, score_date)
  );
`);

const QUOTE_TTL_MS = 2 * 60 * 1000;
const SCORE_TTL_MS = 5 * 60 * 1000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function saveStockProfile(profile) {
  db.prepare(`
    INSERT INTO stocks (ticker, name, country, sector, exchange, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      name = excluded.name,
      country = excluded.country,
      sector = excluded.sector,
      exchange = excluded.exchange,
      updated_at = excluded.updated_at
  `).run(
    profile.ticker,
    profile.name,
    profile.country,
    profile.sector,
    profile.exchange,
    Date.now()
  );
}

export function getCachedQuote(ticker) {
  const row = db.prepare(`SELECT * FROM quote_cache WHERE ticker = ?`).get(ticker);
  if (!row || Date.now() - row.cached_at > QUOTE_TTL_MS) return null;

  return {
    ticker,
    price: row.price,
    change: row.change,
    changePercent: row.change_percent,
    high: row.high,
    low: row.low,
    open: row.open,
    previousClose: row.previous_close,
    timestamp: row.ts,
    cached: true,
  };
}

export function saveQuote(quote) {
  db.prepare(`
    INSERT INTO quote_cache (ticker, price, change, change_percent, high, low, open, previous_close, ts, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      price = excluded.price,
      change = excluded.change,
      change_percent = excluded.change_percent,
      high = excluded.high,
      low = excluded.low,
      open = excluded.open,
      previous_close = excluded.previous_close,
      ts = excluded.ts,
      cached_at = excluded.cached_at
  `).run(
    quote.ticker,
    quote.price,
    quote.change,
    quote.changePercent,
    quote.high,
    quote.low,
    quote.open,
    quote.previousClose,
    quote.timestamp,
    Date.now()
  );
}

export function getCachedScores(ticker) {
  const row = db.prepare(`SELECT * FROM score_cache WHERE ticker = ?`).get(ticker);
  if (!row || Date.now() - row.cached_at > SCORE_TTL_MS) return null;

  return {
    aiScore: row.ai_score,
    change: 0,
    fundamental: row.fundamental,
    technical: row.technical,
    sentiment: row.sentiment,
    lowRisk: row.low_risk,
    perfYtd: row.perf_ytd,
    signals: JSON.parse(row.signals_json || "[]"),
    cached: true,
  };
}

export function saveScores(ticker, scores) {
  db.prepare(`
    INSERT INTO score_cache (ticker, ai_score, fundamental, technical, sentiment, low_risk, perf_ytd, signals_json, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      ai_score = excluded.ai_score,
      fundamental = excluded.fundamental,
      technical = excluded.technical,
      sentiment = excluded.sentiment,
      low_risk = excluded.low_risk,
      perf_ytd = excluded.perf_ytd,
      signals_json = excluded.signals_json,
      cached_at = excluded.cached_at
  `).run(
    ticker,
    scores.aiScore,
    scores.fundamental,
    scores.technical,
    scores.sentiment,
    scores.lowRisk,
    scores.perfYtd,
    JSON.stringify(scores.signals || []),
    Date.now()
  );

  const date = todayISO();
  db.prepare(`
    INSERT INTO score_history (ticker, score_date, ai_score, fundamental, technical, sentiment, low_risk)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker, score_date) DO UPDATE SET
      ai_score = excluded.ai_score,
      fundamental = excluded.fundamental,
      technical = excluded.technical,
      sentiment = excluded.sentiment,
      low_risk = excluded.low_risk
  `).run(
    ticker,
    date,
    scores.aiScore,
    scores.fundamental,
    scores.technical,
    scores.sentiment,
    scores.lowRisk
  );
}

export function getScoreHistory(ticker, limit = 90) {
  const rows = db
    .prepare(
      `SELECT score_date, ai_score FROM score_history
       WHERE ticker = ? ORDER BY score_date DESC LIMIT ?`
    )
    .all(ticker, limit)
    .reverse();

  return {
    labels: rows.map((r) => {
      const d = new Date(r.score_date + "T12:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }),
    data: rows.map((r) => r.ai_score),
  };
}

export function getDbStats() {
  const stocks = db.prepare(`SELECT COUNT(*) AS n FROM stocks`).get().n;
  const history = db.prepare(`SELECT COUNT(*) AS n FROM score_history`).get().n;
  return { path: DB_PATH, stocks, historyRows: history };
}
