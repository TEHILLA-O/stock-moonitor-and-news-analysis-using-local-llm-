import type { FinancialMetrics } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";

const BASE = "https://finnhub.io/api/v1";

function parseNum(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function finnhubFetch(
  path: string,
  params: Record<string, string>,
  apiKey: string
) {
  const query = new URLSearchParams({ ...params, token: apiKey });
  const res = await fetch(`${BASE}${path}?${query.toString()}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Finnhub ${path} failed (${res.status})`);
  return res.json();
}

export async function fetchFinnhubFundamentals(
  ticker: string,
  apiKey: string
): Promise<Partial<FinancialMetrics>> {
  const cacheKey = `finnhub:fund:${ticker}`;
  const cached = getCached<Partial<FinancialMetrics>>(cacheKey);
  if (cached) return cached;

  const [quote, metrics, profile] = await Promise.all([
    finnhubFetch("/quote", { symbol: ticker }, apiKey),
    finnhubFetch("/stock/metric", { symbol: ticker, metric: "all" }, apiKey).catch(
      () => ({ metric: {} })
    ),
    finnhubFetch("/stock/profile2", { symbol: ticker }, apiKey).catch(() => ({})),
  ]);

  const m = (metrics as { metric?: Record<string, number> }).metric ?? {};

  const partial: Partial<FinancialMetrics> = {
    currentPrice: parseNum((quote as { c?: number }).c) ?? 0,
    marketCap: parseNum((profile as { marketCapitalization?: number }).marketCapitalization)
      ? (profile as { marketCapitalization: number }).marketCapitalization * 1_000_000
      : parseNum(m.marketCapitalization) ?? 0,
    peRatio: parseNum(m.peBasicExclExtraTTM ?? m.peTTM),
    eps: parseNum(m.epsBasicExclExtraItemsTTM ?? m.epsTTM),
    revenue: parseNum(m.revenuePerShareTTM) != null && parseNum(m.epsTTM)
      ? (m.revenuePerShareTTM as number) * 1_000_000
      : 0,
    dividendYield: parseNum(m.dividendYieldIndicatedAnnual)
      ? (m.dividendYieldIndicatedAnnual as number) * 100
      : null,
    fiftyTwoWeekHigh: parseNum((quote as { h?: number }).h),
    fiftyTwoWeekLow: parseNum((quote as { l?: number }).l),
    profitMargin: parseNum(m.netProfitMarginTTM)
      ? (m.netProfitMarginTTM as number) * 100
      : null,
    institutionalOwnership: parseNum(m.institutionalOwnership),
    analystTarget: parseNum(m.targetMeanPrice),
    isDelayed: true,
  };

  setCached(cacheKey, partial, CACHE_TTL.fundamentals);
  return partial;
}
