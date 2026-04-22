# Quick Start: Options Trading Signals App

Get up and running in 5 minutes.

## 1. Install & Start (1 minute)

```bash
cd options-signals-app

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 2. Explore the App (2 minutes)

**Home Page** (`http://localhost:3000/`)
- View market regime (low vol, trend, chop, etc.)
- See signal count and categories

**Dashboard** (`http://localhost:3000/dashboard`)
- View all signals ranked by conviction
- Each signal shows:
  - Underlying symbol and price
  - Strategy type (directional, income, volatility)
  - Risk metrics (P&L range, win probability)
  - Thesis and catalysts

**Trades Page** (`http://localhost:3000/trades`)
- Open positions (live P&L marked-to-market)
- Trade history (closed positions with realized P&L)
- Journal statistics (win rate, profit factor, etc.)

## 3. Execute Your First Trade (2 minutes)

### Paper Trading (Risk-Free)

1. Go to `/dashboard`
2. Click "Live Trade →" on any signal
3. Modal appears showing:
   - Risk metrics for the trade
   - Recommended position size
   - Max risk/reward
4. Click "Execute Trade"
5. Trade appears on `/trades` page

### Live Trading (Real Money)

Need Alpaca account? Get free account at https://app.alpaca.markets (2 min setup)

**Then**:

1. Create `.env.local`:
```env
BROKER_PROVIDER=alpaca
BROKER_API_KEY=your_api_key_here
BROKER_API_SECRET=your_secret_here
TEST_MODE=true
```

2. Restart dev server: `npm run dev`

3. Go to `/trades` → Top right "Account" button
   - Should show your real account balance if connected

4. Execute trades on `/dashboard` - they'll go to your real broker

## 4. Understand the Key Components

### Signals

Your algo generates options setups daily:
- **Directional**: Bullish/bearish bets (call spreads, put spreads, etc.)
- **Income**: Premium collection (covered calls, cash-secured puts)
- **Volatility**: VIX-based plays, straddles, iron condors

Each signal includes:
- Entry price (debit/credit)
- Max profit and max loss
- Probability of profit (theoretical)
- Specific option legs and strikes
- Conviction score (high/medium/low)

### Risk Management (Automatic)

Every trade is sized and validated:
- Position size = 1% account risk / distance to stop
- Enforces minimum risk/reward ratios
- Prevents over-leveraging
- Checks account funds before executing

### Trade Journal (Automatic)

Every executed trade is tracked:
- Win rate calculated in real-time
- Profit factor (gross wins / gross losses)
- Total P&L and monthly P&L
- Per-strategy performance breakdown

## 5. Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Market regime & signals overview |
| Dashboard | `/dashboard` | Execute trades from signals |
| Trades | `/trades` | Position monitoring & journal |

## 6. Key Actions

```
Viewing Signals:
  - Home: See all signals + regime
  - Dashboard: Same signals with "Live Trade" button

Taking a Trade:
  - Click "Live Trade →" on signal
  - Review risk metrics in modal
  - Click "Execute Trade"
  - Order auto-submitted to broker

Monitoring Positions:
  - Go to Trades page
  - Watch real-time P&L (updates every 10s)
  - Close positions by clicking "Close"

Reviewing Performance:
  - Trades page shows stats (win rate, profit factor, total P&L)
  - Monthly breakdown
  - Trade history with all details
```

## 7. Configuration

### Default Settings

```env
# Paper trading (risk-free testing)
TEST_MODE=true

# Position sizing
MAX_RISK_PER_TRADE=1              # 1% per trade
MAX_POSITION_SIZE=2000            # Max $2,000 per trade

# Market data
YAHOO_FINANCE_API_KEY=            # Optional, uses mock if not set
```

### To Switch to Live Trading

1. Get Alpaca API keys from https://app.alpaca.markets
2. Set in `.env.local`:
```env
TEST_MODE=false          # LIVE MODE - REAL MONEY
BROKER_API_KEY=xxx
BROKER_API_SECRET=xxx
```
3. Restart dev server
4. Execute trades on `/dashboard` - they're live!

## 8. Understanding the Numbers

### On Each Signal Card

