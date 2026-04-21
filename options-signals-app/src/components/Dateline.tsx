"use client";

import { useEffect, useState } from "react";

export function Dateline() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const etTime = now.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const hour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }));
  const marketOpen = hour >= 9 && hour < 16;

  return (
    <div className="flex items-baseline justify-between">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-600)]">
        {date} · Pre-market brief
      </p>
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-600)]">
        <span
          className={`dot ${marketOpen ? "blink" : ""}`}
          style={{ background: marketOpen ? "var(--bull)" : "var(--ink-400)" }}
        />
        {marketOpen ? "Market open" : "Market closed"} · {etTime} ET
      </p>
    </div>
  );
}
