import { fetchRecommendations, fetchPrediction } from "./api.js";
import { renderScoreBadge } from "./data.js";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function signalClass(signal) {
  if (signal.includes("Strong Buy") || signal === "Buy") return "signal-buy";
  if (signal.includes("Strong Sell") || signal === "Sell") return "signal-sell";
  return "signal-hold";
}

function formatUsd(n) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(n, signed = true) {
  if (n == null) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function renderPickRow(item, rank) {
  const p = item.prediction;
  return `
    <tr data-href="stock.html?ticker=${item.ticker}" style="cursor:pointer">
      <td class="rank-num">${rank}</td>
      <td>
        <div class="company-cell">
          <a href="stock.html?ticker=${item.ticker}" class="company-ticker">${item.ticker}</a>
          <span class="company-name">${item.name}</span>
        </div>
      </td>
      <td><span class="pred-signal ${signalClass(p.signal)}">${p.signal}</span></td>
      <td class="${p.predictedReturn >= 0 ? "change-up" : "change-down"}">${formatPct(p.predictedReturn)}</td>
      <td>${p.winProbability}%</td>
      <td>${p.confidence}%</td>
      <td>${renderScoreBadge(p.aiScore)}</td>
      <td>${formatUsd(p.currentPrice)}</td>
      <td>${formatUsd(p.priceTarget)}</td>
    </tr>`;
}

function renderPredictCard(data) {
  const p = data.prediction;
  const factors = p.factors
    .map(
      (f) =>
        `<li class="factor-${f.impact}"><span>${f.label}</span></li>`
    )
    .join("");

  return `
    <div class="predict-card card">
      <div class="predict-header">
        <div>
          <h2>${data.ticker} <span class="predict-name">${data.name}</span></h2>
          <p class="predict-summary">${p.summary}</p>
        </div>
        <span class="pred-signal pred-signal-lg ${signalClass(p.signal)}">${p.signal}</span>
      </div>
      <div class="predict-metrics">
        <div class="predict-metric">
          <span class="predict-metric-label">3M expected return</span>
          <span class="predict-metric-value ${p.predictedReturn >= 0 ? "change-up" : "change-down"}">${formatPct(p.predictedReturn)}</span>
        </div>
        <div class="predict-metric">
          <span class="predict-metric-label">Win probability</span>
          <span class="predict-metric-value">${p.winProbability}%</span>
        </div>
        <div class="predict-metric">
          <span class="predict-metric-label">Confidence</span>
          <span class="predict-metric-value">${p.confidence}%</span>
        </div>
        <div class="predict-metric">
          <span class="predict-metric-label">AI Score</span>
          <span class="predict-metric-value">${renderScoreBadge(p.aiScore)}</span>
        </div>
        <div class="predict-metric">
          <span class="predict-metric-label">Current price</span>
          <span class="predict-metric-value">${formatUsd(p.currentPrice)}</span>
        </div>
        <div class="predict-metric">
          <span class="predict-metric-label">Price target (${p.horizon})</span>
          <span class="predict-metric-value">${formatUsd(p.priceTarget)}</span>
        </div>
      </div>
      <div class="predict-factors">
        <h3>Key drivers</h3>
        <ul>${factors}</ul>
      </div>
      <p class="predict-disclaimer">${p.disclaimer}</p>
      <a href="stock.html?ticker=${data.ticker}" class="btn btn-primary">Full analysis →</a>
    </div>`;
}

export async function initRecommendationsPage() {
  const buysBody = document.getElementById("rec-buys-body");
  const sellsBody = document.getElementById("rec-sells-body");
  const predictBox = document.getElementById("predict-result");
  const predictForm = document.getElementById("predict-form");
  const predictInput = document.getElementById("predict-ticker");
  const statusEl = document.getElementById("rec-status");

  if (!buysBody) return;

  statusEl.textContent = "Scanning universe with live data…";

  try {
    const data = await fetchRecommendations({ type: "stocks", limit: 8 });
    statusEl.textContent = `Updated ${new Date(data.generatedAt).toLocaleTimeString()} · ${data.scanned} symbols analyzed`;

    buysBody.innerHTML =
      data.buys.length === 0
        ? `<tr><td colspan="9">No bullish picks in current scan.</td></tr>`
        : data.buys.map((item, i) => renderPickRow(item, i + 1)).join("");

    sellsBody.innerHTML =
      data.sells.length === 0
        ? `<tr><td colspan="9">No bearish picks in current scan.</td></tr>`
        : data.sells.map((item, i) => renderPickRow(item, i + 1)).join("");

    buysBody.querySelectorAll("tr[data-href]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        window.location.href = row.dataset.href;
      });
    });
    sellsBody.querySelectorAll("tr[data-href]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        window.location.href = row.dataset.href;
      });
    });
  } catch (err) {
    const hint =
      err?.code === "NOT_FOUND"
        ? " Redeploy Railway from GitHub (main branch), then wait 2 min."
        : "";
    statusEl.textContent = (err.message || "Failed to load recommendations") + hint;
    buysBody.innerHTML = `<tr><td colspan="9" class="api-error-msg">${escapeHtml(statusEl.textContent)}</td></tr>`;
  }

  if (predictForm && predictInput && predictBox) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ticker")) predictInput.value = params.get("ticker");

    predictForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ticker = predictInput.value.trim().toUpperCase();
      if (!ticker) return;

      predictBox.innerHTML = `<div class="predict-card card"><p class="chat-typing">Generating prediction for ${ticker}…</p></div>`;

      try {
        const data = await fetchPrediction(ticker);
        predictBox.innerHTML = renderPredictCard(data);
      } catch (err) {
        predictBox.innerHTML = `<div class="predict-card card api-error-msg">${err.message || "Prediction failed"}</div>`;
      }
    });

    if (predictInput.value.trim()) predictForm.requestSubmit();
  }
}

export function renderPredictionPanel(prediction, container) {
  if (!container || !prediction) return;
  container.innerHTML = `
    <div class="card predict-inline">
      <div class="predict-inline-header">
        <h3>AI Prediction · ${prediction.horizon}</h3>
        <span class="pred-signal ${signalClass(prediction.signal)}">${prediction.signal}</span>
      </div>
      <p class="predict-summary">${prediction.summary}</p>
      <div class="predict-metrics predict-metrics-compact">
        <div><span>Expected return</span><strong class="${prediction.predictedReturn >= 0 ? "change-up" : "change-down"}">${formatPct(prediction.predictedReturn)}</strong></div>
        <div><span>Win prob.</span><strong>${prediction.winProbability}%</strong></div>
        <div><span>Confidence</span><strong>${prediction.confidence}%</strong></div>
        <div><span>Price target</span><strong>${formatUsd(prediction.priceTarget)}</strong></div>
      </div>
      <ul class="predict-factors-compact">
        ${prediction.factors.slice(0, 4).map((f) => `<li class="factor-${f.impact}">${f.label}</li>`).join("")}
      </ul>
    </div>`;
}