```
Entry: $500 (or "Credit $200")
  └─ How much you pay to enter the trade

Max Gain: $1,000
  └─ Biggest profit if everything works perfectly

Max Loss: $500
  └─ Biggest loss if trade goes against you

POP: 65%
  └─ Probability of Profit (theoretical, not guaranteed)

IV Rank: 72
  └─ Implied Volatility percentile (0-100)
```

### In the Execute Modal

```
Position Size: 10 contracts
  └─ Auto-calculated: 1% account risk / distance to stop

Account Equity: $10,000
  └─ Your current balance

Risk/Trade: $100
  └─ Max you'll lose on this trade (1% of account)

Reward/Trade: $500
  └─ Max you could gain (if max profit hits)

Risk/Reward Ratio: 1:5
  └─ For every $1 risked, you could make $5
```

## 9. Common Workflows

### Workflow 1: Paper Trade Everything First

```
1. Signals update daily at market open
2. Go to /dashboard
3. Review today's signals
4. Execute a few as paper trades
5. Monitor on /trades page
6. Check results tomorrow
7. Repeat for 1-2 weeks to validate quality
```

### Workflow 2: Go Live with Alpaca

```
1. Create free Alpaca account (2 min)
2. Get API keys from Alpaca dashboard
3. Add to .env.local (3 keys)
4. TEST_MODE=false (1 line)
5. Click "Live Trade" on any signal
6. Real order submitted to Alpaca
7. Monitor on /trades (real-time P&L)
8. Close manually or let it run
```

### Workflow 3: Review Monthly Performance

```
1. Go to /trades page
2. Scroll to stats cards at top:
   - Total Trades: How many executed
   - Win Rate: % of profitable trades
   - Profit Factor: Gross wins / Gross losses
   - Total P&L: $$ made/lost all time
3. Use filter buttons:
   - "All": Show all trades
   - "Open": Show still-open positions
   - "Closed": Show results only
4. Export or screen-share for review
```

## 10. Troubleshooting

### "No signals showing"
- Refresh page (data updates every 60s)
- Check browser console for errors
- Market might be closed (signals generate 9:30-4:00 ET)

### "Execute Trade button doesn't work"
- Check if TEST_MODE=true in .env.local
- Or if TEST_MODE=false, check API keys are correct
- Try paper trading first (no credentials needed)

### "P&L not updating"
- Refresh page
- Wait 10 seconds (updates every 10 seconds)
- Check broker connection: `/trades` → Account button should show balance

### "0 "Mock data" showing instead of real prices"
- Yahoo Finance API likely failing
- App automatically falls back to mock
- Real prices will show once API recovers
- Use ?refresh=true to force data refresh

## 11. Next Steps

1. **Today**: Explore app, run paper trades
2. **This Week**: Validate signal quality with paper trading
3. **Next Week**: Get Alpaca account, go live with small size
4. **Ongoing**: Monitor daily, refine position sizing

## 12. Important Warnings

🚨 **Read These**:

1. **Options can expire worthless** - 0% profit is possible
2. **0DTE trades are high-risk** - Can lose 100% of premium in hours
3. **Start small** - 1-2 contracts until you're profitable
4. **Earnings plays are extreme** - 50+ point moves in single day
5. **This isn't financial advice** - Do your own research
6. **Past ≠ Future** - Backtests don't guarantee live results
7. **Emotions kill traders** - Follow your risk rules religiously

## 13. Resources

📖 **Learn More**:
- [Full Setup Guide](./TRADING_SETUP.md) - Detailed broker configuration
- [Architecture Docs](./TRADING_ARCHITECTURE.md) - How the system works
- [API Docs](./README.md#api) - Technical reference

🔗 **External**:
- [Alpaca Docs](https://docs.alpaca.markets)
- [Options Basics](https://www.investopedia.com/options-basics/)
- [Risk Management](https://www.investopedia.com/articles/trading/09/risk-management.asp)

## 14. Support

**Issues?**
- Check `/trades` page for error messages
- Inspect browser console (F12)
- Review error logs in terminal

**Questions?**
- Check TRADING_SETUP.md for detailed config
- Check TRADING_ARCHITECTURE.md for how things work
- Browse code comments in src/lib/

---

**Ready? Go to `http://localhost:3000/dashboard` and execute your first trade!**

Remember: Start with paper trading, validate your edge, then go live with discipline.

Happy trading! 📈
