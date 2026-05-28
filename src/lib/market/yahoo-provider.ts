import YahooFinance from "yahoo-finance2";
import type { OhlcvBar } from "./types";
import type { FinancialMetrics } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";
import { ohlcvToPriceHistory } from "./resample";

const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function parseNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function fetchYahooOhlcv(ticker: string): Promise<OhlcvBar[]> {
  const cacheKey = `yahoo:ohlcv:${ticker}`;
  const cached = getCached<OhlcvBar[]>(cacheKey);
  if (cached) return cached;

  const start = new Date();
  start.setFullYear(start.getFullYear() - 2);

  const chart = await yahoo.chart(ticker, {
    period1: start,
    interval: "1d",
  });

  const quotes = chart.quotes ?? [];
  const bars: OhlcvBar[] = quotes
    .filter(
      (q) =>
        q.date &&
        q.open != null &&
        q.high != null &&
        q.low != null &&
        q.close != null
    )
    .map((q) => ({
      date: new Date(q.date as Date).toISOString().slice(0, 10),
      open: q.open as number,
      high: q.high as number,
      low: q.low as number,
      close: q.close as number,
      volume: (q.volume as number) ?? 0,
    }));

  setCached(cacheKey, bars, CACHE_TTL.ohlcv);
  return bars;
}

export async function fetchYahooFundamentals(
  ticker: string,
  ohlcv: OhlcvBar[]
): Promise<Partial<FinancialMetrics>> {
  const cacheKey = `yahoo:quote:${ticker}`;
  const cached = getCached<Partial<FinancialMetrics>>(cacheKey);
  if (cached) return cached;

  const quote = await yahoo.quote(ticker);
  const summary = await yahoo
    .quoteSummary(ticker, {
      modules: [
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
        "price",
      ],
    })
    .catch(() => null);

  const financial = summary?.financialData;
  const detail = summary?.summaryDetail;
  const stats = summary?.defaultKeyStatistics;
  const closes = ohlcv.map((b) => b.close);
  const w252 = closes.slice(-252);

  const currentPrice =
    parseNum(quote.regularMarketPrice) ??
    ohlcv[ohlcv.length - 1]?.close ??
    0;

  const partial: Partial<FinancialMetrics> = {
    currentPrice,
    marketCap: parseNum(quote.marketCap) ?? 0,
    peRatio: parseNum(quote.trailingPE ?? detail?.trailingPE),
    eps: parseNum(quote.epsTrailingTwelveMonths ?? stats?.trailingEps),
    revenue: parseNum(financial?.totalRevenue) ?? 0,
    netIncome: parseNum(financial?.netIncomeToCommon) ?? 0,
    freeCashFlow: parseNum(financial?.freeCashflow) ?? 0,
    totalDebt: parseNum(financial?.totalDebt) ?? 0,
    cash: parseNum(financial?.totalCash) ?? 0,
    dividendYield:
      parseNum(detail?.dividendYield) != null
        ? (detail?.dividendYield as number) * 100
        : null,
    analystTarget: parseNum(financial?.targetMeanPrice),
    profitMargin:
      parseNum(financial?.profitMargins) != null
        ? (financial?.profitMargins as number) * 100
        : null,
    institutionalOwnership:
      parseNum(stats?.heldPercentInstitutions) != null
        ? (stats?.heldPercentInstitutions as number) * 100
        : null,
    fiftyTwoWeekHigh:
      parseNum(detail?.fiftyTwoWeekHigh) ??
      (w252.length ? Math.max(...w252) : null),
    fiftyTwoWeekLow:
      parseNum(detail?.fiftyTwoWeekLow) ??
      (w252.length ? Math.min(...w252) : null),
    priceHistory: ohlcvToPriceHistory(ohlcv),
    ohlcvHistory: ohlcv,
    isDelayed: true,
  };

  setCached(cacheKey, partial, CACHE_TTL.fundamentals);
  return partial;
}
