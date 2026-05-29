const STOP_TICKERS = new Set([
  "A", "I", "AI", "USA", "ETF", "API", "THE", "AND", "FOR", "WHAT", "HOW", "IS",
  "ARE", "VS", "OR", "TO", "OF", "IN", "ON", "IT", "MY", "ME", "US", "EU", "UK",
  "CEO", "CFO", "IPO", "YTD", "PE", "EPS", "RSI", "MACD", "NYSE", "SEC",
]);

const HELP_PATTERNS = [
  /what is (the )?ai score/i,
  /how (does|do) (the )?ai score/i,
  /what can you do/i,
  /^help$/i,
  /how does this work/i,
];

export function extractTickers(text) {
  const matches = [...text.toUpperCase().matchAll(/\b([A-Z]{1,5})\b/g)].map((m) => m[1]);
  return [...new Set(matches.filter((t) => /^[A-Z.]{1,10}$/.test(t) && !STOP_TICKERS.has(t)))].slice(0, 2);
}

function scoreLabel(score) {
  if (score >= 8) return "strong";
  if (score >= 6) return "moderate";
  if (score >= 4) return "weak";
  return "low";
}

function formatUsd(value) {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(change, changePercent) {
  if (change == null || changePercent == null) return "unchanged today";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}% today (${sign}${change.toFixed(2)})`;
}

function formatStockBlock({ ticker, name, sector, quote, scores }) {
  const signals = (scores.signals || []).slice(0, 3).map((s) => `• ${s}`).join("\n");
  return (
    `**${ticker}** — ${name}${sector && sector !== "—" ? ` (${sector})` : ""}\n` +
    `Price: **${formatUsd(quote.price)}** (${formatChange(quote.change, quote.changePercent)})\n` +
    `AI Score: **${scores.aiScore}/10** (${scoreLabel(scores.aiScore)})\n` +
    `Breakdown: Fundamental ${scores.fundamental}/10 · Technical ${scores.technical}/10 · ` +
    `Sentiment ${scores.sentiment}/10 · Low Risk ${scores.lowRisk}/10\n` +
    (signals ? `Key signals:\n${signals}\n` : "") +
    `[View full analysis](stock.html?ticker=${ticker})`
  );
}

function helpReply() {
  return (
    "I'm your **AlphaLens AI assistant**. I analyze stocks using live market data and our AI scoring model.\n\n" +
    "**AI Score (1–10)** estimates the probability a stock will beat the market over the next ~3 months. " +
    "Higher is better. Sub-scores cover fundamentals, technicals, sentiment, and risk.\n\n" +
    "**Try asking:**\n" +
    "• \"Analyze NVDA\"\n" +
    "• \"How is Apple doing?\"\n" +
    "• \"Compare AAPL and MSFT\"\n\n" +
    "_Not financial advice — for education and research only._"
  );
}

export async function generateChatReply(message, deps) {
  const trimmed = String(message || "").trim().slice(0, 500);
  if (!trimmed) {
    return { reply: "Type a question about any US stock — e.g. \"What's Tesla's AI score?\"" };
  }

  if (HELP_PATTERNS.some((p) => p.test(trimmed))) {
    return { reply: helpReply() };
  }

  let tickers = extractTickers(trimmed);

  if (tickers.length === 0) {
    const words = trimmed
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !/^(what|how|the|and|for|about|tell|show|give)$/i.test(w));
    for (const word of words.slice(0, 2)) {
      const results = await deps.searchSymbols(word);
      if (results[0]?.ticker) tickers.push(results[0].ticker);
    }
    tickers = [...new Set(tickers)].slice(0, 2);
  }

  if (tickers.length === 0) {
    return {
      reply:
        "I couldn't find a stock in your message. Try a ticker (**NVDA**, **AAPL**) or company name (**Apple**, **Tesla**).",
    };
  }

  const blocks = [];
  for (const ticker of tickers) {
    try {
      blocks.push(formatStockBlock(await deps.fetchStockBundle(ticker)));
    } catch (err) {
      blocks.push(`**${ticker}** — ${err.message || "Could not load data."}`);
    }
  }

  const intro =
    tickers.length > 1
      ? "Here's a comparison based on live data:\n\n"
      : "Here's what I found from live data:\n\n";

  return { reply: intro + blocks.join("\n\n"), tickers };
}
