# Trade Execution Architecture

Complete technical overview of the options trading system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dashboard (/)              Signals (/dashboard)             │
│    - Market regime           - Signal cards                  │
│    - Regime visualization    - Live Trade button            │
│                              - Execute modal                │
│                                                              │
│  Trades (/trades)           Execute Modal                   │
│    - Open positions          - Risk preview                 │
│    - Closed positions        - Position sizing              │
│    - Trade journal           - Confirmation                 │
│    - Performance stats                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ API
┌─────────────────────────────────────────────────────────────┐
│                  Backend & Services                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/signals              /api/trading                      │
│    GET - Fetch signals       POST /execute - Execute trade  │
│    Parameters:               POST /close - Close position    │
│      ?refresh=true           GET /account - Account info    │
│      ?limit=10               GET /positions - Open trades   │
│                              GET /journal - Trade history   │
│                              POST /settings - Config        │
│                                                              │
│  Core Services                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. BrokerService                                   │    │
│  │    - Multi-broker adapter                         │    │
│  │    - Order execution                              │    │
│  │    - Position management                          │    │
│  │    - Account access                               │    │
│  │                                                   │    │
│  │ 2. RiskManagementService                          │    │
│  │    - Position sizing (Kelly criterion)            │    │
│  │    - Trade validation                             │    │
│  │    - Risk/reward ratio checks                      │    │
│  │    - Stop loss enforcement                        │    │
│  │                                                   │    │
│  │ 3. TradeJournalService                            │    │
│  │    - Trade logging                                │    │
│  │    - P&L calculation                              │    │
│  │    - Performance statistics                       │    │
│  │    - Monthly summaries                            │    │
│  │                                                   │    │
│  │ 4. MarketDataService                              │    │
│  │    - Yahoo Finance integration                    │    │
│  │    - 30-second cache                              │    │
│  │    - Real-time pricing                            │    │
│  │    - Fallback mock data                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              External Broker APIs                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Alpaca     │   │  TD Ameritrade│  │   IBKR       │    │
│  │   (REST)     │   │   (REST)      │  │   (TWS API)  │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Signal to Execution

### 1. Signal Generation

```
generateSignals()
├─ Fetch market data (Yahoo Finance)
├─ Analyze options chains
├─ Calculate P&L ranges
├─ Generate signal thesis
└─ Return Signal object
  {
    id, symbol, type, category, horizon, conviction,
    underlyingPrice, legs[], maxGain, maxLoss, maxProfit,
    breakevens[], thesis, catalysts, confidence, ...
  }
```

### 2. Display on Dashboard

```
Dashboard (/dashboard)
├─ Query /api/signals
├─ Render SignalCard components
├─ Show "Live Trade →" button
└─ Wait for user click
```

### 3. Execute Trade Flow

```
User clicks "Live Trade →"
│
├─ Open ExecuteTradeModal
├─ Modal calls /api/trading?account
│  │
│  ├─ BrokerService.initialize()
│  ├─ BrokerService.getAccount()
│  │  └─ Returns: { equity, cash, buyingPower }
│  │
│  └─ RiskManagementService.calculatePositionSize()
│     ├─ Input: account equity, entry price, stop loss
│     ├─ Calculate: Max risk per trade = equity × 1%
│     ├─ Calculate: Position size = max risk / stop loss distance
│     └─ Returns: { quantity, cost, riskAmount, rewardAmount, isAllowed }
│
├─ Display risk metrics to user
│  ├─ Account balance
│  ├─ Position size
│  ├─ Max risk
│  ├─ Max profit
│  ├─ Risk/reward ratio
│  └─ Warnings if violating rules
│
└─ User clicks "Execute Trade"
   │
   └─ POST /api/trading/execute
      │
      ├─ Receive Signal object
      │
      ├─ RiskManagementService.validateTrade()
      │  ├─ Check: Position size allowed
      │  ├─ Check: Risk/reward >= 1.5
      │  ├─ Check: Stop loss set
      │  ├─ Check: Account has funds
      │  └─ Return: validation result
      │
      ├─ BrokerService.executeSignal(signal)
      │  ├─ Translate signal to orders
      │  ├─ Set order parameters:
      │  │  ├─ Quantity: position size
      │  │  ├─ Type: market/limit
      │  │  ├─ Stop loss: entry - (entry - stop)
      │  │  └─ Take profit: entry + max gain
      │  │
      │  └─ Submit orders to broker
      │     └─ Returns: { orderId, status, fills, ... }
      │
      ├─ TradeJournalService.logTrade()
      │  ├─ Record: Entry price, time, quantity, symbol
      │  ├─ Store: Stop loss, take profit levels
      │  └─ Save to persistent storage
      │
      └─ Return execution result
         └─ { success, tradeId, order, positionSize }
```

### 4. Position Monitoring

