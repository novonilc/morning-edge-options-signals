import { generateSignals, generateTrades } from "@/lib/mock/generator";
import { STRATEGY_LABEL, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const signals = await generateSignals(new Date(), false);
  const trades = generateTrades(signals);

  const open = trades.filter((t) => t.exitAt === null);
  const closed = trades.filter((t) => t.exitAt !== null);

  const totalPnl = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closed.length ? wins / closed.length : 0;

  return (
    <div className="pt-2">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-600)]">
        Paper ledger · Your signal-to-trade loop
      </p>

      <section className="mt-8">
        <h1 className="font-display text-[56px] leading-[1] tracking-tight max-w-[900px]">
          Your trades, marked to market.
        </h1>
        <p className="mt-5 max-w-[680px] font-display text-[17px] italic leading-relaxed text-[color:var(--ink-600)]">
          Every signal you paper-trade lands here. Closed positions feed your personal edge stats — the
          backtests tell you what strategies work in general, this tells you what works for you.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-4 gap-4">
        {[
          { label: "Open positions", value: open.length.toString(), mono: true },
          { label: "Closed this month", value: closed.length.toString(), mono: true },
          {
            label: "Realized P&L",
            value: `${totalPnl >= 0 ? "+" : ""}${formatUsd(totalPnl)}`,
            mono: true,
            className: totalPnl >= 0 ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]",
          },
          {
            label: "Win rate",
            value: closed.length ? `${Math.round(winRate * 100)}%` : "—",
            mono: true,
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-[color:var(--ink-200)] bg-white px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-400)]">
              {stat.label}
            </p>
            <p
              className={`mt-2 font-display text-[32px] leading-none tabnum ${stat.className ?? ""}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {open.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[28px] tracking-tight">Open positions</h2>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-400)]">
              Live — marks update at close
            </p>
          </div>
          <div className="rule mt-3" />

          <div className="mt-5 border border-[color:var(--ink-200)] bg-white">
            <div className="grid grid-cols-[1fr,2fr,0.8fr,1fr,1fr,0.8fr] border-b border-[color:var(--ink-200)] bg-[color:var(--ink-50)] px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-600)]">
              <span>Ticker</span>
              <span>Strategy</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Entry</span>
              <span className="text-right">Entered</span>
              <span className="text-right">Status</span>
            </div>
            {open.map((t, i) => (
              <div
                key={t.id}
                className={`grid grid-cols-[1fr,2fr,0.8fr,1fr,1fr,0.8fr] items-baseline px-6 py-4 ${
                  i < open.length - 1 ? "border-b border-[color:var(--ink-100)]" : ""
                }`}
              >
                <span className="font-display text-[20px] leading-none">{t.ticker}</span>
                <span className="font-mono text-[12px] text-[color:var(--ink-600)]">
                  {STRATEGY_LABEL[t.strategy]}
                </span>
                <span className="font-mono text-[13px] tabnum text-right">{t.contracts}</span>
                <span className="font-mono text-[13px] tabnum text-right">
                  {formatUsd(t.entryPrice)}
                </span>
                <span className="font-mono text-[11px] tabnum text-right text-[color:var(--ink-400)]">
                  {new Date(t.entryAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-right text-[color:var(--neutral)]">
                  <span className="dot mr-1.5 align-middle" style={{ background: "var(--neutral)" }} />
                  Open
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[28px] tracking-tight">Closed positions</h2>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-400)]">
              {closed.length} trades · {wins} wins
            </p>
          </div>
          <div className="rule mt-3" />

          <div className="mt-5 border border-[color:var(--ink-200)] bg-white">
            <div className="grid grid-cols-[1fr,2fr,0.8fr,1fr,1fr,1fr] border-b border-[color:var(--ink-200)] bg-[color:var(--ink-50)] px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-600)]">
              <span>Ticker</span>
              <span>Strategy</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Entry</span>
              <span className="text-right">Exit</span>
              <span className="text-right">P&L</span>
            </div>
            {closed.map((t, i) => {
              const pnl = t.pnl ?? 0;
              const isWin = pnl > 0;
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-[1fr,2fr,0.8fr,1fr,1fr,1fr] items-baseline px-6 py-4 ${
                    i < closed.length - 1 ? "border-b border-[color:var(--ink-100)]" : ""
                  }`}
                >
                  <span className="font-display text-[20px] leading-none">{t.ticker}</span>
                  <span className="font-mono text-[12px] text-[color:var(--ink-600)]">
                    {STRATEGY_LABEL[t.strategy]}
                  </span>
                  <span className="font-mono text-[13px] tabnum text-right">{t.contracts}</span>
                  <span className="font-mono text-[13px] tabnum text-right">
                    {formatUsd(t.entryPrice)}
                  </span>
                  <span className="font-mono text-[13px] tabnum text-right">
                    {formatUsd(t.exitPrice ?? 0)}
                  </span>
                  <span
                    className={`font-mono text-[14px] tabnum text-right ${
                      isWin ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]"
                    }`}
                  >
                    {isWin ? "+" : ""}
                    {formatUsd(pnl)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-14 border-t-2 border-[color:var(--ink-900)] pt-6">
        <p className="font-display text-[14px] italic text-[color:var(--ink-600)]">
          Note —{" "}
          <span className="not-italic font-sans text-[13px] text-[color:var(--ink-800)]">
            All positions shown are paper trades. When you're ready to go live, wire up a broker API
            (Tradier, Alpaca, IBKR) in <span className="font-mono text-[12px]">src/lib/broker/</span> and
            flip the <span className="font-mono text-[12px]">mode</span> field to{" "}
            <span className="font-mono text-[12px]">&quot;live&quot;</span>.
          </span>
        </p>
      </section>
    </div>
  );
}
