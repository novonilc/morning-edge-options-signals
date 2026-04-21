import { generateSignals, generateRegime } from "@/lib/mock/generator";
import { SignalCard } from "@/components/SignalCard";
import { RegimeStrip } from "@/components/RegimeStrip";
import { Dateline } from "@/components/Dateline";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const signals = await generateSignals(now);
  const regime = generateRegime(now);

  const categoryCounts = {
    directional: signals.filter((s) => s.category === "directional").length,
    income: signals.filter((s) => s.category === "income").length,
    volatility: signals.filter((s) => s.category === "volatility").length,
  };

  return (
    <div className="pt-2">
      <Dateline />

      <section className="mt-8">
        <h1 className="font-display text-[72px] leading-[0.95] tracking-tight max-w-[900px]">
          {regime.regime === "low_vol_grind"
            ? "Pick your spots. The tape is quiet."
            : regime.regime === "high_vol_chop"
              ? "Volatility is back. Keep positions small."
              : regime.regime === "trend_up"
                ? "Trend is your friend — ride it, don't fade it."
                : regime.regime === "trend_down"
                  ? "Risk-off tone. Favor hedged structures."
                  : "Range-bound. Let premium do the work."}
        </h1>
        <p className="mt-6 max-w-[680px] font-display text-[18px] italic leading-relaxed text-[color:var(--ink-600)]">
          {signals.length} signals for today ·{" "}
          <span className="text-[color:var(--bull)]">{categoryCounts.directional} directional</span>,{" "}
          <span className="text-[color:var(--neutral)]">{categoryCounts.income} income</span>,{" "}
          <span className="text-[color:var(--accent)]">{categoryCounts.volatility} volatility</span>. Ranked by
          conviction.
        </p>
      </section>

      <section className="mt-10">
        <RegimeStrip regime={regime} />
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[32px] tracking-tight">Signals</h2>
          <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-400)]">
            Hit/miss scored at close · backtests update nightly
          </p>
        </div>
        <div className="rule mt-3" />

        <div className="mt-6 grid gap-4">
          {signals.map((s, i) => (
            <SignalCard key={s.id} signal={s} rank={i + 1} />
          ))}
        </div>
      </section>

      <section className="mt-14 border-t-2 border-[color:var(--ink-900)] pt-6">
        <p className="font-display text-[14px] italic text-[color:var(--ink-600)]">
          Risk note —{" "}
          <span className="not-italic font-sans text-[13px] text-[color:var(--ink-800)]">
            These signals are research, not advice. Paper-trade before risking capital. Options can lose 100% of
            premium quickly, especially 0DTE and earnings plays. Your risk management — position sizing, stops,
            and discipline — is what determines P&L over time, not signal quality alone.
          </span>
        </p>
      </section>
    </div>
  );
}
