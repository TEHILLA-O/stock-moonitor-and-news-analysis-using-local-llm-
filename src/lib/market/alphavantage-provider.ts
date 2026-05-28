import type { FinancialMetrics } from "@/lib/types";
import type { OhlcvBar } from "./types";
import { CACHE_TTL, getCached, setCached } from "./cache";
import { ohlcvToPriceHistory } from "./resample";

const BASE = "https://www.alphavantage.co/query";

async function avFetch(
  params: Record<string, string>,
  apiKey: string
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ ...params, apikey: apiKey });
  const res = await fetch(`${BASE}?${query.toString()}`, {
    next: { revalidate: 3600 },
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (data.Note || data.Information) {
    throw new Error(String(data.Note ?? data.Information));
  }
  return data;
}

function parseNum(value: unknown): number | null {
  if (value == null || value === "None" || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function fetchAlphaVantageOhlcv(
  ticker: string,
  apiKey: string
): Promise<OhlcvBar[]> {
  const cacheKey = `av:ohlcv:${ticker}`;
  const cached = getCached<OhlcvBar[]>(cacheKey);
  if (cached) return cached;

  const data = await avFetch(
    { function: "TIME_SERIES_DAILY", symbol: ticker, outputsize: "compact" },
    apiKey
  );

  const series = data["Time Series (Daily)"] as
    | Record<string, Record<string, string>>
    | undefined;

  if (!series) return [];

  const bars = Object.entries(series)
    .map(([date, row]) => ({
      date,
      open: parseNum(row["1. open"]) ?? 0,
      high: parseNum(row["2. high"]) ?? 0,
      low: parseNum(row["3. low"]) ?? 0,
      close:
        parseNum(row["4. close"]) ??
        parseNum(row["5. adjusted close"]) ??
        0,
      volume: parseNum(row["5. volume"] ?? row["6. volume"]) ?? 0,
    }))
    .filter((b) => b.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-504);

  setCached(cacheKey, bars, CACHE_TTL.ohlcv);
  return bars;
}

export async function fetchAlphaVantageOverview(
  ticker: string,
  apiKey: string,
  ohlcv: OhlcvBar[]
): Promise<Partial<FinancialMetrics>> {
  const cacheKey = `av:overview:${ticker}`;
  const cached = getCached<Partial<FinancialMetrics>>(cacheKey);
  if (cached) return cached;

  const data = await avFetch({ function: "OVERVIEW", symbol: ticker }, apiKey);
  const last = ohlcv[ohlcv.length - 1];

  const partial: Partial<FinancialMetrics> = {
    currentPrice: parseNum(data["50DayMovingAverage"]) ?? last?.close ?? 0,
    marketCap: parseNum(data.MarketCapitalization) ?? 0,
    peRatio: parseNum(data.PERatio),
    eps: parseNum(data.EPS),
    revenue: parseNum(data.RevenueTTM) ?? 0,
    netIncome: 0,
    freeCashFlow: 0,
    totalDebt: 0,
    cash: 0,
    dividendYield: parseNum(data.DividendYield)
      ? Number(data.DividendYield) * 100
      : null,
    analystTarget: parseNum(data.AnalystTargetPrice),
    profitMargin: parseNum(data.ProfitMargin)
      ? Number(data.ProfitMargin) * 100
      : null,
    fiftyTwoWeekHigh: parseNum(data["52WeekHigh"]),
    fiftyTwoWeekLow: parseNum(data["52WeekLow"]),
    priceHistory: ohlcvToPriceHistory(ohlcv),
    ohlcvHistory: ohlcv,
    isDelayed: true,
  };

  setCached(cacheKey, partial, CACHE_TTL.fundamentals);
  return partial;
}
