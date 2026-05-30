# AlphaLens — Fix checklist

## What was fixed (in code)

1. **Vercel API proxy** — `/api/*` on your site forwards to Railway (no CORS, no wrong URL).
2. **Smarter `config.js`** — On `*.vercel.app`, API calls use your own domain.
3. **Faster recommendations** — Parallel batches instead of one-by-one.
4. **API status badge** — Header shows "API live" or "API offline".

## You must redeploy (both)

### Railway (API)
1. [railway.app/dashboard](https://railway.app/dashboard) → alphalens-ai service
2. **Deploy** latest from GitHub `main`
3. Variables: `FINNHUB_API_KEY` must be set
4. Test: `https://alphalens-ai-production.up.railway.app/api/health` → `"ok": true`

### Vercel (website)
1. [vercel.com/dashboard](https://vercel.com/dashboard) → **your** alphalens-ai project
2. **Redeploy** latest `main`
3. Root directory: **empty** (repo root, not `server`)
4. Open **your** URL from Vercel (not `alphalens-ai.vercel.app` — that domain belongs to another company)

## After redeploy

1. Hard refresh: **Ctrl+Shift+R**
2. Header should show green **API live**
3. Rankings show prices (not "API URL not set")
4. **Predictions** page loads picks
5. **α** chat works

## Wrong Vercel URL?

Use the URL shown in: Vercel → Project → **Domains**  
Example shape: `https://alphalens-ai-xxxxx.vercel.app`
