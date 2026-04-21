# Morning Edge — Options Signals Dashboard

A daily options trading signals app. Generates ranked signals across directional, income, and volatility strategies, tracks paper trades, and maintains backtest stats per strategy.

Currently ships with a deterministic mock data generator so you can validate the full UX end-to-end before wiring up paid market data feeds.

## 🚀 Quick Deploy

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/options-signals-app)

### Netlify
1. Connect your GitHub repo to Netlify
2. Auto-detects Next.js settings
3. Deploy!

### Railway
1. Connect your GitHub repo to Railway
2. Auto-detects Next.js
3. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides to multiple platforms.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (custom editorial-terminal design tokens)
- **Yahoo Finance API** (yahoo-finance2 package for real market data)
- **Resend** (optional: email delivery)
- Deterministic **mock generator** (seeded by date → same signals rendered server-side + client-side)
- Designed to slot into **Supabase + Vercel Cron** for production

## Quick start

```bash
cd options-signals-app
npm install  # Installs yahoo-finance2 and resend for real market data + email
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Note**: The app works with or without `yahoo-finance2` and `resend` installed. If packages are not available, it automatically falls back to mock data and disables email features.

### Quick Email Setup

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Resend API key and email
nano .env.local

# Run setup script (optional - handles dependencies)
bash scripts/setup-email.sh

# Test email delivery
npm run dev
curl -X POST http://localhost:3000/api/admin/test-email
```

## Real-Time Pricing Features

- **30-second cache duration** - Prices update every 30 seconds for near real-time data
- **Request deduplication** - Prevents duplicate simultaneous API calls for the same ticker
- **Concurrency control** - Batches requests (5 at a time) to avoid overwhelming the API
- **Retry logic with exponential backoff** - Automatically retries failed requests
- **Realistic mock data** - When Yahoo Finance isn't available, mock prices simulate realistic movements
- **Timeout protection** - 10-second request timeout to prevent hanging requests

## Force Refresh Data

To bypass the cache and get fresh data from Yahoo Finance, add the `refresh=true` query parameter:

```bash
# Force refresh signals
curl "http://localhost:3000/api/signals?refresh=true"

# Force refresh trades
curl "http://localhost:3000/api/trades?refresh=true"
```

Programmatically, use the `refreshQuote()` method in `src/lib/market-data.ts`.

Pages:

- `/` — today's morning brief with regime context and ranked signals
- `/trades` — paper trade ledger with open positions and realized P&L
- `/backtests` — strategy expectancy table, sorted by edge

API routes (return JSON, currently sourced from mocks):

- `GET /api/signals` — today's signals + market regime snapshot
- `GET /api/trades` — paper trades (open + closed)
- `GET /api/backtests` — historical strategy performance stats

## Testing

Run `npm run test` to verify the market data integration works (with or without yahoo-finance2 installed).

## Email Notifications

Send signals via email every morning between 5AM - 6:30AM PST.

### Setup

1. **Install Resend** (optional but recommended):
```bash
npm install resend
```

2. **Set environment variables** in `.env.local`:
```bash
# Resend API key (get from https://resend.com)
RESEND_API_KEY=your_resend_api_key

# Email configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TO=your.email@example.com
EMAIL_REPLY_TO=support@yourdomain.com

# Security (optional)
CRON_SECRET=your_secret_cron_token
ADMIN_TOKEN=your_admin_token

# App URL for email links (optional)
APP_URL=https://yourdomain.com
```

3. **Configure cron trigger** (choose one):

**Option A: Vercel Cron (if deployed on Vercel)**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-signals",
      "schedule": "0 5-6 * * MON-FRI"
    }
  ]
}
```

**Option B: External Cron Service**

Use [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com), or similar:
```
URL: https://yourdomain.com/api/cron/send-signals
Method: POST
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
Schedule: Every day at 5:00 AM PST
```

**Option C: Manual Testing**

```bash
# Test email delivery (requires ADMIN_TOKEN if configured)
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Trigger email send with force parameter (bypasses time window check)
curl -X POST "http://localhost:3000/api/cron/send-signals?force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check time window and configuration status
curl http://localhost:3000/api/cron/send-signals
```

### Features

- Automatically checks time window (5AM - 6:30AM PST) before sending
- Includes top 10 signals with market regime context
- Beautiful HTML email template with conviction scores
- Graceful fallback if email service not configured
- Force refresh of market data for latest prices

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── send-signals/route.ts  Daily email cron endpoint
│   │   ├── admin/
│   │   │   └── test-email/route.ts    Test email endpoint
│   │   ├── signals/route.ts           GET today's signals + regime
│   │   ├── trades/route.ts            GET paper trades
│   │   └── backtests/route.ts         GET strategy stats
│   ├── backtests/page.tsx             Strategy performance table
│   ├── trades/page.tsx                Paper trade ledger
│   ├── page.tsx                       Morning brief (home)
│   ├── layout.tsx                     Root layout + masthead nav
│   └── globals.css                    Fonts, design tokens, base styles
├── components/
│   ├── SignalCard.tsx                 Expandable signal with legs + catalysts
│   ├── RegimeStrip.tsx                SPX / VIX / skew / earnings row
│   └── Dateline.tsx             Live market clock
└── lib/
    ├── types.ts                 Signal, Trade, BacktestStat, MarketRegime
    ├── format.ts                Strategy labels, USD/pct/leg formatters
    └── mock/
        └── generator.ts         Seeded mock data generator
```

## Replacing the mock with live data