```
Trades Page (/trades)
│
├─ Refresh every 10 seconds
│
├─ GET /api/trading/positions
│  └─ BrokerService.getPositions()
│     └─ Returns: [{ symbol, qty, entryPrice, currentPrice, pnl }]
│
├─ Calculate real-time P&L
│  ├─ Unrealized P&L = (current - entry) × quantity
│  ├─ Color code: Green if positive, red if negative
│  └─ Update percentages
│
└─ Display:
   ├─ Ticker, Qty, Entry, Current, P&L, %
   └─ Close button for each position
```

### 5. Position Closure

```
User clicks "Close" on position
│
└─ POST /api/trading/close
   │
   ├─ Receive: tradeId, exitPrice
   │
   ├─ BrokerService.closePosition()
   │  ├─ Get current order details
   │  ├─ Submit market sell order
   │  ├─ Wait for fill confirmation
   │  └─ Return: { orderId, fills, finalPrice }
   │
   ├─ TradeJournalService.closeTrade()
   │  ├─ Find open trade by ID
   │  ├─ Calculate P&L:
   │  │  └─ Realized P&L = (exit - entry) × quantity - fees
   │  ├─ Record close time and price
   │  ├─ Update trade status to CLOSED
   │  └─ Recalculate statistics
   │
   └─ Return closed trade info
      └─ { id, pnl, pnlPercent, returnOnRisk, ... }
```

## Core Services

### BrokerService

```typescript
class BrokerService {
  // Initialization
  async initialize(config: BrokerConfig)
  
  // Account & Positions
  async getAccount() → AccountInfo
  async getPositions() → Position[]
  async getPosition(symbol) → Position
  
  // Trading
  async executeSignal(signal: Signal) → TradeOrder
  async placeOrder(order: OrderRequest) → OrderFill
  
  // Position Management
  async closePosition(positionId, exitPrice)
  async setStopLoss(orderId, stopPrice)
  async setTakeProfit(orderId, profitPrice)
  
  // Order Management
  async getOrders(status?)
  async cancelOrder(orderId)
  async getOrderStatus(orderId)
}
```

### RiskManagementService

```typescript
class RiskManagementService {
  // Position Sizing (Kelly Criterion)
  calculatePositionSize(
    accountEquity: number,
    entryPrice: number,
    stopLoss: number,
    openPositions: number
  ) → PositionSize
  
  // Trade Validation
  validateTrade(
    entryPrice: number,
    stopLoss: number,
    maxProfit: number,
    quantity: number
  ) → ValidationResult
  
  // Risk Analytics
  getRiskStats() → RiskStats
  getAccountRiskExposure() → RiskExposure
  checkDailyLimitBreached() → boolean
}
```

### TradeJournalService

```typescript
class TradeJournalService {
  // Track Trades
  logTrade(userId, signal, execution) → Trade
  closeTrade(userId, tradeId, exitPrice) → ClosedTrade
  
  // Retrieve Data
  getJournal(userId) → Trade[]
  getTrade(userId, tradeId) → Trade
  
  // Statistics
  getStats(userId) → JournalStats
  getMonthlySummary(userId, month) → MonthlySummary
  getStrategyStats(userId, strategy) → StrategyStats
  
  // Metrics
  getWinRate(userId) → number
  getProfitFactor(userId) → number
  getTotalPnL(userId) → number
  getAvgWin/Loss() → number
}
```

## API Endpoints

### Signal API

```typescript
GET /api/signals
Query Parameters:
  ?refresh=true     // Force data refresh (bypass 30s cache)
  ?limit=10         // Limit number of signals
  ?category=directional

Response:
{
  signals: Signal[],
  regime: MarketRegime,
  updatedAt: timestamp
}
```

### Trading API

```typescript
// Execute Signal as Trade
POST /api/trading/execute
Body: { signal: Signal }
Response: { success, tradeId, order, positionSize }

// Get Account Info
GET /api/trading?account
Response: { equity, cash, buyingPower }

// Get Open Positions
GET /api/trading?positions
Response: { positions: Position[] }

// Close Position
POST /api/trading/close
Body: { tradeId, exitPrice }
Response: { success, trade }

// Trade Journal
GET /api/trading?journal
Response: { trades, stats }

// Trading Settings
GET /api/trading?settings
POST /api/trading/settings
Body: { brokerProvider, autoTrade, maxPositionSize, ... }
```

## Data Models

### Signal

```typescript
interface Signal {
  id: string
  ticker: string
  symbol: string
  type: 'BULLISH' | 'BEARISH'
  category: 'directional' | 'income' | 'volatility'
  horizon: 'day' | 'week' | 'month'
  conviction: 'high' | 'medium' | 'low'
  underlyingPrice: number
  
  // Options structure
  legs: OptionLeg[]
  netDebit: number
  netCredit: number
  
  // Risk/Reward
  maxGain: number
  maxLoss: number
  probabilityOfProfit: number
  breakevens: number[]
  
  // Context
  thesis: string
  catalysts: string[]
  ivRank: number
  convictionScore: number
  confidence: number
}
```

