import { API_BASE, isApiConfigured } from "./config.js";

export { API_BASE };

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function apiPost(path, body) {
  if (!isApiConfigured()) {
    throw new ApiError(
      "Production API URL not configured. Set PRODUCTION_API_URL in js/config.js.",
      "NOT_CONFIGURED"
    );
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach API. Start locally with: cd server && npm start", "OFFLINE");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed (${res.status})`, "API_ERROR");
  }
  return res.json();
}

export async function sendChatMessage(message) {
  return apiPost("/api/chat", { message });
}

export async function fetchPrediction(ticker, horizon = "3M") {
  return apiFetch(
    `/api/predict/${encodeURIComponent(ticker)}?horizon=${encodeURIComponent(horizon)}`
  );
}

export async function fetchRecommendations({ type = "stocks", limit = 8, sort = "return" } = {}) {
  const params = new URLSearchParams({ type, limit: String(limit), sort });
  return apiFetch(`/api/recommendations?${params}`);
}

async function apiFetch(path) {
  if (!isApiConfigured()) {
    throw new ApiError(
      "Production API URL not configured. Set PRODUCTION_API_URL in js/config.js or add <meta name=\"api-base\" content=\"https://your-api.up.railway.app\">",
      "NOT_CONFIGURED"
    );
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`);
  } catch {
    throw new ApiError(
      "Cannot reach API. Start locally with: cd server && npm start",
      "OFFLINE"
    );
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed (${res.status})`, "API_ERROR");
  }
  return res.json();
}

export async function fetchStock(ticker) {
  return apiFetch(`/api/stock/${encodeURIComponent(ticker)}`);
}

export async function searchSymbols(query) {
  return apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
}

export async function fetchLiveQuote(ticker) {
  return apiFetch(`/api/quote/${encodeURIComponent(ticker)}`);
}

export async function fetchLiveQuotes(tickers) {
  if (!tickers.length) return {};
  const list = [...new Set(tickers.map((t) => t.toUpperCase()))].join(",");
  return apiFetch(`/api/quotes?tickers=${encodeURIComponent(list)}`);
}

export async function fetchScores(tickers) {
  if (!tickers.length) return {};
  const list = [...new Set(tickers.map((t) => t.toUpperCase()))].join(",");
  return apiFetch(`/api/scores?tickers=${encodeURIComponent(list)}`);
}

function formatUsd(value) {
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDayChange(change, changePercent) {
  if (change == null || changePercent == null) {
    return `<span class="change-neutral">—</span>`;
  }
  const sign = change >= 0 ? "+" : "";
  const cls = change >= 0 ? "change-up" : "change-down";
  return `<span class="${cls}">${sign}${changePercent.toFixed(2)}%</span>`;
}

export function formatLivePrice(price) {
  if (price == null) return `<span class="change-neutral">—</span>`;
  return `<span class="live-price-cell-value">${formatUsd(price)}</span>`;
}

export async function fetchScoreHistory(ticker) {
  return apiFetch(`/api/stock/${encodeURIComponent(ticker)}/history`);
}

export function formatApiError(err) {
  if (err?.code === "NOT_CONFIGURED") {
    return `<span class="api-error-msg">API URL not set</span>`;
  }
  if (err?.code === "OFFLINE") {
    return `<span class="api-error-msg" title="${err.message}">API offline</span>`;
  }
  if (String(err?.message || "").includes("FINNHUB_API_KEY")) {
    return `<span class="api-error-msg">Key missing in server/.env</span>`;
  }
  return `<span class="change-neutral">—</span>`;
}
