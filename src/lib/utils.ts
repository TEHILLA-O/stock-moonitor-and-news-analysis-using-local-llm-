import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  options?: boolean | { compact?: boolean; currency?: string }
): string {
  const opts =
    typeof options === "boolean" ? { compact: options } : (options ?? {});
  const currency = opts.currency ?? "USD";
  const compact = opts.compact ?? false;

  if (compact) {
    const sym = currency === "NGN" ? "₦" : "$";
    if (Math.abs(value) >= 1e12) return `${sym}${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${sym}${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${sym}${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${sym}${(value / 1e3).toFixed(2)}K`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function tickerSlug(ticker: string): string {
  return ticker.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

export function decisionColor(decision: string): string {
  switch (decision) {
    case "buy":
      return "text-cyan-400";
    case "hold":
      return "text-violet-400";
    case "watch":
      return "text-amber-400";
    case "avoid":
      return "text-fuchsia-400";
    default:
      return "text-slate-400";
  }
}

export function scoreColor(score: number): string {
  if (score >= 70) return "text-cyan-400";
  if (score >= 50) return "text-violet-400";
  return "text-fuchsia-400";
}

export function generateId(): string {
  return crypto.randomUUID();
}