### TradeOrder

```typescript
interface TradeOrder {
  id: string
  symbol: string
  type: 'BUY' | 'SELL' | 'BUY_TO_CLOSE'
  quantity: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  
  status: 'PENDING' | 'FILLED' | 'PARTIAL' | 'REJECTED'
  filledAt: timestamp
  filledPrice: number
  broker: string
  brokerOrderId: string
}
```

### ClosedTrade

```typescript
interface ClosedTrade extends TradeOrder {
  exitPrice: number
  exitTime: timestamp
  pnl: number
  pnlPercent: number
  duration: number // milliseconds
  returnOnRisk: number
  duration: number
}
```

## Environment Variables

```env
# Broker Selection
BROKER_PROVIDER=alpaca|td-ameritrade|ib|paper

# Broker Credentials (varies by provider)
BROKER_API_KEY=xxx
BROKER_API_SECRET=xxx
BROKER_ACCOUNT_ID=xxx

# Trading Configuration
AUTO_TRADE=false
TEST_MODE=true
MAX_POSITION_SIZE=2000
MAX_RISK_PER_TRADE=1

# Market Data
YAHOO_FINANCE_API_KEY=optional
```

## Performance Considerations

### Caching

```
Market Data (yahoo-finance2):
├─ 30-second cache on price quotes
├─ Deduplicated concurrent requests
└─ Automatic fallback to mock data

Account Data:
├─ Fetched on demand
├─ Cached for 5 seconds in modal
└─ Real-time updates on trades page

Signal Generation:
├─ Cached for 60 seconds
└─ Force refresh with ?refresh=true
```

### Concurrency

```
Request Deduplication:
├─ Multiple identical requests → single backend call
├─ Results cached and returned to all requesters
└─ Prevents broker API throttling

Rate Limiting (per broker):
├─ Alpaca: 200 req/min
├─ TD Ameritrade: 120 req/min
├─ IBKR: 100 req/min
└─ App enforces 60 req/min client-side
```

### Latency

```
Signal Generation: ~1-2 seconds
├─ Yahoo Finance API: 500-1000ms
├─ Options analysis: 300-500ms
└─ Thesis generation: 200-300ms

Trade Execution: ~50-500ms
├─ Risk validation: 10ms
├─ Order submission: 20-200ms
└─ Fill confirmation: 20-300ms
```

## Error Handling

```typescript
// API Errors
500 INTERNAL_SERVER_ERROR
  └─ Broker connection failed
  └─ Risk validation error
  └─ Database error

400 BAD_REQUEST
  └─ Invalid signal format
  └─ Missing required parameters
  └─ Invalid trade configuration

401 UNAUTHORIZED
  └─ Invalid broker credentials
  └─ Expired API tokens

402 PAYMENT_REQUIRED
  └─ Insufficient buying power

429 TOO_MANY_REQUESTS
  └─ Rate limit exceeded
```

## Testing Strategy

### Unit Tests

```bash
npm run test

# Test broker service
- ✓ Alpaca authentication
- ✓ Position size calculation
- ✓ Trade validation rules
- ✓ P&L calculations

# Test risk management
- ✓ Kelly criterion calculation
- ✓ Stop loss enforcement
- ✓ Margin requirement checks
- ✓ Risk/reward ratio validation

# Test trade journal
- ✓ Trade logging
- ✓ P&L accuracy
- ✓ Statistics calculations
- ✓ Monthly summaries
```

### Integration Tests

```bash
npm run test:integration

# Paper trading flow
- Fetch account info
- Generate signals
- Execute mock trades
- Close positions
- Verify P&L calculations

# Live trading (testnet)
- Submit orders to testnet broker
- Verify order fills
- Check trade journal accuracy
```

## Deployment

### Vercel (Recommended)

```bash
# Environment variables
BROKER_PROVIDER=alpaca
BROKER_API_KEY=xxx
BROKER_API_SECRET=xxx
TEST_MODE=true

# Database
DATABASE_URL=postgresql://...
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD npm start
```

```bash
docker run \
  -e BROKER_PROVIDER=alpaca \
  -e BROKER_API_KEY=$BROKER_API_KEY \
  -e BROKER_API_SECRET=$BROKER_API_SECRET \
  -p 3000:3000 \
  options-signals-app
```

## Monitoring

### Health Checks

```
GET /api/health
Response: { status, broker, db, cache, uptime }

GET /api/trading/account
└─ Validates broker connection

GET /api/signals
└─ Validates market data connection
```

### Metrics to Track

```
- Broker API response time (target: <200ms)
- Signal generation time (target: <2s)
- Trade execution latency (target: <500ms)
- Win rate and profit factor
- Daily/monthly P&L
- System uptime (target: >99%)
```

---

**See TRADING_SETUP.md for operational guides and TRADING.md for trader documentation.**
