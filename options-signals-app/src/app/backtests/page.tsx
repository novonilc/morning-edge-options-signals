import { generateBacktests } from "@/lib/mock/generator";
import { STRATEGY_LABEL, CATEGORY_LABEL, formatPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function BacktestsPage() {
  const backtests = generateBacktests();
  const sorted = [...backtests].sort((a, b) => b.expectancy - a.expectancy);

  return (
    <div className="pt-2">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-600)]">
        Strategy performance · Updated nightly
      </p>

      <section className="mt-8">
        <h1 className="font-display text-[56px] leading-[1] tracking-tight max-w-[900px]">
          Historical edge by strategy.
        </h1>
        <p className="mt-5 max-w-[680px] font-display text-[17px] italic leading-relaxed text-[color:var(--ink-600)]">
          Every signal gets marked to market at close. These stats update as sample sizes grow — treat early
          numbers with skepticism until n {">"} 100.
        </p>
      </section>

      <section className="mt-10 border border-[color:var(--ink-200)] bg-white">
        <div className="grid grid-cols-[2.5fr,1fr,0.8fr,0.8fr,0.8fr,1fr,0.8fr] border-b border-[color:var(--ink-200)] bg-[color:var(--ink-50)] px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-600)]">
          <span>Strategy</span>
          <span>Category</span>
          <span className="text-right">N</span>
          <span className="text-right">Win %</span>
          <span className="text-right">Avg win</span>
          <span className="text-right">Avg loss</span>
          <span className="text-right">Expectancy</span>
        </div>

        {sorted.map((s, i) => (
          <div
            key={s.strategy}
            className={`grid grid-cols-[2.5fr,1fr,0.8fr,0.8fr,0.8fr,1fr,0.8fr] items-baseline px-6 py-4 ${
              i < sorted.length - 1 ? "border-b border-[color:var(--ink-100)]" : ""
            }`}
          >
            <div>
              <p className="font-display text-[18px] leading-tight">{STRATEGY_LABEL[s.strategy]}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
                Sharpe {s.sharpe.toFixed(2)} · max DD {formatPct(s.maxDrawdown)}
              </p>
            </div>
            <span className="font-mono text-[11px] text-[color:var(--ink-600)]">
              {CATEGORY_LABEL[s.category]}
            </span>
            <span className="font-mono text-[13px] tabnum text-right">{s.sampleSize}</span>
            <span className="font-mono text-[13px] tabnum text-right">{formatPct(s.winRate)}</span>
            <span className="font-mono text-[13px] tabnum text-right text-[color:var(--bull)]">
              +{s.avgWin.toFixed(2)}R
            </span>
            <span className="font-mono text-[13px] tabnum text-right text-[color:var(--bear)]">
              {s.avgLoss.toFixed(2)}R
            </span>
            <span
              className={`font-mono text-[14px] tabnum text-right ${
                s.expectancy > 0 ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]"
              }`}
            >
              {s.expectancy > 0 ? "+" : ""}
              {s.expectancy.toFixed(3)}R
            </span>
          </div>
        ))}
      </section>

      <section className="mt-10 grid grid-cols-3 gap-4">
        {[
          { label: "Total signals tracked", value: sorted.reduce((a, s) => a + s.sampleSize, 0).toString() },
          {
            label: "Avg win rate",
            value: formatPct(sorted.reduce((a, s) => a + s.winRate, 0) / sorted.length),
          },
          {
            label: "Positive-expectancy strategies",
            value: `${sorted.filter((s) => s.expectancy > 0).length} / ${sorted.length}`,
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-[color:var(--ink-200)] bg-white px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-[32px] leading-none tabnum">{stat.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
