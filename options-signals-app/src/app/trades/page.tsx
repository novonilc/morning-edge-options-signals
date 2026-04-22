'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openTime: string;
}

interface Trade {
  id: string;
  symbol: string;
  type: 'BULLISH' | 'BEARISH';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'OPEN' | 'CLOSED';
  openTime: string;
  closeTime?: string;
}

interface JournalStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  monthlyPnl: number;
}

export default function TradesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('all');

  useEffect(() => {
    loadTradeData();
    const interval = setInterval(loadTradeData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadTradeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load positions
      const positionsResponse = await fetch('/api/trading?positions');
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData.positions || []);
      }

      // Load journal
      const journalResponse = await fetch('/api/trading?journal');
      if (journalResponse.ok) {
        const journalData = await journalResponse.json();
        setTrades(journalData.trades || []);
        setStats(journalData.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade data');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (tradeId: string, exitPrice: number) => {
    try {
      const response = await fetch('/api/trading/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, exitPrice }),
      });

      if (response.ok) {
        loadTradeData();
      } else {
        setError('Failed to close position');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error closing position');
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'open') return trade.status === 'OPEN';
    if (filter === 'closed') return trade.status === 'CLOSED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          View Signals
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalTrades}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(stats.winRate * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit Factor</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.profitFactor.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${
              stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${stats.totalPnl.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly P&L</p>
            <p className={`text-2xl font-bold ${
              stats.monthlyPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${stats.monthlyPnl.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Open Positions ({positions.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    P&L
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {pos.symbol}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {pos.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ${pos.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ${pos.currentPrice.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${
                      pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleClosePosition(pos.id, pos.currentPrice)}
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Trade History
            </h2>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'closed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            Loading trade history...
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No trades found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    P&L
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'BULLISH'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {trade.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ${trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 font-medium ${
                      trade.pnl && trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'OPEN'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
