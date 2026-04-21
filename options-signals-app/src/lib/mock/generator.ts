import type {
  Signal,
  Strategy,
  Category,
  Horizon,
  Conviction,
  Leg,
  MarketRegime,
  BacktestStat,
  Trade,
} from "@/lib/types";
import type { MarketData } from "@/lib/market-data";

const TICKERS = [
  "NVDA",
  "SPY",
  "QQQ",
  "TSLA",
  "AAPL",
  "MSFT",
  "AMD",
  "META",
  "GOOGL",
  "AMZN",
  "IWM",
  "COIN",
];

async function getUniverse(forceRefresh = false): Promise<Array<MarketData & { ivRank: number }>> {
  try {
    // Dynamic import to handle missing yahoo-finance2
    const { yahooFinanceService } = await import("@/lib/market-data");
    
    let marketData: MarketData[];
    
    if (forceRefresh && TICKERS.length > 0) {
      // Force refresh each ticker individually
      marketData = await Promise.all(
        TICKERS.map((ticker) => yahooFinanceService.refreshQuote(ticker))
      );
    } else {
      // Use normal cached request
      marketData = await yahooFinanceService.getQuotes(TICKERS);
    }
    
    // For IV rank, we'll use a mock calculation since Yahoo Finance doesn't provide it directly
    // In a real implementation, you might use a different data source for IV rank
    return marketData.map((data, index) => ({
      ...data,
      ivRank: 20 + Math.floor(Math.random() * 60), // Mock IV rank between 20-80
    }));
  } catch (error) {
    console.error("Failed to fetch market data, falling back to mock data:", error);
    // Fallback to mock data if Yahoo Finance fails
    return TICKERS.map((ticker, index) => ({
      ticker,
      price: 100 + Math.random() * 400, // Mock prices
      ivRank: 20 + Math.floor(Math.random() * 60),
    }));
  }
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function dateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function round(n: number, decimals = 2): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

function expiryDates(today: Date, horizon: Horizon): string {
  const d = new Date(today);
  if (horizon === "0dte") {
    // nearest Friday; if already Friday, today
    return d.toISOString().slice(0, 10);
  }
  if (horizon === "weekly") {
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  }
  d.setDate(d.getDate() + 25);
  return d.toISOString().slice(0, 10);
}

function buildLegs(
  strategy: Strategy,
  spot: number,
  expiry: string,
  rnd: () => number
): { legs: Leg[]; debit: number; credit: number; maxGain: number; maxLoss: number; breakevens: number[] } {
  const atm = Math.round(spot);
  switch (strategy) {
    case "bull_call_spread": {
      const longStrike = atm;
      const shortStrike = atm + 5;
      const longPrem = round(2.2 + rnd() * 1.2);
      const shortPrem = round(0.6 + rnd() * 0.6);
      const debit = round(longPrem - shortPrem);
      const maxGain = round(5 - debit);
      return {
        legs: [
          { action: "buy", right: "call", strike: longStrike, expiry, premium: longPrem },
          { action: "sell", right: "call", strike: shortStrike, expiry, premium: shortPrem },
        ],
        debit,
        credit: 0,
        maxGain,
        maxLoss: debit,
        breakevens: [round(longStrike + debit)],
      };
    }
    case "bear_put_spread": {
      const longStrike = atm;
      const shortStrike = atm - 5;
      const longPrem = round(2.2 + rnd() * 1.2);
      const shortPrem = round(0.6 + rnd() * 0.6);
      const debit = round(longPrem - shortPrem);
      const maxGain = round(5 - debit);
      return {
        legs: [
          { action: "buy", right: "put", strike: longStrike, expiry, premium: longPrem },
          { action: "sell", right: "put", strike: shortStrike, expiry, premium: shortPrem },
        ],
        debit,
        credit: 0,
        maxGain,
        maxLoss: debit,
        breakevens: [round(longStrike - debit)],
      };
    }
    case "iron_condor": {
      const width = 2;
      const wing = 3;
      const putShort = atm - wing;
      const putLong = putShort - width;
      const callShort = atm + wing;
      const callLong = callShort + width;
      const credit = round(0.6 + rnd() * 0.4);
      return {
        legs: [
          { action: "buy", right: "put", strike: putLong, expiry, premium: round(0.3 + rnd() * 0.2) },
          { action: "sell", right: "put", strike: putShort, expiry, premium: round(0.9 + rnd() * 0.3) },
          { action: "sell", right: "call", strike: callShort, expiry, premium: round(0.9 + rnd() * 0.3) },
          { action: "buy", right: "call", strike: callLong, expiry, premium: round(0.3 + rnd() * 0.2) },
        ],
        debit: 0,
        credit,
        maxGain: credit,
        maxLoss: round(width - credit),
        breakevens: [round(putShort - credit), round(callShort + credit)],
      };
    }
    case "credit_put_spread": {
      const shortStrike = atm - 3;
      const longStrike = atm - 5;
      const credit = round(0.55 + rnd() * 0.3);
      return {
        legs: [
          { action: "buy", right: "put", strike: longStrike, expiry, premium: round(0.4 + rnd() * 0.2) },
          { action: "sell", right: "put", strike: shortStrike, expiry, premium: round(0.95 + rnd() * 0.3) },
        ],
        debit: 0,
        credit,
        maxGain: credit,
        maxLoss: round(2 - credit),
        breakevens: [round(shortStrike - credit)],
      };
    }
    case "credit_call_spread": {
      const shortStrike = atm + 3;
      const longStrike = atm + 5;
      const credit = round(0.55 + rnd() * 0.3);
      return {
        legs: [
          { action: "sell", right: "call", strike: shortStrike, expiry, premium: round(0.95 + rnd() * 0.3) },
          { action: "buy", right: "call", strike: longStrike, expiry, premium: round(0.4 + rnd() * 0.2) },
        ],
        debit: 0,
        credit,
        maxGain: credit,
        maxLoss: round(2 - credit),
        breakevens: [round(shortStrike + credit)],
      };
    }
    case "long_straddle": {
      const strike = atm;
      const callPrem = round(spot * 0.04 + rnd() * 1);
      const putPrem = round(spot * 0.04 + rnd() * 1);
      const debit = round(callPrem + putPrem);
      return {
        legs: [
          { action: "buy", right: "call", strike, expiry, premium: callPrem },
          { action: "buy", right: "put", strike, expiry, premium: putPrem },
        ],
        debit,
        credit: 0,
        maxGain: Infinity,
        maxLoss: debit,
        breakevens: [round(strike - debit), round(strike + debit)],
      };
    }
    case "long_strangle": {
      const callStrike = atm + 5;
      const putStrike = atm - 5;
      const callPrem = round(spot * 0.025 + rnd() * 0.6);
      const putPrem = round(spot * 0.025 + rnd() * 0.6);
      const debit = round(callPrem + putPrem);
      return {
        legs: [
          { action: "buy", right: "put", strike: putStrike, expiry, premium: putPrem },
          { action: "buy", right: "call", strike: callStrike, expiry, premium: callPrem },
        ],
        debit,
        credit: 0,
        maxGain: Infinity,
        maxLoss: debit,
        breakevens: [round(putStrike - debit), round(callStrike + debit)],
      };
    }
    case "short_strangle": {
      const callStrike = atm + 8;
      const putStrike = atm - 8;
      const callPrem = round(0.7 + rnd() * 0.5);
      const putPrem = round(0.7 + rnd() * 0.5);
      const credit = round(callPrem + putPrem);
      return {
        legs: [
          { action: "sell", right: "put", strike: putStrike, expiry, premium: putPrem },
          { action: "sell", right: "call", strike: callStrike, expiry, premium: callPrem },
        ],
        debit: 0,
        credit,
        maxGain: credit,
        maxLoss: Infinity,
        breakevens: [round(putStrike - credit), round(callStrike + credit)],
      };
    }
  }
}

const THESES: Record<Strategy, string[]> = {
  bull_call_spread: [
    "Holding 20D above 50D MA with momentum expansion; call volume at the money is 2.4x the 30-day average.",
    "Clean breakout above prior range with follow-through volume; dealer positioning suggests positive gamma overhead.",
  ],
  bear_put_spread: [
    "Lost 200D MA on rising volume; put/call ratio elevated at 1.4, suggesting institutional hedging.",
    "Rejected at overhead supply; momentum divergence on daily chart, weak sector breadth.",
  ],
  iron_condor: [
    "Expected move ±$2.10; condor wings sit outside 1σ. Dealer gamma pinning likely to contain range.",
    "Low realized vol vs implied; underlying trading in tight consolidation with no macro catalyst scheduled.",
  ],
  credit_put_spread: [
    "Support confluence at short strike (prior swing low + 50D MA); IV rank 58, good premium.",
    "Oversold bounce setup with RSI turning up from 28; short strike below expected move.",
  ],
  credit_call_spread: [
    "Resistance at short strike (double top + declining 20D); bearish flag breakdown.",
    "Overbought with momentum exhaustion; unusual put activity suggests informed hedging.",
  ],
  long_straddle: [
    "Earnings after close; implied move 7.8%, but avg realized move last 4 quarters is 9.2%.",
    "IV term structure inverted ahead of binary event; long vol cheaper than historical average.",
  ],
  long_strangle: [
    "Tight range compression on declining volume; Bollinger squeeze suggests breakout imminent.",
    "Macro catalyst window with broad market IV compression offering cheap convexity.",
  ],
  short_strangle: [
    "High IV rank with no event risk in expiry window; expected move sits within prior consolidation range.",
    "Post-earnings IV crush opportunity with strong support and resistance levels as anchors.",
  ],
};

const CATALYSTS_BY_CATEGORY: Record<Category, string[][]> = {
  directional: [
    ["Earnings next Tuesday", "Sector ETF breaking out", "Analyst day scheduled"],
    ["Product launch this week", "Competitor guidance weak", "Technical breakout confirmed"],
    ["No major catalysts this week"],
  ],
  income: [
    ["No earnings in expiry window", "Low realized vol regime", "Dealer gamma pinning"],
    ["Post-earnings IV crush", "Range-bound consolidation", "Sector rotation neutral"],
  ],
  volatility: [
    ["Earnings after close today", "Historical move exceeds implied"],
    ["FOMC minutes Wednesday", "CPI release Thursday", "Term structure inverted"],
    ["Binary event next week", "Options chain pricing complacency"],
  ],
};

const STRATEGY_CATEGORY: Record<Strategy, Category> = {
  bull_call_spread: "directional",
  bear_put_spread: "directional",
  iron_condor: "income",
  credit_put_spread: "income",
  credit_call_spread: "income",
  long_straddle: "volatility",
  long_strangle: "volatility",
  short_strangle: "income",
};

export async function generateSignals(date: Date = new Date(), forceRefresh = false): Promise<Signal[]> {
  const rnd = seededRandom(dateSeed(date));
  const numSignals = 5 + Math.floor(rnd() * 3);

  const strategies: Strategy[] = [
    "bull_call_spread",
    "bear_put_spread",
    "iron_condor",
    "credit_put_spread",
    "credit_call_spread",
    "long_straddle",
    "long_strangle",
    "short_strangle",
  ];

  const universe = await getUniverse(forceRefresh);
  const picks: Signal[] = [];
  const usedTickers = new Set<string>();

  for (let i = 0; i < numSignals; i++) {
    const available = universe.filter((u) => !usedTickers.has(u.ticker));
    if (!available.length) break;

    const underlying = pick(available, rnd);
    usedTickers.add(underlying.ticker);

    const strategy = pick(strategies, rnd);
    const category = STRATEGY_CATEGORY[strategy];
    const horizon: Horizon =
      category === "income" && rnd() < 0.4 ? "0dte" : rnd() < 0.6 ? "weekly" : "monthly";

    const expiry = expiryDates(date, horizon);
    const { legs, debit, credit, maxGain, maxLoss, breakevens } = buildLegs(
      strategy,
      underlying.price,
      expiry,
      rnd
    );

    const convictionScore = round(0.5 + rnd() * 0.5, 2);
    const conviction: Conviction =
      convictionScore > 0.8 ? "high" : convictionScore > 0.65 ? "medium" : "low";

    const pop =
      category === "income"
        ? round(0.6 + rnd() * 0.2, 2)
        : category === "volatility"
          ? round(0.45 + rnd() * 0.15, 2)
          : round(0.38 + rnd() * 0.12, 2);

    const expectedMove = round(underlying.price * (0.015 + rnd() * 0.04));

    picks.push({
      id: `sig_${dateSeed(date)}_${i}`,
      generatedAt: new Date(date.getTime()).toISOString(),
      ticker: underlying.ticker,
      underlyingPrice: underlying.price,
      category,
      strategy,
      horizon,
      conviction,
      convictionScore,
      legs,
      netDebit: debit,
      netCredit: credit,
      maxGain,
      maxLoss,
      breakevens,
      probabilityOfProfit: pop,
      thesis: pick(THESES[strategy], rnd),
      catalysts: pick(CATALYSTS_BY_CATEGORY[category], rnd),
      ivRank: underlying.ivRank + Math.floor(rnd() * 10 - 5),
      expectedMove,
      status: "active",
      closedAt: null,
      realizedPnl: null,
    });
  }

  picks.sort((a, b) => b.convictionScore - a.convictionScore);
  return picks;
}

export function generateRegime(date: Date = new Date()): MarketRegime {
  const rnd = seededRandom(dateSeed(date) + 1);
  const regimes: MarketRegime["regime"][] = [
    "low_vol_grind",
    "high_vol_chop",
    "trend_up",
    "trend_down",
    "mean_revert",
  ];
  return {
    date: date.toISOString().slice(0, 10),
    spxChange: round((rnd() - 0.45) * 1.8, 2),
    vix: round(12 + rnd() * 10, 1),
    vixChange: round((rnd() - 0.5) * 2, 2),
    skew0dte: pick(["put_heavy", "balanced", "call_heavy"] as const, rnd),
    regime: pick(regimes, rnd),
    earningsToday: rnd() > 0.3 ? ["TSLA", "GM", "NFLX"].slice(0, 1 + Math.floor(rnd() * 3)) : [],
    macroEvents: rnd() > 0.5 ? ["FOMC minutes 2pm", "Jobless claims 830am"].slice(0, 1) : [],
  };
}

export function generateBacktests(): BacktestStat[] {
  const strategies: Strategy[] = [
    "bull_call_spread",
    "bear_put_spread",
    "iron_condor",
    "credit_put_spread",
    "credit_call_spread",
    "long_straddle",
    "long_strangle",
    "short_strangle",
  ];
  const rnd = seededRandom(42);
  return strategies.map((strategy) => {
    const category = STRATEGY_CATEGORY[strategy];
    const isIncome = category === "income";
    const winRate = isIncome ? 0.62 + rnd() * 0.15 : 0.42 + rnd() * 0.15;
    const avgWin = isIncome ? 0.45 + rnd() * 0.3 : 1.4 + rnd() * 1.2;
    const avgLoss = isIncome ? -(1.1 + rnd() * 0.5) : -(0.8 + rnd() * 0.3);
    const expectancy = round(winRate * avgWin + (1 - winRate) * avgLoss, 3);
    return {
      strategy,
      category,
      sampleSize: 80 + Math.floor(rnd() * 200),
      winRate: round(winRate, 3),
      avgWin: round(avgWin, 2),
      avgLoss: round(avgLoss, 2),
      expectancy,
      sharpe: round(0.4 + rnd() * 1.2, 2),
      maxDrawdown: round(-(0.12 + rnd() * 0.18), 3),
      lastUpdated: new Date().toISOString(),
    };
  });
}

export function generateTrades(signals: Signal[]): Trade[] {
  const rnd = seededRandom(dateSeed(new Date()) + 7);
  const past = signals.slice(0, 3).map((s, i): Trade => {
    const isClosed = i < 2;
    const entryPrice = s.netDebit > 0 ? s.netDebit : s.netCredit;
    const exitMult = rnd() > 0.45 ? 1.4 + rnd() * 0.6 : 0.3 + rnd() * 0.4;
    const exitPrice = round(entryPrice * exitMult);
    const pnl =
      s.netDebit > 0 ? round((exitPrice - entryPrice) * 100) : round((entryPrice - exitPrice) * 100);
    return {
      id: `trd_${s.id}`,
      signalId: s.id,
      ticker: s.ticker,
      strategy: s.strategy,
      entryAt: s.generatedAt,
      entryPrice,
      contracts: 1 + Math.floor(rnd() * 3),
      mode: "paper",
      exitAt: isClosed ? new Date().toISOString() : null,
      exitPrice: isClosed ? exitPrice : null,
      pnl: isClosed ? pnl : null,
      notes: isClosed ? "Closed at target" : "Open position",
    };
  });
  return past;
}
