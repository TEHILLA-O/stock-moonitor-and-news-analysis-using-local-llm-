import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isNgnListing(exchange?: string, country?: string): boolean {
  const ex = (exchange ?? "").toUpperCase();
  const c = (country ?? "").toLowerCase();
  return ex === "NGX" || c === "nigeria";
}

export function resolveListingCurrency(
  exchange?: string,
  country?: string,
  currency?: string
): string {
  if (currency) return currency.toUpperCase();
  return isNgnListing(exchange, country) ? "NGN" : "USD";
}

export function currencySymbol(currency = "USD"): string {
  switch (currency.toUpperCase()) {
    case "NGN":
      return "₦";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    default:
      return currency.toUpperCase();
  }
}

/** Compact axis labels for charts (e.g. ₦4, ₦12K). */
export function formatChartPrice(value: number, currency = "USD"): string {
  const sym = currencySymbol(currency);
  const n = Number(value);
  if (!Number.isFinite(n)) return `${sym}0`;
  if (Math.abs(n) >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${sym}${(n / 1e3).toFixed(1)}K`;
  return `${sym}${n.toFixed(n >= 100 ? 0 : 2)}`;
}

export function formatCurrency(
  value: number,
  options?: boolean | { compact?: boolean; currency?: string }
): string {
  const opts =
    typeof options === "boolean" ? { compact: options } : (options ?? {});
  const currency = (opts.currency ?? "USD").toUpperCase();
  const compact = opts.compact ?? false;
  const sym = currencySymbol(currency);
  const sign = value < 0 ? "-" : "";

  if (currency === "NGN") {
    const abs = Math.abs(value);
    if (compact) {
      if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
      if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
      if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(2)}K`;
    }
    return `${sign}${sym}${formatNumber(abs)}`;
  }

  if (compact) {
    const usdSym = sym;
    if (Math.abs(value) >= 1e12) return `${sign}${usdSym}${(Math.abs(value) / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${sign}${usdSym}${(Math.abs(value) / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${sign}${usdSym}${(Math.abs(value) / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${sign}${usdSym}${(Math.abs(value) / 1e3).toFixed(2)}K`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${sign}${sym}${formatNumber(Math.abs(value))}`;
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
