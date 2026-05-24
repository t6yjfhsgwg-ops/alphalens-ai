import {
  STOCKS,
  ETFS,
  TRADE_IDEAS,
  getAllAssets,
  findAsset,
  renderScoreBadge,
  renderSubScore,
  formatChange,
  formatPerf,
} from "./data.js";
import { fetchLiveQuotes, fetchScores, formatDayChange, formatLivePrice, formatApiError, searchSymbols } from "./api.js";

const RANKING_HEADERS =
  "<th>Rank</th><th>Company</th><th>Country</th><th>Price</th><th>AI Score</th><th>Change</th>" +
  "<th>Day Chg</th><th>Fundamental</th><th>Technical</th><th>Sentiment</th><th>Low Risk</th><th>Perf YTD</th>";

const TRADE_HEADERS =
  "<th>Rank</th><th>Company</th><th>Price</th><th>Signal</th><th>Win Rate</th><th>Horizon</th><th>AI Score</th>";

export function initSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;

  const assets = getAllAssets();
  let debounceTimer = null;
  let searchSeq = 0;

  function renderLocalResults(q) {
    const matches = assets
      .filter((a) => a.ticker.includes(q) || a.name.toUpperCase().includes(q))
      .slice(0, 8);

    results.innerHTML =
      matches.length === 0
        ? `<div class="search-result-item"><span>No results</span></div>`
        : matches
            .map(
              (a) => `
        <div class="search-result-item" data-ticker="${a.ticker}">
          <span><strong>${a.ticker}</strong> — ${a.name}</span>
          ${renderScoreBadge(a.aiScore)}
        </div>`
            )
            .join("");
    results.classList.add("open");
  }

  async function showResults(query) {
    const q = query.trim();
    if (!q) {
      results.classList.remove("open");
      return;
    }

    results.innerHTML = `<div class="search-result-item"><span>Searching…</span></div>`;
    results.classList.add("open");

    const seq = ++searchSeq;

    try {
      const { results: apiResults } = await searchSymbols(q);
      if (seq !== searchSeq) return;

      if (apiResults.length === 0) {
        renderLocalResults(q.toUpperCase());
        return;
      }

      results.innerHTML = apiResults
        .map((r) => {
          const mock = findAsset(r.ticker);
          const badge = mock ? renderScoreBadge(mock.aiScore) : `<span class="search-type">${r.type}</span>`;
          return `
        <div class="search-result-item" data-ticker="${r.ticker}">
          <span><strong>${r.displaySymbol || r.ticker}</strong> — ${r.name}</span>
          ${badge}
        </div>`;
        })
        .join("");
    } catch {
      if (seq !== searchSeq) return;
      renderLocalResults(q.toUpperCase());
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => showResults(input.value), 300);
  });
  input.addEventListener("focus", () => {
    if (input.value.trim()) showResults(input.value);
  });

  results.addEventListener("click", (e) => {
    const item = e.target.closest("[data-ticker]");
    if (item) window.location.href = `stock.html?ticker=${item.dataset.ticker}`;
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove("open");
    }
  });
}

export function renderRankingRow(item, rank) {
  return `
    <tr data-href="stock.html?ticker=${item.ticker}" data-ticker="${item.ticker}" style="cursor:pointer">
      <td class="rank-num">${rank}</td>
      <td>
        <div class="company-cell">
          <a href="stock.html?ticker=${item.ticker}" class="company-ticker">${item.ticker}</a>
          <span class="company-name">${item.name}</span>
        </div>
      </td>
      <td>${item.country}</td>
      <td class="live-price-cell" data-live="price">…</td>
      <td class="live-score-cell" data-live="aiscore">…</td>
      <td data-live="scorechange">—</td>
      <td class="live-price-cell" data-live="daychg">…</td>
      <td class="live-score-cell" data-live="fundamental">…</td>
      <td class="live-score-cell" data-live="technical">…</td>
      <td class="live-score-cell" data-live="sentiment">…</td>
      <td class="live-score-cell" data-live="lowrisk">…</td>
      <td data-live="perfytd">…</td>
    </tr>`;
}

export function renderTradeRow(item, rank) {
  const signalClass = item.signal.includes("Buy") ? "change-up" : "change-down";
  return `
    <tr data-href="stock.html?ticker=${item.ticker}" data-ticker="${item.ticker}" style="cursor:pointer">
      <td class="rank-num">${rank}</td>
      <td>
        <div class="company-cell">
          <a href="stock.html?ticker=${item.ticker}" class="company-ticker">${item.ticker}</a>
          <span class="company-name">${item.name}</span>
        </div>
      </td>
      <td class="live-price-cell" data-live="price">…</td>
      <td><span class="${signalClass}" style="font-weight:600">${item.signal}</span></td>
      <td>${item.winRate}%</td>
      <td>${item.horizon}</td>
      <td class="live-score-cell" data-live="aiscore">…</td>
    </tr>`;
}

