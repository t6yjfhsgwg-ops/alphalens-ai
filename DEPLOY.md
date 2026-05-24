# AlphaLens AI — Deploy Guide (Step 7)

Deploy the **frontend** (static site) and **backend** (Node API + SQLite) separately.

```
Browser  →  Vercel (HTML/CSS/JS)  →  Railway (API + SQLite)
```

---

## Part A — Deploy the API (Railway)

### 1. Push code to GitHub

Create a repo and push the `alphalens-ai` folder (do **not** commit `server/.env`).

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Set **Root Directory** to `server`

### 3. Add environment variables

In Railway → your service → **Variables**:

| Variable | Value |
|----------|--------|
| `FINNHUB_API_KEY` | Your Finnhub key |
| `DATABASE_PATH` | `/data/alphalens.db` |
| `ALLOWED_ORIGINS` | `https://your-site.vercel.app` (update after Part B) |

### 4. Add a persistent volume (keeps SQLite data)

1. Railway → service → **Volumes**
2. **Add Volume** → mount path: `/data`
3. Redeploy

### 5. Get your API URL

Railway → **Settings** → **Networking** → **Generate Domain**

Example: `https://alphalens-api-production.up.railway.app`

Test: `https://YOUR-API-URL/api/health`

---

## Part B — Deploy the frontend (Vercel)

### 1. Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in
2. **Add New Project** → import your repo
3. **Root Directory**: `alphalens-ai` (or repo root if monorepo)
4. Framework: **Other** (static site)
5. Deploy

### 2. Point the frontend at your API

Edit `js/config.js` and set your Railway URL:

```javascript
const PRODUCTION_API_URL = "https://alphalens-api-production.up.railway.app";
```

Commit and push — Vercel redeploys automatically.

**Alternative** (no code change): add to each HTML `<head>`:

```html
<meta name="api-base" content="https://alphalens-api-production.up.railway.app" />
```

### 3. Update Railway CORS

Set `ALLOWED_ORIGINS` in Railway to your Vercel URL:

```
https://your-project.vercel.app
```

Redeploy the API.

---

## Part C — Custom domain (optional)

### Vercel (website)

1. Vercel → Project → **Settings** → **Domains**
2. Add your domain (e.g. `alphalens.com`)
3. Update DNS at your registrar per Vercel instructions

### Railway (API)

1. Railway → **Settings** → **Custom Domain**
2. Add e.g. `api.alphalens.com`
3. Update `PRODUCTION_API_URL` in `js/config.js` to match

---

## Deploy from CLI (optional)

### Railway

```powershell
cd c:\Users\anil1299\projects\alphalens-ai\server
npm i -g @railway/cli
railway login
railway init
railway variables set FINNHUB_API_KEY=your_key
railway variables set DATABASE_PATH=/data/alphalens.db
railway up
railway domain
```

### Vercel

```powershell
cd c:\Users\anil1299\projects\alphalens-ai
npm i -g vercel
vercel login
vercel
```

---

## Checklist

- [ ] `server/.env` is **not** in git
- [ ] `FINNHUB_API_KEY` set on Railway
- [ ] Volume mounted at `/data` on Railway
- [ ] `PRODUCTION_API_URL` set in `js/config.js`
- [ ] `ALLOWED_ORIGINS` includes your Vercel URL
- [ ] `/api/health` works on Railway URL
- [ ] Live prices load on Vercel site

---

## Costs (typical)

| Service | Free tier |
|---------|-----------|
| Vercel | Free for personal/static sites |
| Railway | ~$5/mo credit (may need paid plan for always-on) |
| Domain | ~$10–15/year (optional) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "API offline" on live site | Set `PRODUCTION_API_URL` in `js/config.js` |
| CORS errors | Add Vercel URL to `ALLOWED_ORIGINS` on Railway |
| Scores reset on redeploy | Add Railway volume at `/data` |
| 403 from Finnhub | Rate limit — cache helps; upgrade Finnhub plan |
