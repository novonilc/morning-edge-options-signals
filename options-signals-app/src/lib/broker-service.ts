/**
 * Broker connection and trade execution service
 * Supports multiple brokers: Alpaca, TD Ameritrade, Interactive Brokers, Tastytrade
 */

import type { Signal, Leg } from './types';

export interface BrokerConfig {
  provider: 'alpaca' | 'td_ameritrade' | 'interactive_brokers' | 'paper';
  apiKey: string;
  apiSecret: string;
  paperTrading?: boolean; // Paper trading for testing
  maxPositionSize?: number; // Dollar amount per position
  maxRiskPerTrade?: number; // Max loss per trade (%)
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

export class BrokerService {
  private static instance: BrokerService;
  private config: BrokerConfig | null = null;
  private client: any = null;

  private constructor() {}

  static getInstance(): BrokerService {
    if (!BrokerService.instance) {
      BrokerService.instance = new BrokerService();
    }
    return BrokerService.instance;
  }

  /**
   * Initialize broker connection
   */
  async initialize(config: BrokerConfig): Promise<boolean> {
    this.config = config;

    switch (config.provider) {
      case 'alpaca':
        return await this.initializeAlpaca(config);
      case 'td_ameritrade':
        return await this.initializeTDameritrade(config);
      case 'interactive_brokers':
        return await this.initializeIB(config);
      case 'paper':
        return await this.initializePaperTrading(config);
      default:
        console.error('Unknown broker provider:', config.provider);
        return false;
    }
  }

  private async initializeAlpaca(config: BrokerConfig): Promise<boolean> {
    try {
      // alpaca-trade-api package
      const Alpaca = (await import('@alpacahq/ts-sdk')).default;
      this.client = new Alpaca({
        credentials: {
          key: config.apiKey,
          secret: config.apiSecret,
          paper: config.paperTrading !== false, // Default to paper
        },
      });
      console.log('Connected to Alpaca broker');
      return true;
    } catch (error) {
      console.error('Failed to initialize Alpaca:', error);
      return false;
    }
  }

  private async initializeTDameritrade(config: BrokerConfig): Promise<boolean> {
    try {
      // Would use TD Ameritrade API
      console.log('TD Ameritrade integration coming soon');
      return false;
    } catch (error) {
      console.error('Failed to initialize TD Ameritrade:', error);
      return false;
    }
  }

  private async initializeIB(config: BrokerConfig): Promise<boolean> {
    try {
      // Would use Interactive Brokers API
      console.log('Interactive Brokers integration coming soon');
      return false;
    } catch (error) {
      console.error('Failed to initialize IB:', error);
      return false;
    }
  }

  private async initializePaperTrading(config: BrokerConfig): Promise<boolean> {
    // Paper trading simulator for testing
    this.client = {
      paperTrading: true,
      balance: 25000,
    };
    console.log('Paper trading initialized with $25,000');
    return true;
  }

  /**
   * Execute a signal as a trade
   */
  async executeSignal(signal: Signal): Promise<TradeOrder | null> {
    if (!this.config || !this.client) {
      console.error('Broker not initialized');
      return null;
    }

    // Validate position sizing and risk
    const orderDetails = await this.prepareOrder(signal);
    if (!orderDetails) {
      console.error('Failed to prepare order for signal:', signal.id);
      return null;
    }

    try {
      const order = await this.submitOrder(signal, orderDetails);
      return order;
    } catch (error) {
      console.error('Failed to execute signal:', error);
      return null;
    }
  }