function bindRowClicks(tbody) {
  tbody.querySelectorAll("tr[data-href]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.location.href = row.dataset.href;
    });
  });
}

async function attachLiveData(tbody, items) {
  if (!tbody || !items?.length) return;

  const tickers = items.map((i) => i.ticker);

  try {
    const [quotes, scoresMap] = await Promise.all([
      fetchLiveQuotes(tickers),
      fetchScores(tickers),
    ]);

    tbody.querySelectorAll("tr[data-ticker]").forEach((row) => {
      const ticker = row.dataset.ticker;
      const quote = quotes[ticker];
      const scores = scoresMap[ticker];

      const priceCell = row.querySelector('[data-live="price"]');
      const dayCell = row.querySelector('[data-live="daychg"]');

      if (quote && !quote.error) {
        if (priceCell) priceCell.innerHTML = formatLivePrice(quote.price);
        if (dayCell) dayCell.innerHTML = formatDayChange(quote.change, quote.changePercent);
      } else {
        if (priceCell) priceCell.innerHTML = `<span class="change-neutral">—</span>`;
        if (dayCell) dayCell.innerHTML = `<span class="change-neutral">—</span>`;
      }

      if (scores && !scores.error) {
        const aiCell = row.querySelector('[data-live="aiscore"]');
        if (aiCell) aiCell.innerHTML = renderScoreBadge(scores.aiScore);
        const setSub = (key, val) => {
          const cell = row.querySelector(`[data-live="${key}"]`);
          if (cell) cell.innerHTML = renderSubScore(val);
        };
        setSub("fundamental", scores.fundamental);
        setSub("technical", scores.technical);
        setSub("sentiment", scores.sentiment);
        setSub("lowrisk", scores.lowRisk);

        const perfCell = row.querySelector('[data-live="perfytd"]');
        if (perfCell && scores.perfYtd != null) {
          perfCell.innerHTML = formatPerf(scores.perfYtd);
        } else if (perfCell) {
          perfCell.innerHTML = `<span class="change-neutral">—</span>`;
        }
      }
    });
  } catch (err) {
    console.warn("Live data unavailable:", err.message);
    const msg = formatApiError(err);
    tbody.querySelectorAll(".live-price-cell, .live-score-cell").forEach((cell) => {
      cell.innerHTML = msg;
    });
    showApiBanner(err);
  }
}

function showApiBanner(err) {
  let banner = document.getElementById("api-status-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "api-status-banner";
    banner.className = "api-status-banner";
    document.body.prepend(banner);
  }
  if (err?.code === "OFFLINE") {
    banner.innerHTML =
      "<strong>Live prices unavailable.</strong> Start the API: " +
      "<code>cd server && npm start</code> (needs port 3000)";
  } else if (String(err?.message || "").includes("FINNHUB_API_KEY")) {
    banner.innerHTML =
      "<strong>API key missing.</strong> Add your Finnhub key to " +
      "<code>server/.env</code> then restart the API.";
  } else {
    banner.innerHTML = `<strong>Live prices unavailable.</strong> ${err?.message || "Unknown error"}`;
  }
}

function renderTable(tbody, tab, limit) {
  let items = [];
  let html = "";

  if (tab === "stocks") {
    items = limit ? STOCKS.slice(0, limit) : STOCKS;
    html = items.map((s, i) => renderRankingRow(s, i + 1)).join("");
  } else if (tab === "etfs") {
    items = ETFS;
    html = items.map((e, i) => renderRankingRow(e, i + 1)).join("");
  } else if (tab === "ideas") {
    items = TRADE_IDEAS;
    html = items.map((t, i) => renderTradeRow(t, i + 1)).join("");
  }

  tbody.innerHTML = html;
  bindRowClicks(tbody);
  attachLiveData(tbody, items);
}

export function initRankingTable(tableBodyId, tab = "stocks") {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;
  renderTable(tbody, tab, 10);
}

export function initTabs(containerId, tableBodyId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      container.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      initRankingTable(tableBodyId, tab.dataset.tab);
      updateTableHeaders(tab.dataset.tab);
    });
  });
}

function updateTableHeaders(tab) {
  const thead = document.querySelector("#rankings-table thead tr");
  if (!thead) return;
  thead.innerHTML = tab === "ideas" ? TRADE_HEADERS : RANKING_HEADERS;
}

export function initPopularTags() {
  document.querySelectorAll(".tag[data-ticker]").forEach((tag) => {
    tag.addEventListener("click", () => {
      window.location.href = `stock.html?ticker=${tag.dataset.ticker}`;
    });
  });
}

export function initRegionToggle() {
  document.querySelectorAll(".region-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".region-toggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

export function initFullRankings(tableBodyId) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;

  function load(tab) {
    renderTable(tbody, tab);
    updateTableHeaders(tab);
  }

  const container = document.getElementById("full-ranking-tabs");
  if (container) {
    container.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        container.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        load(tab.dataset.tab);
      });
    });
  }

  load("stocks");
}

export { findAsset, getAllAssets };
