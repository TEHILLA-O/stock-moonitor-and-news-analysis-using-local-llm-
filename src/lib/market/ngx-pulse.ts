/**
 * NGX Pulse API — https://www.ngxpulse.ng/api
 * Personal tier: 10 req/min, 100 req/day — keep calls minimal (see ngx-pulse-usage).
 */

import type { FinancialMetrics, MarketTapeItem } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";

const BASE_URL = "https://www.ngxpulse.ng";

const inflight = new Map<string, Promise<unknown>>();

export function isNgxPulseConfigured(): boolean {
  const key = process.env.NGX_PULSE_API_KEY?.trim();
  return Boolean(key && !key.startsWith("your_"));
}

/** Full tape = 4 API calls. Default off on Personal tier. */
function useFullNgxPulseTape(): boolean {
  return process.env.NGX_PULSE_FULL === "true";
}

function getApiKey(): string {
  const key = process.env.NGX_PULSE_API_KEY?.trim();
  if (!key || key.startsWith("your_")) {
    throw new Error("NGX_PULSE_API_KEY is not configured");
  }
  return key;
}

export class NgxPulseRateLimitError extends Error {
  constructor() {
    super("NGX Pulse rate limit exceeded (429)");
    this.name = "NgxPulseRateLimitError";
  }
}

async function ngxPulseFetch<T>(path: string): Promise<T> {
  const existing = inflight.get(path);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "X-API-Key": getApiKey(),
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (res.status === 429) {
      setCached("ngx:pulse:rate_limited", true, CACHE_TTL.ngxPulseRateLimit);
      throw new NgxPulseRateLimitError();
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `NGX Pulse ${path} failed (${res.status})${body ? `: ${body.slice(0, 120)}` : ""}`
      );
    }

    return res.json() as Promise<T>;
  })();

  inflight.set(path, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(path);
  }
}

type NgxPulseStock = {
  symbol: string;
  name?: string;
  current_price: number;
  previous_close?: number;
  change_percent: number;
  official_change_percent?: number | null;
  volume?: number;
  market_cap?: number;
  shares_outstanding?: number;
  sector?: string;
  pe_ratio?: number | null;
};

type StocksResponse = {
  stocks?: NgxPulseStock[];
  data?: NgxPulseStock[];
};

type PricesHistoryResponse = {
  success?: boolean;
  symbol?: string;
  prices?: Array<{
    trade_date: string;
    close_price: number;
    open_price?: number;
    high_price?: number | null;
    low_price?: number | null;
    volume?: number;
  }>;
};

function parseStocksPayload(
  raw: NgxPulseStock[] | StocksResponse
): NgxPulseStock[] {
  if (Array.isArray(raw)) return raw;
  return raw.stocks ?? raw.data ?? [];
}

type NgxPulseIndexRow = {
  code: string;
  name?: string;
  currentPrice: number;
  changePercentage: number;
};

type NgxPulseEtfRow = {
  symbol: string;
  name?: string;
  close: number;
  change_percentage: number;
};

type IndicesResponse = {
  success?: boolean;
  data?: NgxPulseIndexRow[];
};

type EtfsResponse = {
  success?: boolean;
  data?: NgxPulseEtfRow[];
};

type MarketOverview = {
  asi?: number;
  pct_change?: number;
};

function stockToTapeItem(s: NgxPulseStock): MarketTapeItem {
  const changePercent =
    s.change_percent ?? s.official_change_percent ?? 0;
  const price = s.current_price ?? 0;
  const change =
    s.previous_close != null && Number.isFinite(s.previous_close)
      ? price - s.previous_close
      : price * (changePercent / 100);

  return {
    ticker: s.symbol.toUpperCase(),
    price,
    change,
    changePercent,
    currency: "NGN",
  };
}

function stockToMetrics(s: NgxPulseStock): Partial<FinancialMetrics> {
  const price = s.current_price ?? 0;
  const shares = s.shares_outstanding ?? 0;

  return {
    currentPrice: price,
    marketCap:
      s.market_cap ??
      (shares > 0 && price > 0 ? shares * price : 0),
    peRatio: s.pe_ratio ?? null,
    eps: null,
    revenue: 0,
    netIncome: 0,
    freeCashFlow: 0,
    totalDebt: 0,
    cash: 0,
    dividendYield: null,
    analystTarget: null,
    dataSources: ["NGX Pulse"],
    isDelayed: false,
    currency: "NGN",
  };
}

function indexToTapeItem(i: NgxPulseIndexRow): MarketTapeItem {
  const changePercent = i.changePercentage ?? 0;
  const price = i.currentPrice ?? 0;
  return {
    ticker: i.code.toUpperCase(),
    price,
    change: price * (changePercent / 100),
    changePercent,
    currency: "NGN",
  };
}

function etfToTapeItem(e: NgxPulseEtfRow): MarketTapeItem {
  const changePercent = e.change_percentage ?? 0;
  const price = e.close ?? 0;
  return {
    ticker: e.symbol.toUpperCase(),
    price,
    change: price * (changePercent / 100),
    changePercent,
    currency: "NGN",
  };
}

export function isNgxPulseRateLimited(): boolean {
  return Boolean(getCached<boolean>("ngx:pulse:rate_limited"));
}

