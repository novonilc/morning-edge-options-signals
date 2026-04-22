/**
 * Risk management rules for trading
 * Ensures every trade follows position sizing, stop loss, and other rules
 */

export interface RiskRules {
  maxPositionSizePercent: number; // Max % of account per trade (default: 2%)
  maxAccountRiskPercent: number; // Max % of account to risk per trade (default: 1%)
  minRiskRewardRatio: number; // Minimum RR ratio to take trade (default: 1.5:1)
  maxOpenPositions: number; // Max concurrent trades (default: 5)
  maxLossPerDay: number; // Max daily loss in dollars (default: unlimited)
  requireStopLoss: boolean; // Must have stop loss (default: true)
  requireTakeProfit: boolean; // Must have take profit (default: true)
}

export interface PositionSizing {
  quantity: number;
  cost: number;
  riskAmount: number;
  maxRiskPercent: number;
  isAllowed: boolean;
  reason?: string;
}

export class RiskManagementService {
  private static instance: RiskManagementService;
  private rules: RiskRules = {
    maxPositionSizePercent: 2,
    maxAccountRiskPercent: 1,
    minRiskRewardRatio: 1.5,
    maxOpenPositions: 5,
    maxLossPerDay: 0,
    requireStopLoss: true,
    requireTakeProfit: true,
  };

  private constructor() {}

  static getInstance(): RiskManagementService {
    if (!RiskManagementService.instance) {
      RiskManagementService.instance = new RiskManagementService();
    }
    return RiskManagementService.instance;
  }

  /**
   * Update risk rules
   */
  setRules(rules: Partial<RiskRules>): void {
    this.rules = { ...this.rules, ...rules };
    console.log('Risk rules updated:', this.rules);
  }

  /**
   * Calculate optimal position size
   */
  calculatePositionSize(
    accountBalance: number,
    entryPrice: number,
    stopLoss: number,
    currentOpenPositions: number
  ): PositionSizing {
    const baseResponse: PositionSizing = {
      quantity: 0,
      cost: 0,
      riskAmount: 0,
      maxRiskPercent: 0,
      isAllowed: true,
    };

    // Check max open positions
    if (currentOpenPositions >= this.rules.maxOpenPositions) {
      return {
        ...baseResponse,
        isAllowed: false,
        reason: `Max open positions reached (${this.rules.maxOpenPositions})`,
      };
    }

    // Max position size as % of account
    const maxPositionCost = accountBalance * (this.rules.maxPositionSizePercent / 100);

    // Max risk based on account balance
    const maxAccountRisk = accountBalance * (this.rules.maxAccountRiskPercent / 100);

    // Risk per share/contract
    const riskPerContract = Math.abs(entryPrice - stopLoss);

    // Position size based on risk
    const riskBasedQuantity = Math.floor(maxAccountRisk / riskPerContract);

    // Position size based on max % of account
    const sizeBasedQuantity = Math.floor(maxPositionCost / entryPrice);

    // Use the smaller of the two
    const quantity = Math.min(riskBasedQuantity, sizeBasedQuantity);

    if (quantity < 1) {
      return {
        ...baseResponse,
        quantity: 0,
        isAllowed: false,
        reason: 'Position size too small given risk management rules',
      };
    }

    const cost = quantity * entryPrice;
    const riskAmount = quantity * riskPerContract;
    const maxRiskPercent = (riskAmount / accountBalance) * 100;

    return {
      quantity,
      cost,
      riskAmount,
      maxRiskPercent,
      isAllowed: true,
    };
  }

  /**
   * Validate a trade setup
   */
  validateTrade(
    entryPrice: number,
    stopLoss: number | undefined,
    takeProfit: number | undefined,
    position: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check stop loss
    if (this.rules.requireStopLoss && !stopLoss) {
      errors.push('Stop loss is required');
    }

    if (stopLoss && Math.abs(entryPrice - stopLoss) / entryPrice < 0.005) {
      errors.push('Stop loss too close to entry (minimum 0.5%)');
    }

    // Check take profit
    if (this.rules.requireTakeProfit && !takeProfit) {
      errors.push('Take profit is required');
    }

    // Check risk-reward ratio
    if (stopLoss && takeProfit) {
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
      const rrRatio = reward / risk;

      if (rrRatio < this.rules.minRiskRewardRatio) {
        errors.push(
          `Risk-reward ratio ${rrRatio.toFixed(2)}:1 is below minimum ${this.rules.minRiskRewardRatio}:1`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current risk level
   */
  getRiskStats(accountBalance: number, openPositions: Array<{ riskAmount: number }>): {
    totalAccountRisk: number;
    totalAccountRiskPercent: number;
    riskPerPosition: number;
    status: 'safe' | 'warning' | 'danger';
  } {
    const totalRisk = openPositions.reduce((sum, p) => sum + p.riskAmount, 0);
    const riskPercent = (totalRisk / accountBalance) * 100;
    const riskPerPosition = openPositions.length > 0 ? totalRisk / openPositions.length : 0;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (riskPercent > 10) {
      status = 'danger';
    } else if (riskPercent > 5) {
      status = 'warning';
    }

    return {
      totalAccountRisk: totalRisk,
      totalAccountRiskPercent: riskPercent,
      riskPerPosition,
      status,
    };
  }

  /**
   * Get risk rules
   */
  getRules(): RiskRules {
    return this.rules;
  }
}

export const riskManagementService = RiskManagementService.getInstance();
