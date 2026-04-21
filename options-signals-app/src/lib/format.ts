import type { Strategy, Category, Horizon, Conviction, Leg } from "@/lib/types";

export const STRATEGY_LABEL: Record<Strategy, string> = {
  bull_call_spread: "Bull call spread",
  bear_put_spread: "Bear put spread",
  iron_condor: "Iron condor",
  credit_put_spread: "Credit put spread",
  credit_call_spread: "Credit call spread",
  long_straddle: "Long straddle",
  long_strangle: "Long strangle",
  short_strangle: "Short strangle",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  directional: "Directional",
  income: "Income",
  volatility: "Volatility",
};

export const HORIZON_LABEL: Record<Horizon, string> = {
  "0dte": "0DTE",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const CONVICTION_LABEL: Record<Conviction, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

export function formatUsd(n: number): string {
  if (!isFinite(n)) return "Unlimited";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatLeg(leg: Leg): string {
  const side = leg.action === "buy" ? "+" : "−";
  const right = leg.right === "call" ? "C" : "P";
  return `${side}${leg.strike}${right}`;
}

export function formatLegs(legs: Leg[]): string {
  return legs.map(formatLeg).join(" / ");
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
