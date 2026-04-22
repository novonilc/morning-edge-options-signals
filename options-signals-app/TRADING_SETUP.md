# Trade Execution Setup Guide

This guide covers the complete setup for live and paper trading with your options signals app.

## Table of Contents

1. [Paper Trading Setup](#paper-trading-setup)
2. [Live Trading Setup](#live-trading-setup)
3. [Broker Configuration](#broker-configuration)
4. [Risk Management](#risk-management)
5. [Trade Monitoring](#trade-monitoring)

## Paper Trading Setup

Paper trading lets you test signals without risking real capital. This is the default mode.

### Quick Start

1. **Start Paper Trading**:
   - Go to the Dashboard (`/dashboard`)
   - Find any signal and click "Live Trade →"
   - Click "Execute Trade" to simulate the trade
   - Trades appear in your Trade Journal (`/trades`)

2. **Monitor Positions**:
   - View all open positions on `/trades`
   - Close positions by clicking the "Close" button
   - Watch real-time P&L calculations

3. **Review Statistics**:
   - Win Rate, Profit Factor, Total P&L calculated automatically
   - Monthly breakdown of performance
   - Strategy-specific statistics

### Paper Trading Features

```javascript
// Automatic position sizing based on account risk
- 1% risk per trade (configurable in `src/lib/risk-management.ts`)
- Prevents over-leveraging with max position limits
- Calculates ideal stop loss and take profit levels

// Trade tracking includes
- Entry/exit prices and times
- Realized P&L for closed trades
- Open position P&L marked-to-market
- Trade journal with monthly summaries
```

## Live Trading Setup

To execute real trades, you'll need a broker API account and credentials.

### Step 1: Select Your Broker

Supported brokers:

| Broker | Setup Time | Minimum Account | Best For |
|--------|-----------|-----------------|----------|
| **Alpaca** | 5 min | $1 | Most beginners, $1-5k accounts |
| **TD Ameritrade** | 10 min | $2,000 | Mid-tier accounts, wide option selection |
| **Interactive Brokers** | 15 min | $2,000 | Advanced traders, institutional features |
| **Paper Trading** | Instant | $0 | Testing, risk-free simulation |

**Recommendation**: Start with **Alpaca** (free, no minimums, instant setup).

### Step 2: Get Broker Credentials

#### Alpaca (Recommended)

1. Go to https://app.alpaca.markets
2. Sign up for free account
3. Generate API keys:
   - Dashboard → Settings → API Keys
   - Copy "API Key" and "Secret Key"

#### TD Ameritrade

1. Go to https://www.tdameritrade.com
2. Open a brokerage account
3. Enable API access:
   - Account Settings → API Access
   - Generate access credentials

#### Interactive Brokers

1. Go to https://www.interactivebrokers.com
2. Open an IB account
3. Get API credentials:
   - Account Management → Configuration → API

### Step 3: Configure Environment Variables

Create or update `.env.local`:

```env
# Broker Configuration
BROKER_PROVIDER=alpaca          # alpaca | td-ameritrade | ib | paper
BROKER_API_KEY=YOUR_API_KEY
BROKER_API_SECRET=YOUR_SECRET
BROKER_ACCOUNT_ID=YOUR_ACCOUNT_ID

# Trading Settings
AUTO_TRADE=false                 # Auto-execute signals (careful!)
TEST_MODE=true                   # Paper mode (set false for live)
MAX_POSITION_SIZE=2000           # Max $ per trade
MAX_RISK_PER_TRADE=1             # Max % account risk per trade

# Yahoo Finance (for live pricing)
YAHOO_FINANCE_API_KEY=optional
```

### Step 4: Test Your Connection

1. Go to Trading page (`/trades`)
2. Click "Account" button in top right
3. Should show your account balance and buying power
4. If successful, you're connected

### Step 5: Enable Live Trading

```env
TEST_MODE=false          # Switch to live trading
```

⚠️ **WARNING**: This executes REAL orders with REAL money. Start with small positions.

## Broker Configuration

### Alpaca

**Best for beginners.** Free, no minimums, instant execution.

```typescript
// src/lib/broker-service.ts - Already configured
const config = {
  provider: 'alpaca',
  apiKey: process.env.BROKER_API_KEY,
  apiSecret: process.env.BROKER_API_SECRET,
  paperTrading: process.env.TEST_MODE === 'false' ? false : true,
};
```

**Features**:
- $1 minimum investment per trade
- $0 commissions
- Margin available (3.5x leverage)
- Paper trading with simulated fills

### TD Ameritrade

**Best for mid-tier traders.** $2,000 minimum, wider option selection.

```typescript
// Requires thinkorswim API setup
const tdConfig = {
  provider: 'td-ameritrade',
  accountId: process.env.BROKER_ACCOUNT_ID,
  refreshToken: process.env.TD_REFRESH_TOKEN,
};
```

### Interactive Brokers

**Best for advanced traders.** Full API control, lowest commissions.

```typescript
const ibConfig = {
  provider: 'ib',
  accountId: process.env.BROKER_ACCOUNT_ID,
  clientId: process.env.IB_CLIENT_ID,
  host: 'localhost',
  port: 7497,
};
```

## Risk Management

The app enforces strict risk controls to protect your capital.

### Position Sizing

Automatically calculates position size based on:

```
Position Size = (Account Risk $ / Risk per Share) × Contracts
Where:
- Account Risk = Account Equity × Risk % per trade (1% default)
- Risk per Share = Entry Price - Stop Loss
```

Example:
```
Account = $10,000
Risk per trade = 1% = $100
Entry = $150, Stop Loss = $140
Risk per share = $10
Position Size = $100 / $10 = 10 shares
```

### Risk Validation

Every trade is validated before execution:

- ✓ Position size doesn't exceed max
- ✓ Risk/reward ratio meets minimum (1:1.5 default)
- ✓ Stop loss is set
- ✓ Take profit is defined
- ✓ Account has sufficient funds

### Configuration

Edit `src/lib/risk-management.ts`:

```typescript
const RISK_RULES = {
  maxAccountRiskPercent: 1,        // 1% per trade
  maxDailyLossPercent: 5,          // Max 5% loss per day
  minRiskRewardRatio: 1.5,         // Min 1:1.5 ratio
  maxOpenPositions: 5,             // Max concurrent trades
};
```

## Trade Monitoring

### Dashboard

**Home Page** (`/`):
- View all signals with conviction scores
- Current market regime
- Real-time updates every 30 seconds

**Dashboard** (`/dashboard`):
- Same signals with "Live Trade" button
- Execute trades directly from signal cards

### Trades Page

**Trades & Journal** (`/trades`):

View open/closed positions:
- Real-time P&L calculations
- Win rate and profit factor
- Close positions manually
- Trade history with filters

### Account Monitoring

Real-time tracking:
- Account equity and buying power
- Open positions with current prices
- Unrealized P&L updates every 10 seconds
- Trade journal statistics

## Troubleshooting

### Issue: "Trade execution failed"

**Check**:
1. Broker API keys are correct
2. Account has sufficient buying power
3. Broker account is verified/funded
4. Check test mode is correct for your use case

### Issue: "Account information unavailable"

**Check**:
1. Broker connection is working (`/trades` should show account balance)
2. API credentials have account access permission
3. Broker API isn't down (check broker status page)

### Issue: P&L doesn't match broker

**Check**:
1. Fees/commissions not included in app calculation
2. Slippage between order submission and fill price
3. Time zone differences in trade times

### Issue: Signals not updating

**Check**:
1. Yahoo Finance connection working
2. Check network requests in browser DevTools
3. Refresh page or wait 30 seconds for cache refresh
4. Use `?refresh=true` query parameter for force refresh: `/api/signals?refresh=true`

## Next Steps

1. **Start with paper trading** (week 1-2)
   - Test signal quality
   - Verify position sizing
   - Understand your risk tolerance

2. **Go live with small positions** (week 3+)
   - Start with minimum position sizes
   - Build up as you gain confidence
   - Track real performance

3. **Optimize and refine** (ongoing)
   - Review monthly performance
   - Adjust risk rules based on results
   - Refine signal selection criteria

## Quick Commands

```bash
# Start development server
npm run dev

# Test broker connection
curl http://localhost:3000/api/trading/account

# Force price refresh
curl "http://localhost:3000/api/signals?refresh=true"

# View trades
open "http://localhost:3000/trades"

# View signals
open "http://localhost:3000/dashboard"
```

## Important Disclaimers

⚠️ **WARNING**: Options trading involves SIGNIFICANT RISK. You can lose 100% of your investment.

- Paper trading results ≠ live trading results
- Past performance doesn't guarantee future results
- Start with small positions and scale gradually
- Use stop losses on every trade
- Never risk more than 1-2% per trade
- Broker-specific fees and slippage apply

Options are NOT appropriate for all investors. Only trade what you can afford to lose.

## Support

- **Discord**: [Your Discord]
- **Email**: [Your Email]
- **Issues**: GitHub Issues
- **Documentation**: Full API docs at `/api/trading`

---

**Ready to trade? Go to `/dashboard` and click "Live Trade" on any signal!**