The app is built around the `lib/mock/generator.ts` contract. Every page calls `generateSignals(date)`, `generateRegime(date)`, `generateBacktests()`, or `generateTrades(signals)`. Swap those four functions with real implementations and the UI continues to work unchanged.

### Step 1 — Market data (Yahoo Finance)

Create `src/lib/market-data.ts` that wraps the Yahoo Finance API using the `yahoo-finance2` package. You need:

- `yahooFinance.quote(ticker)` — current price and basic quote data
- `yahooFinance.options(ticker, expirationDate)` — options chain data
- Batch quote fetching for multiple tickers

The implementation includes caching (5-minute TTL) and fallback to mock data if API calls fail.

### Step 2 — Signal engine

Create `src/lib/signals/engine.ts` that replaces `generateSignals(date)`. The mock generator already defines the output shape — your engine needs to produce the same `Signal[]` structure. Suggested scoring logic:

**Directional signals** — For each ticker in your universe:

1. Compute trend score: price vs 20/50/200 DMA (weighted).
2. Compute momentum: RSI(14), MACD histogram sign.
3. Check unusual options flow: today's call/put volume vs 30-day average.
4. If trend + momentum + flow align bullish and IV rank is 20-60, emit a bull call spread at 30-delta long / 15-delta short. Mirror for bearish.

**Income signals** — For each ticker with IV rank > 50 and no earnings in expiry window:

1. Check for mean-reverting setup (price extended from VWAP, RSI extremes).
2. Size wings at 1σ expected move (use IV30 × sqrt(DTE/365) × spot).
3. Require credit ≥ 33% of spread width, otherwise skip.

**Volatility signals** — For each ticker with earnings in the next 5 trading days:

1. Compute implied move (ATM straddle price ÷ spot).
2. Compare against average realized move over last 4–8 earnings events.
3. If realized > implied consistently, emit long straddle. If implied >> realized, emit short strangle (credit).

### Step 3 — Persistence (Supabase)

Create tables matching the type definitions in `src/lib/types.ts`:

```sql
create table signals (
  id text primary key,
  generated_at timestamptz not null,
  ticker text not null,
  underlying_price numeric not null,
  category text not null,
  strategy text not null,
  horizon text not null,
  conviction text not null,
  conviction_score numeric not null,
  legs jsonb not null,
  net_debit numeric not null,
  net_credit numeric not null,
  max_gain numeric,
  max_loss numeric,
  breakevens numeric[] not null,
  probability_of_profit numeric not null,
  thesis text not null,
  catalysts text[] not null,
  iv_rank integer not null,
  expected_move numeric not null,
  status text not null default 'active',
  closed_at timestamptz,
  realized_pnl numeric
);

create index signals_generated_at_idx on signals (generated_at desc);

create table trades (
  id text primary key,
  signal_id text references signals(id),
  ticker text not null,
  strategy text not null,
  entry_at timestamptz not null,
  entry_price numeric not null,
  contracts integer not null,
  mode text not null check (mode in ('paper', 'live')),
  exit_at timestamptz,
  exit_price numeric,
  pnl numeric,
  notes text
);

create table backtests (
  strategy text primary key,
  category text not null,
  sample_size integer not null,
  win_rate numeric not null,
  avg_win numeric not null,
  avg_loss numeric not null,
  expectancy numeric not null,
  sharpe numeric not null,
  max_drawdown numeric not null,
  last_updated timestamptz not null
);
```

### Step 4 — Scheduled runs (Vercel cron)

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/generate-signals", "schedule": "45 10 * * 1-5" },
    { "path": "/api/cron/mark-signals", "schedule": "5 20 * * 1-5" }
  ]
}
```

(Times are UTC. 10:45 UTC = 6:45 AM PT = 30 minutes before market open. 20:05 UTC = 4:05 PM ET = just after close.)

Create `src/app/api/cron/generate-signals/route.ts` that (1) calls the signal engine, (2) writes results to Supabase, (3) triggers the morning email via Resend.

Create `src/app/api/cron/mark-signals/route.ts` that (1) fetches all `active` signals, (2) prices them at close using Polygon, (3) updates status to `hit`/`missed`/`stopped`/`expired` and sets `realized_pnl`, (4) recomputes aggregate backtest stats.

Both routes should verify `Authorization: Bearer $CRON_SECRET` to prevent public triggering.

### Step 5 — Email (Resend)

Create `src/lib/email/morning-brief.tsx` with a React Email template that mirrors the home page layout. Resend's free tier handles 100 emails/day which is plenty for personal use.

## Design system

The visual language is deliberately editorial — a newsroom dateline, Fraunces serif for display, JetBrains Mono for numbers, burnt-orange accent. If you want to rebrand, the tokens live in two places:

- `tailwind.config.ts` — color ramps and font families
- `src/app/globals.css` — CSS variables for runtime theming

## Live trading

The scaffold ships with `mode: "paper"` hardcoded throughout. Before flipping a single trade to live:

1. Run the signal engine against live data in paper mode for **at least 3 months**.
2. Verify backtest expectancy on your actual universe matches the mock-generator claims.
3. Implement broker integration in `src/lib/broker/` (Tradier has the simplest options API).
4. Add position sizing rules — never risk more than 1-2% of account per trade.
5. Add hard stops that trigger broker orders, not just alerts.

These signals are research, not advice. Options decay. Bid-ask spreads eat edge. Most retail options traders lose money net of costs and discipline lapses. Paper-trade honestly — if you wouldn't take a signal in real money, don't count it as a paper win either.

## License

MIT — do what you want.
