/**
 * Broker connection and trade execution service
 * Uses Alpaca REST API directly via fetch — no extra SDK package required.
 * Paper trading URL:  https://paper-api.alpaca.markets
 * Live trading URL:   https://api.alpaca.markets
 */

import type { Signal } from './types';

export interface BrokerConfig {
  provider: 'alpaca' | 'td_ameritrade' | 'interactive_brokers' | 'paper';
  apiKey: string;
  apiSecret: string;
  paperTrading?: boolean;
  maxPositionSize?: number;
  maxRiskPerTrade?: number;
}

export interface BrokerAccount {
  id: string;
  provider: string;
  accountNumber: string;
  balance: number;
  buyingPower: number;
  positions: Position[];
  equity: number;
}

export interface Position {
  ticker: string;
  quantity: number;
  avgFillPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface TradeOrder {
  id: string;
  signalId: string;
  ticker: string;
  strategy: string;
  legs: TradeOrderLeg[];
  status: 'pending' | 'filled' | 'partial' | 'canceled' | 'rejected';
  totalCost: number;
  expectedReturn: number;
  expectedReturnPercent: number;
  createdAt: Date;
  filledAt?: Date;
  closedAt?: Date;
  realizedPnL?: number;
}

export interface TradeOrderLeg {
  action: 'buy' | 'sell';
  right: 'call' | 'put';
  strike: number;
  expiry: string;
  quantity: number;
  limitPrice?: number;
  filledPrice?: number;
  filledQuantity?: number;
}

// ─── Alpaca REST client ────────────────────────────────────────────────────────

class AlpacaClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(apiKey: string, apiSecret: string, paper: boolean) {
    this.baseUrl = paper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';
    this.headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Alpaca API ${path} failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Alpaca API ${path} failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Alpaca API DELETE ${path} failed (${res.status}): ${text}`);
    }
  }
}

// ─── BrokerService ─────────────────────────────────────────────────────────────

export class BrokerService {
  private static instance: BrokerService;
  private config: BrokerConfig | null = null;
  private alpaca: AlpacaClient | null = null;

  private constructor() {}

  static getInstance(): BrokerService {
    if (!BrokerService.instance) {
      BrokerService.instance = new BrokerService();
    }
    return BrokerService.instance;
  }

  async initialize(config: BrokerConfig): Promise<boolean> {
    this.config = config;

    switch (config.provider) {
      case 'alpaca':
        return this.initializeAlpaca(config);
      case 'paper':
        return this.initializePaperTrading();
      default:
        console.error('Broker provider not yet supported:', config.provider);
        return false;
    }
  }

  private initializeAlpaca(config: BrokerConfig): boolean {
    if (!config.apiKey || !config.apiSecret) {
      console.error('Alpaca: BROKER_API_KEY and BROKER_API_SECRET are required');
      return false;
    }
    this.alpaca = new AlpacaClient(
      config.apiKey,
      config.apiSecret,
      config.paperTrading !== false, // default to paper
    );
    console.log(`Alpaca connected (${config.paperTrading !== false ? 'paper' : 'live'})`);
    return true;
  }

  private initializePaperTrading(): boolean {
    this.alpaca = null;
    console.log('Paper trading initialized with $25,000');
    return true;
  }

  // ─── Account ──────────────────────────────────────────────────────────────

  async getAccount(): Promise<BrokerAccount | null> {
    if (this.config?.provider === 'paper') {
      return {
        id: 'paper_account',
        provider: 'paper',
        accountNumber: 'PAPER000001',
        balance: 25000,
        buyingPower: 100000,
        positions: [],
        equity: 25000,
      };
    }

    if (!this.alpaca) return null;

    try {
      const raw = await this.alpaca.get<{
        id: string;
        account_number: string;
        cash: string;
        buying_power: string;
        equity: string;
      }>('/v2/account');

      const positions = await this.getPositions();

      return {
        id: raw.id,
        provider: 'alpaca',
        accountNumber: raw.account_number,
        balance: parseFloat(raw.cash),
        buyingPower: parseFloat(raw.buying_power),
        equity: parseFloat(raw.equity),
        positions,
      };
    } catch (error) {
      console.error('Failed to get Alpaca account:', error);
      return null;
    }
  }

  // ─── Positions ────────────────────────────────────────────────────────────

  async getPositions(): Promise<Position[]> {
    if (this.config?.provider === 'paper' || !this.alpaca) return [];

    try {
      const raw = await this.alpaca.get<
        {
          symbol: string;
          qty: string;
          avg_entry_price: string;
          current_price: string;
          unrealized_pl: string;
          unrealized_plpc: string;
        }[]
      >('/v2/positions');

      return raw.map((p) => ({
        ticker: p.symbol,
        quantity: parseFloat(p.qty),
        avgFillPrice: parseFloat(p.avg_entry_price),
        currentPrice: parseFloat(p.current_price),
        unrealizedPnL: parseFloat(p.unrealized_pl),
        unrealizedPnLPercent: parseFloat(p.unrealized_plpc) * 100,
      }));
    } catch (error) {
      console.error('Failed to get Alpaca positions:', error);
      return [];
    }
  }

  // ─── Close position ───────────────────────────────────────────────────────

  async closePosition(symbol: string): Promise<boolean> {
    if (this.config?.provider === 'paper') return true;
    if (!this.alpaca) return false;

    try {
      await this.alpaca.delete(`/v2/positions/${symbol}`);
      return true;
    } catch (error) {
      console.error('Failed to close Alpaca position:', error);
      return false;
    }
  }

  // ─── Execute signal ───────────────────────────────────────────────────────

  async executeSignal(signal: Signal): Promise<TradeOrder | null> {
    if (!this.config) {
      console.error('Broker not initialized');
      return null;
    }

    const orderDetails = await this.prepareOrder(signal);
    if (!orderDetails) return null;

    return this.submitOrder(signal, orderDetails);
  }

  private async prepareOrder(
    signal: Signal,
  ): Promise<{ quantity: number; limitPrices: number[] } | null> {
    const account = await this.getAccount();
    if (!account) return null;

    const maxPositionSize = this.config?.maxPositionSize ?? account.buyingPower * 0.2;
    const estimatedCost = signal.netDebit * 100;

    let quantity = 1;
    if (estimatedCost > maxPositionSize) {
      quantity = Math.floor(maxPositionSize / estimatedCost);
    }

    if (quantity < 1) {
      console.error('Position size too small for risk rules');
      return null;
    }

    return { quantity, limitPrices: signal.breakevens };
  }

  private async submitOrder(
    signal: Signal,
    orderDetails: { quantity: number; limitPrices: number[] },
  ): Promise<TradeOrder | null> {
    const tradeOrder: TradeOrder = {
      id: `trade_${Date.now()}`,
      signalId: signal.id,
      ticker: signal.ticker,
      strategy: signal.strategy,
      legs: signal.legs.map((leg) => ({ ...leg, quantity: orderDetails.quantity })),
      status: 'pending',
      totalCost: signal.netDebit * 100 * orderDetails.quantity,
      expectedReturn: signal.maxGain * 100 * orderDetails.quantity,
      expectedReturnPercent: (signal.maxGain / signal.netDebit) * 100,
      createdAt: new Date(),
    };

    try {
      if (this.config?.provider === 'paper' || !this.alpaca) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        tradeOrder.status = 'filled';
        tradeOrder.filledAt = new Date();
        console.log('Paper trade executed:', tradeOrder.id);
      } else {
        // Alpaca equity order for the underlying (options orders require Alpaca Options access)
        await this.alpaca.post('/v2/orders', {
          symbol: signal.ticker,
          qty: orderDetails.quantity,
          side: 'buy',
          type: 'limit',
          time_in_force: 'day',
          limit_price: signal.netDebit.toFixed(2),
        });
        tradeOrder.status = 'pending';
        console.log('Alpaca order submitted for', signal.ticker);
      }

      return tradeOrder;
    } catch (error) {
      console.error('Order submission failed:', error);
      tradeOrder.status = 'rejected';
      return tradeOrder;
    }
  }

  // ─── Stop loss / Take profit ──────────────────────────────────────────────

  async setStopLoss(symbol: string, stopPrice: number): Promise<boolean> {
    if (this.config?.provider === 'paper' || !this.alpaca) return true;

    try {
      await this.alpaca.post('/v2/orders', {
        symbol,
        qty: 1,
        side: 'sell',
        type: 'stop',
        time_in_force: 'gtc',
        stop_price: stopPrice.toFixed(2),
      });
      return true;
    } catch (error) {
      console.error('Failed to set stop loss:', error);
      return false;
    }
  }

  async setTakeProfit(symbol: string, limitPrice: number): Promise<boolean> {
    if (this.config?.provider === 'paper' || !this.alpaca) return true;

    try {
      await this.alpaca.post('/v2/orders', {
        symbol,
        qty: 1,
        side: 'sell',
        type: 'limit',
        time_in_force: 'gtc',
        limit_price: limitPrice.toFixed(2),
      });
      return true;
    } catch (error) {
      console.error('Failed to set take profit:', error);
      return false;
    }
  }
}

export const brokerService = BrokerService.getInstance();
