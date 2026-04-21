"use client";

import { useState } from "react";
import type { Signal } from "@/lib/types";
import {
  STRATEGY_LABEL,
  CATEGORY_LABEL,
  HORIZON_LABEL,
  CONVICTION_LABEL,
  formatUsd,
  formatPct,
  formatLegs,
} from "@/lib/format";

const CATEGORY_CLASS: Record<string, string> = {
  directional: "border-[color:var(--bull)] text-[color:var(--bull)]",
  income: "border-[color:var(--neutral)] text-[color:var(--neutral)]",
  volatility: "border-[color:var(--accent)] text-[color:var(--accent)]",
};

const CONVICTION_CLASS: Record<string, string> = {
  high: "text-[color:var(--bull)]",
  medium: "text-[color:var(--neutral)]",
  low: "text-[color:var(--ink-400)]",
};

export function SignalCard({ signal, rank }: { signal: Signal; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [papered, setPapered] = useState(false);

  const isDebit = signal.netDebit > 0;
  const entry = isDebit ? signal.netDebit : signal.netCredit;

  return (
    <article className="group relative border border-[color:var(--ink-200)] bg-white card-hover">
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-[44px] leading-none tabnum text-[color:var(--ink-200)]">
            {String(rank).padStart(2, "0")}
          </span>
          <div>
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-[26px] leading-none tracking-tight">{signal.ticker}</h3>
              <span className="font-mono text-[11px] tabnum text-[color:var(--ink-400)]">
                ${signal.underlyingPrice.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[color:var(--ink-400)]">
              {STRATEGY_LABEL[signal.strategy]} · {formatLegs(signal.legs)} · exp{" "}
              {new Date(signal.legs[0].expiry).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${CATEGORY_CLASS[signal.category]}`}
            >
              {CATEGORY_LABEL[signal.category]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-600)]">
              {HORIZON_LABEL[signal.horizon]}
            </span>
          </div>
          <div className="border-l border-[color:var(--ink-200)] pl-3 text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
              Conviction
            </p>
            <p className={`font-display text-[22px] leading-none ${CONVICTION_CLASS[signal.conviction]}`}>
              {CONVICTION_LABEL[signal.conviction]}
            </p>
            <p className="font-mono text-[10px] tabnum text-[color:var(--ink-400)]">
              {(signal.convictionScore * 100).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      <p className="border-t border-[color:var(--ink-100)] px-6 py-3 text-[13.5px] leading-relaxed text-[color:var(--ink-800)]">
        {signal.thesis}
      </p>

      <dl className="grid grid-cols-5 border-t border-[color:var(--ink-100)] font-mono text-[11px]">
        {[
          { k: isDebit ? "Debit" : "Credit", v: formatUsd(entry) },
          {
            k: "Max gain",
            v: isFinite(signal.maxGain) ? formatUsd(signal.maxGain) : "Unlimited",
          },
          {
            k: "Max loss",
            v: isFinite(signal.maxLoss) ? formatUsd(signal.maxLoss) : "Unlimited",
          },
          { k: "POP", v: formatPct(signal.probabilityOfProfit) },
          { k: "IV rank", v: signal.ivRank.toString() },
        ].map((item) => (
          <div key={item.k} className="border-r border-[color:var(--ink-100)] px-4 py-3 last:border-r-0">
            <dt className="text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">{item.k}</dt>
            <dd className="mt-1 text-[14px] tabnum text-[color:var(--ink-900)]">{item.v}</dd>
          </div>
        ))}
      </dl>

      {expanded && (
        <div className="border-t border-[color:var(--ink-100)] bg-[color:var(--ink-50)] px-6 py-4">
          <div className="grid grid-cols-2 gap-6 text-[13px]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
                Legs
              </p>
              <ul className="mt-2 space-y-1 font-mono">
                {signal.legs.map((leg, i) => (
                  <li key={i} className="flex justify-between tabnum">
                    <span>
                      {leg.action === "buy" ? "Buy" : "Sell"} {leg.right.toUpperCase()} {leg.strike} @{" "}
                      {leg.expiry}
                    </span>
                    <span className="text-[color:var(--ink-600)]">${leg.premium.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
                Catalysts
              </p>
              <ul className="mt-2 space-y-1">
                {signal.catalysts.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[color:var(--accent)]">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
                Breakevens
              </p>
              <p className="mt-1 font-mono tabnum">
                {signal.breakevens.map((b) => `$${b.toFixed(2)}`).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[color:var(--ink-100)] px-6 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-[11px] uppercase tracking-wider text-[color:var(--ink-600)] hover:text-[color:var(--accent)]"
        >
          {expanded ? "Collapse ←" : "Expand →"}
        </button>
        <button
          onClick={() => setPapered(true)}
          disabled={papered}
          className={`font-mono text-[11px] uppercase tracking-wider ${
            papered
              ? "text-[color:var(--bull)]"
              : "text-[color:var(--ink-600)] hover:text-[color:var(--accent)]"
          }`}
        >
          {papered ? "✓ Papered" : "Paper trade →"}
        </button>
      </div>
    </article>
  );
}
