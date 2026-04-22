export type Strategy =
  | "bull_call_spread"
  | "bear_put_spread"
  | "iron_condor"
  | "credit_put_spread"
  | "credit_call_spread"
  | "long_straddle"
  | "long_strangle"
  | "short_strangle";

export type Category = "directional" | "income" | "volatility";

export type Horizon = "0dte" | "weekly" | "monthly";

export type Conviction = "low" | "medium" | "high";

export type SignalStatus = "active" | "hit" | "missed" | "stopped" | "expired";

export type Leg = {
  action: "buy" | "sell";
  right: "call" | "put";
  strike: number;
  expiry: string;
  premium: number;
};

export type Signal = {
  id: string;
  generatedAt: string;
  ticker: string;
  symbol?: string; // Alias for ticker for compatibility
  underlyingPrice: number;
  category: Category;
  strategy: Strategy;
  horizon: Horizon;
  conviction: Conviction;
  convictionScore: number;
  confidence?: number; // Alias for convictionScore
  type?: "BULLISH" | "BEARISH"; // Directional bias
  legs: Leg[];
  netDebit: number;
  netCredit: number;
  maxGain: number;
  maxLoss: number;
  maxProfit?: number; // Alias for maxGain
  maxReward?: number; // Alias for maxGain
  breakevens: number[];
  probabilityOfProfit: number;
  thesis: string;
  catalysts: string[];
  ivRank: number;
  expectedMove: number;
  status: SignalStatus;
  closedAt: string | null;
  realizedPnl: number | null;
};

export type Trade = {
  id: string;
  signalId: string;
  ticker: string;
  strategy: Strategy;
  entryAt: string;
  entryPrice: number;
  contracts: number;
  mode: "paper" | "live";
  exitAt: string | null;
  exitPrice: number | null;
  pnl: number | null;
  notes: string;
};

export type BacktestStat = {
  strategy: Strategy;
  category: Category;
  sampleSize: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  sharpe: number;
  maxDrawdown: number;
  lastUpdated: string;
};

export type MarketRegime = {
  date: string;
  spxChange: number;
  vix: number;
  vixChange: number;
  skew0dte: "put_heavy" | "balanced" | "call_heavy";
  regime: "low_vol_grind" | "high_vol_chop" | "trend_up" | "trend_down" | "mean_revert";
  earningsToday: string[];
  macroEvents: string[];
};
