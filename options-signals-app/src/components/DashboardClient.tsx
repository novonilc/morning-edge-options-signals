'use client';

import { useState } from 'react';
import { SignalCard } from './SignalCard';
import { ExecuteTradeModal } from './ExecuteTradeModal';
import type { Signal } from '@/lib/types';

export function DashboardClient({ signals }: { signals: Signal[] }) {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExecuteTrade = (signal: Signal) => {
    setSelectedSignal(signal);
    setIsModalOpen(true);
  };

  const handleConfirmExecution = async (signal: Signal) => {
    try {
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: 'success',
          text: `✓ Trade executed! Order ID: ${result.tradeId}`,
        });
        setIsModalOpen(false);
        setSelectedSignal(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: `✗ Execution failed: ${error.error}`,
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <>
      <div className="mt-6 grid gap-4">
        {signals.map((s, i) => (
          <SignalCard
            key={s.id}
            signal={s}
            rank={i + 1}
            onExecute={handleExecuteTrade}
          />
        ))}
      </div>

      {message && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      <ExecuteTradeModal
        signal={selectedSignal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSignal(null);
        }}
        onExecute={handleConfirmExecution}
      />
    </>
  );
}
