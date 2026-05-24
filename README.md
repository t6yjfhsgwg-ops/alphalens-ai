# AlphaLens AI

AI stock analytics demo (Danelfin-style) with live Finnhub data, computed scores, and SQLite caching.

## Local development

**Terminal 1 — API:**
```powershell
cd server
# Add FINNHUB_API_KEY to server/.env
npm install
npm start
```

**Terminal 2 — frontend:**
```powershell
python -m http.server 8080
```

Open http://localhost:8080

## Deploy online

See **[DEPLOY.md](DEPLOY.md)** for Step 7 — Vercel (frontend) + Railway (API).

## Project structure

```
alphalens-ai/
├── index.html          # Landing page
├── rankings.html       # Rankings table
├── stock.html          # Stock detail + chart
├── pricing.html
├── js/
│   ├── config.js       # API URL (local vs production)
│   ├── api.js          # API client
│   ├── app.js          # Rankings, search
│   └── stock.js        # Stock page
├── css/styles.css
└── server/
    ├── server.js       # Express API
    ├── db.js           # SQLite cache + history
    ├── scoring.js      # Rule-based AI scores
    └── data/           # Local SQLite file (gitignored)
```

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health + DB stats |
| `GET /api/stock/:ticker` | Profile, quote, scores, history |
| `GET /api/stock/:ticker/history` | Score history |
| `GET /api/scores?tickers=` | Batch scores |
| `GET /api/quotes?tickers=` | Batch quotes |
| `GET /api/search?q=` | Symbol search |

Demo only — not financial advice.
