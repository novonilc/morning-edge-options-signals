import type { MarketRegime } from "@/lib/types";

const REGIME_LABEL: Record<MarketRegime["regime"], string> = {
  low_vol_grind: "Low vol grind",
  high_vol_chop: "High vol chop",
  trend_up: "Uptrend",
  trend_down: "Downtrend",
  mean_revert: "Mean revert",
};

const SKEW_LABEL: Record<MarketRegime["skew0dte"], string> = {
  put_heavy: "Put-heavy",
  balanced: "Balanced",
  call_heavy: "Call-heavy",
};

export function RegimeStrip({ regime }: { regime: MarketRegime }) {
  const spxClass =
    regime.spxChange > 0 ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]";

  const stats = [
    { label: "Regime", value: REGIME_LABEL[regime.regime], mono: false },
    {
      label: "SPX",
      value: `${regime.spxChange > 0 ? "+" : ""}${regime.spxChange.toFixed(2)}%`,
      mono: true,
      className: spxClass,
    },
    { label: "VIX", value: regime.vix.toFixed(1), mono: true },
    { label: "0DTE skew", value: SKEW_LABEL[regime.skew0dte], mono: false },
    {
      label: "Earnings today",
      value: regime.earningsToday.length ? regime.earningsToday.join(", ") : "—",
      mono: false,
    },
    {
      label: "Macro",
      value: regime.macroEvents.length ? regime.macroEvents[0] : "—",
      mono: false,
    },
  ];

  return (
    <div className="grid grid-cols-6 border border-[color:var(--ink-200)] bg-white">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`px-4 py-3 ${i < 5 ? "border-r border-[color:var(--ink-100)]" : ""}`}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
            {s.label}
          </p>
          <p
            className={`mt-1 text-[14px] ${s.mono ? "font-mono tabnum" : ""} ${s.className ?? ""}`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