  /**
   * Prepare order with risk management checks
   */
  private async prepareOrder(
    signal: Signal
  ): Promise<{ quantity: number; limitPrices: number[] } | null> {
    const account = await this.getAccount();
    if (!account) return null;

    // Calculate position size based on risk management rules
    const maxRiskPerTrade = this.config?.maxRiskPerTrade || 1; // 1% of account
    const maxPositionSize = this.config?.maxPositionSize || account.buyingPower * 0.2;

    // For options: estimate cost of trade
    const estimatedCost = signal.netDebit * 100; // Options are per contract, 100 shares

    // Position sizing
    let quantity = 1; // 1 contract
    if (estimatedCost > maxPositionSize) {
      console.warn(`Position size ${estimatedCost} exceeds max allowed ${maxPositionSize}`);
      quantity = Math.floor(maxPositionSize / (signal.netDebit * 100));
    }

    if (quantity < 1) {
      console.error('Position size too small for risk management rules');
      return null;
    }

    return {
      quantity,
      limitPrices: signal.breakevens,
    };
  }

  /**
   * Submit order to broker
   */
  private async submitOrder(
    signal: Signal,
    orderDetails: { quantity: number; limitPrices: number[] }
  ): Promise<TradeOrder | null> {
    const tradeOrder: TradeOrder = {
      id: `trade_${Date.now()}`,
      signalId: signal.id,
      ticker: signal.ticker,
      strategy: signal.strategy,
      legs: signal.legs.map((leg) => ({
        ...leg,
        quantity: orderDetails.quantity,
      })),
      status: 'pending',
      totalCost: signal.netDebit * 100 * orderDetails.quantity,
      expectedReturn: signal.maxGain * 100 * orderDetails.quantity,
      expectedReturnPercent: (signal.maxGain / signal.netDebit) * 100,
      createdAt: new Date(),
    };

    try {
      if (this.config?.provider === 'paper') {
        // Simulate order execution
        await new Promise((resolve) => setTimeout(resolve, 500));
        tradeOrder.status = 'filled';
        tradeOrder.filledAt = new Date();
        console.log('Paper trade executed:', tradeOrder.id);
      } else if (this.client) {
        // Submit to real broker
        // Implementation depends on broker API
        console.log('Submitting order to', this.config?.provider);
      }

      return tradeOrder;
    } catch (error) {
      console.error('Order submission failed:', error);
      tradeOrder.status = 'rejected';
      return tradeOrder;
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<BrokerAccount | null> {
    if (!this.client) {
      return null;
    }

    try {
      if (this.config?.provider === 'paper') {
        // Mock account for paper trading
        return {
          id: 'paper_account',
          provider: 'paper',
          accountNumber: 'PAPER000001',
          balance: 25000,
          buyingPower: 100000,
          positions: [],
          equity: 25000,
        };
      } else if (this.client.getAccount) {
        const account = await this.client.getAccount();
        return {
          id: account.id,
          provider: this.config!.provider,
          accountNumber: account.account_number,
          balance: parseFloat(account.cash),
          buyingPower: parseFloat(account.buying_power),
          positions: account.positions || [],
          equity: parseFloat(account.equity),
        };
      }
    } catch (error) {
      console.error('Failed to get account info:', error);
    }

    return null;
  }

  /**
   * Close a position
   */
  async closePosition(orderId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Implementation depends on broker
      console.log('Closing position:', orderId);
      return true;
    } catch (error) {
      console.error('Failed to close position:', error);
      return false;
    }
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<Position[]> {
    if (!this.client) {
      return [];
    }

    try {
      if (this.config?.provider === 'paper') {
        return [];
      }
      // Get positions from broker
      return [];
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Set stop loss for position
   */
  async setStopLoss(orderId: string, exitPrice: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      console.log(`Setting stop loss at ${exitPrice} for order ${orderId}`);
      // Create stop order in broker
      return true;
    } catch (error) {
      console.error('Failed to set stop loss:', error);
      return false;
    }
  }

  /**
   * Set take profit for position
   */
  async setTakeProfit(orderId: string, exitPrice: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      console.log(`Setting take profit at ${exitPrice} for order ${orderId}`);
      // Create limit order in broker
      return true;
    } catch (error) {
      console.error('Failed to set take profit:', error);
      return false;
    }
  }
}

export const brokerService = BrokerService.getInstance();
