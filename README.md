# 🏫 University News Watcher

A news monitoring and digest tool for tracking admissions news across the top US universities. Built for Chinese study-abroad consulting teams.

---

## Quick Start (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your **Anthropic API key** (required):
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Scrape your first articles
Click the **"Run Scraper"** button in the top nav, or visit the dashboard — it will prompt you to run the scraper.

The first scrape takes 3–5 minutes (Claude classifies each article).

---

## Features

- **Live scraping** from MIT, Harvard, Stanford, Columbia, UCLA RSS feeds
- **AI-powered summaries** in English + Simplified Chinese (简体中文)
- **Urgency classification** — flags policy changes, deadline updates, visa news
- **Category filtering** — 8 news categories in the sidebar
- **Daily + Weekly views** — toggle between today's news and 7-day digest
- **Language toggle** — switch entire UI between EN and 中文, persists in localStorage
- **Email digest** — weekly HTML email + instant urgent alerts via SMTP
- **Settings page** — configure SMTP, recipients, language default

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude API key for summarization |
| `SERPER_API_KEY` | Optional | Google News search (2,500 free/month at serper.dev) |
| `SMTP_HOST` | Optional | Email host (e.g. smtp.gmail.com) |
| `SMTP_PORT` | Optional | Email port (587 for TLS) |
| `SMTP_USER` | Optional | Your email address |
| `SMTP_PASS` | Optional | App password (Gmail: use App Passwords) |
| `DEFAULT_RECIPIENT` | Optional | Default digest recipient |

---

## Email Setup (Gmail)

1. Enable 2-Step Verification on your Google Account
2. Go to **Security → App Passwords**
3. Create a new app password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

Or configure via the **Settings page** at `/settings`.

---

## Scheduling (Auto-scrape)

For **daily automatic scraping**, run the scheduler in a separate terminal:

```bash
npm install ts-node dotenv --save-dev
node scripts/scheduler.js
```

This runs:
- **Daily scrape**: Every day at 8am China Standard Time (CST/UTC+8)
- **Weekly digest email**: Every Monday at 8am CST

Keep this process running alongside `npm run dev`.

---

## Scale to All 50 Universities

Edit `data/universities.ts` and uncomment/add universities:

```typescript
{
  name: 'Yale University',
  shortName: 'Yale',
  domain: 'yale.edu',
  admissionsUrl: 'https://admissions.yale.edu',
  rssFeeds: ['https://news.yale.edu/rss.xml'],
  location: 'New Haven, CT',
},
```

---

## Deploy to Vercel (Later)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. **Replace** `data/news-store.json` with Supabase (free tier)
5. **Replace** `scripts/scheduler.js` with Vercel Cron Jobs in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "0 0 * * *"
  }]
}
```

---

## Project Structure

```
/app
  page.tsx              — Dashboard (daily view)
  /settings/page.tsx    — Settings page
  /api/scrape/route.ts  — Manual trigger + scraper
  /api/digest/route.ts  — Article query API
  /api/send-email/route.ts — Email + settings API

/lib
  scraper.ts            — RSS + Serper + Cheerio scraping
  classifier.ts         — Claude: summary, translation, urgency
  emailer.ts            — Nodemailer email templates
  scheduler.ts          — node-cron daily/weekly jobs
  store.ts              — JSON file read/write
  types.ts              — TypeScript types + category labels

/data
  universities.ts       — Top 5 universities config (expand to 50)
  news-store.json       — Local article storage
  config.json           — Settings (auto-created on first save)

/components
  NewsCard.tsx          — Article card with EN/CN toggle
  SectionFilter.tsx     — Sidebar category filter
```

---

## Urgency Classification

An article is flagged **URGENT** if it involves:
- EA/ED/RD deadline changes
- Test-optional/required policy changes
- Acceptance rate changes >2% YoY
- New AI use policies in applications
- Legal/political changes (affirmative action, visa policy)
- Common App participation changes

Everything else is **NORMAL**.

---

## Cost Estimate

Using Claude API (claude-3-5-sonnet):
- ~20 articles/day × 5 universities = 100 articles/day
- ~600 tokens per classification = 60,000 tokens/day
- Cost: ~$0.18/day or ~$5.40/month

Add Serper for Google News search: 100 queries/day = 3,000/month (free tier is 2,500 — very close to free)
