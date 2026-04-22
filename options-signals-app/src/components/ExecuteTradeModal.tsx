'use client';

import { useState, useEffect } from 'react';
import type { Signal } from '@/lib/types';

interface ExecuteTradeModalProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (signal: Signal) => Promise<void>;
}

interface AccountInfo {
  equity: number;
  cash: number;
  buyingPower: number;
}

interface PositionSize {
  quantity: number;
  estimatedCost: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  isAllowed: boolean;
  reason?: string;
}

export function ExecuteTradeModal({ signal, isOpen, onClose, onExecute }: ExecuteTradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [positionSize, setPositionSize] = useState<PositionSize | null>(null);

  useEffect(() => {
    if (isOpen && signal) {
      loadAccountInfo();
    }
  }, [isOpen, signal]);

  const loadAccountInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trading?account');
      if (!response.ok) {
        throw new Error('Failed to load account info');
      }

      const account = await response.json();
      setAccount(account);

      // Calculate position size
      const entryPrice = signal.underlyingPrice;
      const stopLoss = signal.breakevens[0] || entryPrice * 0.95;
      const risk = entryPrice - stopLoss;
      const maxRisk = account.equity * 0.01; // 1% risk per trade
      const quantity = Math.floor(maxRisk / risk);

      const positionSize: PositionSize = {
        quantity,
        estimatedCost: quantity * entryPrice,
        riskAmount: maxRisk,
        rewardAmount: (signal.maxProfit ?? signal.maxGain ?? 0) * quantity,
        riskRewardRatio: ((signal.maxProfit ?? signal.maxGain ?? 0) * quantity) / maxRisk || 1,
        isAllowed: quantity > 0 && maxRisk < account.equity * 0.1,
      };

      setPositionSize(positionSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!signal || !positionSize?.isAllowed) return;

    try {
      setExecuting(true);
      setError(null);
      await onExecute(signal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade execution failed');
      setExecuting(false); // Keep modal open on error
    }
  };

  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Execute Trade
        </h2>

        {/* Signal Details */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Underlying</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {signal.symbol || signal.ticker}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Price</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ${signal.underlyingPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Direction</p>
              <p className={`font-semibold ${
                signal.type === 'BULLISH' ? 'text-green-600' : 'text-red-600'
              }`}>
                {signal.type || (signal.maxGain > 0 ? 'BULLISH' : 'BEARISH')}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Confidence</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {((signal.confidence ?? signal.convictionScore) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Account & Position Info */}
        {loading ? (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading account info...</p>
          </div>
        ) : error ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : account && positionSize ? (
          <>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Account Equity</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${account.equity.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Available Cash</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${account.cash.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Position Size</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {positionSize.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Est. Cost</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${positionSize.estimatedCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Risk/Trade</p>
                  <p className="text-lg font-bold text-red-600">
                    ${positionSize.riskAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Reward/Trade</p>
                  <p className="text-lg font-bold text-green-600">
                    ${positionSize.rewardAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-600 dark:text-gray-400">Risk/Reward Ratio</p>
                <p className="text-lg font-bold text-blue-600">
                  1:{positionSize.riskRewardRatio.toFixed(2)}
                </p>
              </div>
            </div>

            {!positionSize.isAllowed && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ {positionSize.reason || 'Trade does not meet risk management rules'}
                </p>
              </div>
            )}
          </>
        ) : null}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={executing}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={executing || !positionSize?.isAllowed}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? 'Executing...' : 'Execute Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
