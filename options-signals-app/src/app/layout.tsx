import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Edge — Options signals",
  description: "Daily options signals: directional, income, and volatility plays.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Masthead />
        <main className="mx-auto max-w-[1240px] px-8 pb-24">{children}</main>
      </body>
    </html>
  );
}

function Masthead() {
  return (
    <header className="mx-auto max-w-[1240px] px-8 pt-8 pb-6">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-6">
          <Link href="/" className="font-display text-[40px] leading-none tracking-tight">
            Morning Edge
            <span className="text-[color:var(--accent)]">.</span>
          </Link>
          <span className="hidden md:inline font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-400)]">
            Vol. 1 · Signals desk
          </span>
        </div>
        <nav className="flex items-center gap-8 text-[13px]">
          <Link href="/" className="hover:text-[color:var(--accent)]">
            Today
          </Link>
          <Link href="/trades" className="hover:text-[color:var(--accent)]">
            Trades
          </Link>
          <Link href="/backtests" className="hover:text-[color:var(--accent)]">
            Backtests
          </Link>
        </nav>
      </div>
      <div className="rule-thick mt-5" />
      <div className="hairline mt-[3px]" />
    </header>
  );
}
