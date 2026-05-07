# AdsAI Dashboard

Live performance dashboard + AI chat for your agency — Meta Ads, Google Ads, and GA4 in one place.

---

## What's inside

- **KPI Cards** — Total Spend, ROAS, Conversions, GA4 Sessions, CTR, CPC
- **Daily Spend Chart** — Meta vs Google over 7 / 30 / 90 days (switchable)
- **Campaign Table** — All campaigns, sortable by any column
- **AI Chat Panel** — Ask questions, get tables and analysis from your live data
- **Auto-refresh** — Dashboard updates every 10 minutes automatically

---

## Deploy in 5 minutes (free on Vercel)

### Step 1 — Upload to GitHub

1. Go to [github.com](https://github.com) → **+** → **New repository** → name it `ads-dashboard`
2. Upload the contents of this folder (not the folder itself, the files inside)

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your `ads-dashboard` repository
3. Click **Deploy** — Vercel auto-detects Next.js, no config needed

### Step 3 — Add your API key

1. In Vercel → your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com)
3. **Save** → go to **Deployments** → **Redeploy**

Your dashboard is live at `your-project.vercel.app` ✓

---


---

## Run locally

```bash
npm install
cp .env.local.example .env.local
# Paste your API key into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Customize

**MCP server URL** → `app/api/dashboard/route.js` and `app/api/chat/route.js`, line 5

**AI system prompt / personality** → `SYSTEM` constant in `app/api/chat/route.js`

**KPI cards shown** → `CARDS` array in `app/components/KPICards.js`

**Chat quick-reply chips** → `CHIPS` array in `app/components/ChatPanel.js`

**Auto-refresh interval** → `app/page.js`, line with `10 * 60 * 1000` (currently 10 minutes)
