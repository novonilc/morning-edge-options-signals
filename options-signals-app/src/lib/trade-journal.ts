/**
 * Real-time P&L tracker and trade journal
 * Tracks every trade and calculates actual profits/losses
 */

import type { Signal } from './types';

export interface Trade {
  id: string;
  signalId: string;
  ticker: string;
  strategy: string;
  entryDate: Date;
  exitDate?: Date;
  status: 'open' | 'closed' | 'expired';
  
  // Entry details
  entryPrice: number;
  quantity: number;
  entryFees: number;
  
  // Exit details
  exitPrice?: number;
  exitFees?: number;
  
  // P&L
  grossPnL?: number;
  netPnL?: number;
  pnlPercent?: number;
  
  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  maxDrawdown?: number;
  
  // Notes
  notes?: string;
}

export interface TradeJournal {
  userId: string;
  trades: Trade[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossPnL: number;
  netPnL: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  profitFactor: number; // Gross Profit / Gross Loss
  averageRR: number; // Average Risk-Reward ratio
}

export class TradeJournalService {
  private static instance: TradeJournalService;
  private trades: Map<string, Trade[]> = new Map();

  private constructor() {}

  static getInstance(): TradeJournalService {
    if (!TradeJournalService.instance) {
      TradeJournalService.instance = new TradeJournalService();
    }
    return TradeJournalService.instance;
  }

  /**
   * Log a new trade
   */
  logTrade(userId: string, trade: Trade): void {
    if (!this.trades.has(userId)) {
      this.trades.set(userId, []);
    }
    this.trades.get(userId)!.push(trade);
  }

  /**
   * Close a trade
   */
  closeTrade(userId: string, tradeId: string, exitPrice: number, exitFees: number = 0): Trade | null {
    const userTrades = this.trades.get(userId);
    if (!userTrades) return null;

    const trade = userTrades.find((t) => t.id === tradeId);
    if (!trade) return null;

    trade.exitPrice = exitPrice;
    trade.exitFees = exitFees;
    trade.exitDate = new Date();
    trade.status = 'closed';

    // Calculate P&L
    const grossPnL = (exitPrice - trade.entryPrice) * trade.quantity;
    trade.grossPnL = grossPnL;
    trade.netPnL = grossPnL - trade.entryFees - exitFees;
    trade.pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;

    return trade;
  }

  /**
   * Get journal statistics
   */
  getJournal(userId: string): TradeJournal {
    const userTrades = this.trades.get(userId) || [];
    const closedTrades = userTrades.filter((t) => t.status === 'closed');

    const winningTrades = closedTrades.filter((t) => (t.netPnL || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.netPnL || 0) < 0);

    const grossPnL = closedTrades.reduce((sum, t) => sum + (t.grossPnL || 0), 0);
    const netPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    const winAmounts = winningTrades.map((t) => t.netPnL || 0);
    const lossAmounts = losingTrades.map((t) => t.netPnL || 0);

    const totalWins = winAmounts.reduce((sum, a) => sum + a, 0);
    const totalLosses = Math.abs(lossAmounts.reduce((sum, a) => sum + a, 0));

    return {
      userId,
      trades: userTrades,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      grossPnL,
      netPnL,
      averageWin: winAmounts.length > 0 ? totalWins / winAmounts.length : 0,
      averageLoss: lossAmounts.length > 0 ? totalLosses / lossAmounts.length : 0,
      bestTrade: Math.max(...winAmounts, 0),
      worstTrade: Math.min(...lossAmounts, 0),
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      averageRR: this.calculateAverageRR(userTrades),
    };
  }

  private calculateAverageRR(trades: Trade[]): number {
    const tradesWithRR = trades.filter((t) => t.stopLoss && t.takeProfit);
    if (tradesWithRR.length === 0) return 0;

    const rrs = tradesWithRR.map((t) => {
      const risk = Math.abs((t.stopLoss || 0) - t.entryPrice);
      const reward = Math.abs((t.takeProfit || 0) - t.entryPrice);
      return risk > 0 ? reward / risk : 0;
    });

    return rrs.reduce((sum, rr) => sum + rr, 0) / rrs.length;
  }

  /**
   * Get monthly P&L
   */
  getMonthlySummary(userId: string, month: number, year: number): { month: string; pnl: number } {
    const userTrades = this.trades.get(userId) || [];
    const monthTrades = userTrades.filter((t) => {
      const tradeMonth = t.entryDate.getMonth();
      const tradeYear = t.entryDate.getFullYear();
      return tradeMonth === month && tradeYear === year;
    });

    const pnl = monthTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    return {
      month: new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      pnl,
    };
  }

  /**
   * Get strategy performance
   */
  getStrategyStats(userId: string, strategy: string) {
    const userTrades = this.trades.get(userId) || [];
    const strategyTrades = userTrades.filter((t) => t.strategy === strategy && t.status === 'closed');

    if (strategyTrades.length === 0) {
      return null;
    }

    const winningTrades = strategyTrades.filter((t) => (t.netPnL || 0) > 0);
    const grossPnL = strategyTrades.reduce((sum, t) => sum + (t.grossPnL || 0), 0);
    const netPnL = strategyTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    return {
      strategy,
      totalTrades: strategyTrades.length,
      winRate: (winningTrades.length / strategyTrades.length) * 100,
      grossPnL,
      netPnL,
      averagePnL: netPnL / strategyTrades.length,
    };
  }
}

export const tradeJournalService = TradeJournalService.getInstance();
