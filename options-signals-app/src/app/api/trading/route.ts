/**
 * Trading API endpoint
 * Handles trade execution, position management, and journal
 * 
 * Endpoints:
 * POST /api/trading/execute - Execute a signal as a trade
 * GET /api/trading/account - Get account info
 * GET /api/trading/positions - Get open positions
 * POST /api/trading/close - Close a position
 * GET /api/trading/journal - Get trade journal
 * POST /api/trading/settings - Update trading settings
 */

import { NextResponse, NextRequest } from 'next/server';
import { brokerService } from '@/lib/broker-service';
import { tradeJournalService } from '@/lib/trade-journal';
import { riskManagementService } from '@/lib/risk-management';
import type { Signal } from '@/lib/types';

// Simulated user ID for demo (should come from session/auth)
const DEMO_USER_ID = 'user_demo_001';

// Trading settings (should be persisted per user)
const tradingSettings = {
  brokerProvider: process.env.BROKER_PROVIDER || 'paper',
  autoTrade: process.env.AUTO_TRADE === 'true',
  testMode: process.env.TEST_MODE !== 'false',
  maxPositionSize: 2000, // dollars
  maxRiskPerTrade: 1, // percent
};

export async function POST(request: NextRequest) {
  try {
    const path = new URL(request.url).pathname;

    if (path.includes('/execute')) {
      return await handleExecuteTrade(request);
    } else if (path.includes('/close')) {
      return await handleCloseTrade(request);
    } else if (path.includes('/settings')) {
      return await handleUpdateSettings(request);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Trading API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const path = new URL(request.url).pathname;
    const searchParams = new URL(request.url).searchParams;

    if (path.includes('/account')) {
      return await handleGetAccount(request);
    } else if (path.includes('/positions')) {
      return await handleGetPositions(request);
    } else if (path.includes('/journal')) {
      return await handleGetJournal(request);
    } else if (path.includes('/settings')) {
      return handleGetSettings();
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Trading API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Execute a signal as a trade
 */
async function handleExecuteTrade(request: NextRequest) {
  const body = await request.json();
  const { signal } = body as { signal: Signal };

  if (!signal) {
    return NextResponse.json({ error: 'Signal required' }, { status: 400 });
  }

  // Initialize broker if not already done
  if (!brokerService) {
    return NextResponse.json({ error: 'Broker not initialized' }, { status: 500 });
  }

  // In production, would initialize with real credentials
  const config = {
    provider: tradingSettings.brokerProvider as 'alpaca' | 'paper',
    apiKey: process.env.BROKER_API_KEY || '',
    apiSecret: process.env.BROKER_API_SECRET || '',
    paperTrading: tradingSettings.testMode,
  };

  await brokerService.initialize(config);

  // Get account for position sizing
  const account = await brokerService.getAccount();
  if (!account) {
    return NextResponse.json({ error: 'Could not get account info' }, { status: 500 });
  }

  // Calculate position size with risk management
  const positionSize = riskManagementService.calculatePositionSize(
    account.equity,
    signal.underlyingPrice,
    signal.breakevens[0] || signal.underlyingPrice * 0.95,
    0 // TODO: get actual open positions count
  );

  if (!positionSize.isAllowed) {
    return NextResponse.json(
      { error: positionSize.reason || 'Position not allowed' },
      { status: 400 }
    );
  }

  // Validate trade setup
  const validation = riskManagementService.validateTrade(
    signal.underlyingPrice,
    signal.breakevens[0],
    signal.maxGain,
    positionSize.quantity
  );

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Trade validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  // Execute the signal
  const tradeOrder = await brokerService.executeSignal(signal);

  if (!tradeOrder) {
    return NextResponse.json({ error: 'Failed to execute signal' }, { status: 500 });
  }

  return NextResponse.json(
    {
      success: true,
      tradeId: tradeOrder.id,
      order: tradeOrder,
      positionSize,
    },
    { status: 201 }
  );
}

/**
 * Close an open trade
 */
async function handleCloseTrade(request: NextRequest) {
  const body = await request.json();
  const { tradeId, exitPrice, exitFees } = body;

  if (!tradeId || exitPrice === undefined) {
    return NextResponse.json(
      { error: 'tradeId and exitPrice required' },
      { status: 400 }
    );
  }

  const closedTrade = tradeJournalService.closeTrade(DEMO_USER_ID, tradeId, exitPrice, exitFees || 0);

  if (!closedTrade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: true,
      trade: closedTrade,
    },
    { status: 200 }
  );
}

/**
 * Get account information
 */
async function handleGetAccount(request: NextRequest) {
  const config = {
    provider: tradingSettings.brokerProvider as 'alpaca' | 'paper',
    apiKey: process.env.BROKER_API_KEY || '',
    apiSecret: process.env.BROKER_API_SECRET || '',
    paperTrading: tradingSettings.testMode,
  };

  await brokerService.initialize(config);
  const account = await brokerService.getAccount();

  if (!account) {
    return NextResponse.json({ error: 'Could not get account info' }, { status: 500 });
  }

  return NextResponse.json(account, { status: 200 });
}

/**
 * Get open positions
 */
async function handleGetPositions(request: NextRequest) {
  const config = {
    provider: tradingSettings.brokerProvider as 'alpaca' | 'paper',
    apiKey: process.env.BROKER_API_KEY || '',
    apiSecret: process.env.BROKER_API_SECRET || '',
    paperTrading: tradingSettings.testMode,
  };

  await brokerService.initialize(config);
  const positions = await brokerService.getPositions();

  return NextResponse.json({ positions }, { status: 200 });
}

/**
 * Get trade journal and statistics
 */
async function handleGetJournal(request: NextRequest) {
  const journal = tradeJournalService.getJournal(DEMO_USER_ID);

  return NextResponse.json(journal, { status: 200 });
}

/**
 * Get trading settings
 */
function handleGetSettings() {
  return NextResponse.json(tradingSettings, { status: 200 });
}

/**
 * Update trading settings
 */
async function handleUpdateSettings(request: NextRequest) {
  const body = await request.json();

  // Merge with existing settings
  Object.assign(tradingSettings, body);

  return NextResponse.json(
    {
      success: true,
      settings: tradingSettings,
    },
    { status: 200 }
  );
}
