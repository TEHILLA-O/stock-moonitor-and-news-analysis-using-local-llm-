/**
 * Financial data provider abstraction.
 * Yahoo Finance, Alpha Vantage, Finnhub, SEC EDGAR.
 */

import type { FinancialMetrics, SecFiling } from "@/lib/types";
import {
  fetchMarketDataBundle,
  type MarketProvider,
} from "@/lib/market/fetch-market-data";
import { CACHE_TTL, getCached, setCached } from "@/lib/market/cache";

export type FinancialProvider =
  | "auto"
  | "yahoo"
  | "alphavantage"
  | "finnhub"
  | "fmp"
  | "polygon";

export interface FetchFinancialParams {
  ticker: string;
  exchange?: string;
  country?: string;
}

export interface FinancialServiceConfig {
  provider: FinancialProvider;
  apiKey?: string;
  finnhubKey?: string;
}

/** Map persisted settings / env values to a live provider (no mock). */
export function resolveFinancialProvider(provider?: string): FinancialProvider {
  if (!provider || provider === "mock" || provider === "alphavantage") {
    return "auto";
  }
  return provider as FinancialProvider;
}

function normalizeProvider(provider?: string): FinancialProvider {
  return resolveFinancialProvider(provider);
}

function getProvider(): FinancialProvider {
  const env = process.env.FINANCIAL_PROVIDER;
  return normalizeProvider(env ?? "auto");
}

function mapProvider(provider: FinancialProvider): MarketProvider {
  if (provider === "yahoo") return "yahoo";
  if (provider === "finnhub") return "finnhub";
  return "auto";
}

export async function fetchCompanyFinancials(
  params: FetchFinancialParams,
  config?: Partial<FinancialServiceConfig>
): Promise<FinancialMetrics> {
  const provider = normalizeProvider(config?.provider ?? getProvider());
  const ticker = params.ticker.toUpperCase();
  const cacheKey = `financials:${ticker}:${provider}`;

  const cached = getCached<FinancialMetrics>(cacheKey);
  if (cached) return cached;

  const bundle = await fetchMarketDataBundle(ticker, {
    provider: mapProvider(provider),
    apiKey: config?.apiKey ?? process.env.FINANCIAL_API_KEY,
    finnhubKey: config?.finnhubKey ?? process.env.FINNHUB_API_KEY,
    exchange: params.exchange,
    country: params.country,
  });

  setCached(cacheKey, bundle.financials, CACHE_TTL.fundamentals);
  setCached(`filings:${ticker}`, bundle.filings, CACHE_TTL.filings);

  return bundle.financials;
}

export async function fetchCompanyFilings(ticker: string): Promise<SecFiling[]> {
  const cacheKey = `filings:${ticker.toUpperCase()}`;
  const cached = getCached<SecFiling[]>(cacheKey);
  if (cached) return cached;

  const bundle = await fetchMarketDataBundle(ticker.toUpperCase(), {
    provider: "auto",
  });
  return bundle.filings;
}

export function calculatePriceMomentum(
  priceHistory: Array<{ date: string; price: number }>
): number {
  if (priceHistory.length < 2) return 50;
  const recent = priceHistory.slice(-30);
  const first = recent[0].price;
  const last = recent[recent.length - 1].price;
  const change = ((last - first) / first) * 100;
  return Math.min(100, Math.max(0, Math.round(50 + change * 5)));
}

export async function fetchFromAlphaVantage(
  params: FetchFinancialParams,
  apiKey: string
): Promise<FinancialMetrics> {
  const bundle = await fetchMarketDataBundle(params.ticker, {
    provider: "auto",
    apiKey,
  });
  return bundle.financials;
}

export async function fetchFromFinnhub(
  params: FetchFinancialParams,
  apiKey: string
): Promise<FinancialMetrics> {
  const bundle = await fetchMarketDataBundle(params.ticker, {
    provider: "finnhub",
    finnhubKey: apiKey,
  });
  return bundle.financials;
}

export async function fetchFromFMP(
  _params: FetchFinancialParams,
  _apiKey: string
): Promise<FinancialMetrics> {
  throw new Error("FMP financial integration not yet implemented.");
}

export async function fetchFromPolygon(
  _params: FetchFinancialParams,
  _apiKey: string
): Promise<FinancialMetrics> {
  throw new Error("Polygon integration not yet implemented.");
}