export async function fetchNgxPulseStocks(): Promise<NgxPulseStock[]> {
  if (isNgxPulseRateLimited()) {
    throw new NgxPulseRateLimitError();
  }

  const cacheKey = "ngx:pulse:stocks";
  const cached = getCached<NgxPulseStock[]>(cacheKey);
  if (cached) return cached;

  const raw = await ngxPulseFetch<NgxPulseStock[] | StocksResponse>(
    "/api/ngxdata/stocks"
  );
  const stocks = parseStocksPayload(raw);
  if (stocks.length === 0) {
    throw new Error("NGX Pulse returned no stocks");
  }
  setCached(cacheKey, stocks, CACHE_TTL.ngxPulseStocks);
  return stocks;
}

function findStockInCache(symbol: string): NgxPulseStock | undefined {
  const stocks = getCached<NgxPulseStock[]>("ngx:pulse:stocks");
  if (!stocks) return undefined;
  const upper = symbol.toUpperCase();
  return stocks.find((s) => s.symbol.toUpperCase() === upper);
}

/** Ticker tape — 1 API call (stocks). Set NGX_PULSE_FULL=true for indices/ETFs/ASI (+3 calls). */
export async function fetchNgxPulseMarketTape(): Promise<MarketTapeItem[]> {
  const cacheKey = "ngx:pulse:tape";
  const cached = getCached<MarketTapeItem[]>(cacheKey);
  if (cached) return cached;

  const stocks = await fetchNgxPulseStocks();
  const seen = new Set<string>();
  const items: MarketTapeItem[] = [];

  if (useFullNgxPulseTape()) {
    const [indices, etfs, market] = await Promise.all([
      ngxPulseFetch<IndicesResponse>("/api/ngxdata/indices")
        .then((r) => r.data ?? [])
        .catch(() => [] as NgxPulseIndexRow[]),
      ngxPulseFetch<EtfsResponse>("/api/ngxdata/etfs")
        .then((r) => r.data ?? [])
        .catch(() => [] as NgxPulseEtfRow[]),
      ngxPulseFetch<MarketOverview>("/api/ngxdata/market").catch(
        () => ({}) as MarketOverview
      ),
    ]);

    if (market.asi != null && Number.isFinite(market.asi)) {
      items.push({
        ticker: "ASI",
        price: market.asi,
        changePercent: market.pct_change ?? 0,
        change: market.asi * ((market.pct_change ?? 0) / 100),
        currency: "NGN",
      });
      seen.add("ASI");
    }

    for (const row of indices.slice(0, 8)) {
      const item = indexToTapeItem(row);
      if (!seen.has(item.ticker)) {
        items.push(item);
        seen.add(item.ticker);
      }
    }

    for (const row of etfs) {
      const item = etfToTapeItem(row);
      if (!seen.has(item.ticker)) {
        items.push(item);
        seen.add(item.ticker);
      }
    }
  }

  const stockItems = stocks
    .map(stockToTapeItem)
    .filter((item) => item.price > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  for (const item of stockItems) {
    if (!seen.has(item.ticker)) {
      items.push(item);
      seen.add(item.ticker);
    }
  }

  setCached(cacheKey, items, CACHE_TTL.ngxPulseTape);
  return items;
}

/** Company quote — uses stocks cache when possible (0 extra API calls). */
export async function fetchNgxPulseQuote(
  ticker: string
): Promise<Partial<FinancialMetrics>> {
  const symbol = ticker.toUpperCase().replace(/\.(LG|NG)$/i, "");
  const cacheKey = `ngx:pulse:quote:${symbol}`;
  const cached = getCached<Partial<FinancialMetrics>>(cacheKey);
  if (cached) return cached;

  const fromList = findStockInCache(symbol);
  if (fromList) {
    const partial = stockToMetrics(fromList);
    setCached(cacheKey, partial, CACHE_TTL.ngxPulseQuote);
    return partial;
  }

  const stocks = await fetchNgxPulseStocks();
  const hit = stocks.find((s) => s.symbol.toUpperCase() === symbol);
  if (hit) {
    const partial = stockToMetrics(hit);
    setCached(cacheKey, partial, CACHE_TTL.ngxPulseQuote);
    return partial;
  }

  if (isNgxPulseRateLimited()) {
    throw new NgxPulseRateLimitError();
  }

  const history = await ngxPulseFetch<PricesHistoryResponse>(
    `/api/ngxdata/prices/${encodeURIComponent(symbol)}`
  );
  const bars = [...(history.prices ?? [])].sort((a, b) =>
    b.trade_date.localeCompare(a.trade_date)
  );
  const latest = bars[0];
  if (!latest?.close_price) {
    throw new Error(`No NGX Pulse price data for ${symbol}`);
  }

  const partial: Partial<FinancialMetrics> = {
    currentPrice: latest.close_price,
    marketCap: 0,
    peRatio: null,
    eps: null,
    revenue: 0,
    netIncome: 0,
    freeCashFlow: 0,
    totalDebt: 0,
    cash: 0,
    dividendYield: null,
    analystTarget: null,
    dataSources: ["NGX Pulse"],
    isDelayed: false,
    currency: "NGN",
  };
  setCached(cacheKey, partial, CACHE_TTL.ngxPulseQuote);
  return partial;
}
