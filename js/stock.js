import { renderScoreBadge } from "./data.js";
import { fetchStock } from "./api.js";
import { initSearch } from "./app.js";
import { renderPredictionPanel } from "./recommendations.js";

let scoreChart = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatUsd(value) {
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(change, changePercent) {
  const sign = change >= 0 ? "+" : "";
  const cls = change >= 0 ? "change-up" : "change-down";
  return `<span class="${cls}">${sign}${change?.toFixed(2) ?? "0.00"} (${sign}${changePercent?.toFixed(2) ?? "0.00"}%)</span>`;
}

function renderBreakdown(container, scores) {
  container.replaceChildren();
  const items = [
    { label: "Fundamental", value: scores.fundamental },
    { label: "Technical", value: scores.technical },
    { label: "Sentiment", value: scores.sentiment },
    { label: "Low Risk", value: scores.lowRisk },
  ];
  items.forEach((s) => {
    const card = el("div", "card breakdown-item");
    card.append(el("div", "label", s.label), el("div", "value", `${s.value}/10`));
    container.append(card);
  });
}

function renderSignals(container, signals) {
  container.replaceChildren();
  if (!signals?.length) {
    const li = document.createElement("li");
    li.innerHTML = '<span style="color:var(--text-muted)">No alpha signals available.</span>';
    container.append(li);
    return;
  }
  signals.forEach((s) => {
    const li = document.createElement("li");
    const row = el("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px";
    const bar = el("div", "signal-bar");
    const fill = el("div", "signal-bar-fill");
    fill.style.width = `${s.value * 10}%`;
    bar.append(fill);
    row.append(bar, el("strong", null, String(s.value)));
    li.append(el("span", null, s.name), row);
    container.append(li);
  });
}

function showApiBanner(message) {
  let banner = document.getElementById("api-status-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "api-status-banner";
    banner.className = "api-status-banner";
    document.body.prepend(banner);
  }
  banner.innerHTML = message;
}

function showLoadingState(ticker) {
  document.title = `${ticker} | AlphaLens AI`;
  document.getElementById("stock-ticker").textContent = ticker;
  document.getElementById("stock-name").textContent = "Loading company data…";
  document.getElementById("stock-sector").textContent = "";
  document.getElementById("live-price").textContent = "Loading…";
  document.getElementById("live-change").innerHTML = "";
  document.getElementById("main-score").innerHTML = '<span class="change-neutral">…</span>';
}

function showNotFound(ticker, message) {
  const content = document.getElementById("stock-content");
  content.replaceChildren();
  const card = el("div", "card");
  card.style.margin = "48px auto";
  card.style.maxWidth = "480px";
  card.style.textAlign = "center";
  card.innerHTML = `
    <h2>Ticker not found: ${ticker}</h2>
    <p style="color:var(--text-muted);margin:12px 0 20px">${message || "Could not load this symbol."}</p>
    <a href="index.html" class="btn btn-primary">Back to home</a>`;
  content.append(card);
}

async function initStockPage() {
  const params = new URLSearchParams(window.location.search);
  const ticker = (params.get("ticker") || "AAPL").toUpperCase();

  showLoadingState(ticker);

  try {
    const stock = await fetchStock(ticker);
    const quote = stock.quote;
    const scores = stock.scores;

    document.title = `${stock.ticker} AI Analysis | AlphaLens AI`;
    document.getElementById("stock-ticker").textContent = stock.ticker;
    document.getElementById("stock-name").textContent = stock.name;

    const meta = [stock.country, stock.sector, stock.exchange].filter((x) => x && x !== "—");
    document.getElementById("stock-sector").textContent = meta.join(" · ");

    document.getElementById("live-price").textContent = formatUsd(quote.price);
    document.getElementById("live-change").innerHTML = formatChange(quote.change, quote.changePercent);
    document.getElementById("live-quote")?.classList.remove("loading", "error");
    const badge = document.getElementById("live-quote")?.querySelector(".live-badge");
    if (badge) badge.textContent = "Live";

    const scoreEl = document.getElementById("main-score");
    scoreEl.innerHTML = renderScoreBadge(scores.aiScore);
    const scoreBadge = scoreEl.querySelector(".ai-score");
    scoreBadge.style.width = "64px";
    scoreBadge.style.height = "64px";
    scoreBadge.style.fontSize = "1.6rem";

    const scoreNote = document.getElementById("score-note");
    if (scoreNote) {
      scoreNote.textContent = "Computed from live market data";
    }

    renderBreakdown(document.getElementById("score-breakdown"), scores);
    renderSignals(document.getElementById("signals-list"), scores.signals);
    renderScoreChart(stock.scoreHistory || { labels: [], data: [] }, scores.aiScore);

    if (stock.prediction) {
      renderPredictionPanel(stock.prediction, document.getElementById("prediction-panel"));
    }
  } catch (err) {
    console.error("Stock load error:", err);
    if (err?.code === "OFFLINE") {
      showApiBanner("<strong>API offline.</strong> Start it: <code>cd server && npm start</code>");
    }
    showNotFound(ticker, err.message);
  }
}

function renderScoreChart(history, currentScore) {
  const canvas = document.getElementById("score-chart");
  if (!canvas || !window.Chart) return;

  if (scoreChart) scoreChart.destroy();

  let labels = history?.labels?.length ? [...history.labels] : [];
  let data = history?.data?.length ? [...history.data] : [];

  if (labels.length === 0) {
    labels = ["Today"];
    data = [currentScore];
  }

  const isLine = labels.length > 1;

  scoreChart = new Chart(canvas, {
    type: isLine ? "line" : "bar",
    data: {
      labels,
      datasets: [
        {
          label: "AI Score",
          data,
          borderColor: "#60a5fa",
          backgroundColor: isLine ? "rgba(96, 165, 250, 0.12)" : "rgba(96, 165, 250, 0.5)",
          fill: isLine,
          tension: 0.35,
          pointRadius: isLine ? 4 : 0,
          pointBackgroundColor: "#3b82f6",
          borderWidth: isLine ? 2 : 0,
          borderRadius: isLine ? 0 : 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        subtitle: {
          display: labels.length <= 1,
          text: "History builds daily — check back tomorrow",
          color: "#8b9bb4",
          font: { size: 12 },
        },
      },
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 2, color: "#8b9bb4" }, grid: { color: "#2a3548" } },
        x: { ticks: { color: "#8b9bb4", maxRotation: 45 }, grid: { color: isLine ? "#2a3548" : "transparent" } },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSearch("header-search", "header-search-results");
  initStockPage();
});
