import type { FinancialMetrics } from "@/lib/types";
import {
  fetchAlphaVantageOhlcv,
  fetchAlphaVantageOverview,
} from "./alphavantage-provider";
import { fetchFinnhubFundamentals } from "./finnhub-provider";
import { fetchNgxMarketData } from "./ngx-provider";
import { fetchSecFilings } from "./sec-edgar";
import { isNgxListing, resolveYahooSymbols } from "./ticker-resolve";
import type { MarketDataBundle, OhlcvBar } from "./types";
import { fetchYahooFundamentals, fetchYahooOhlcv } from "./yahoo-provider";

export type MarketProvider = "auto" | "yahoo" | "alphavantage" | "finnhub";

export type MarketFetchContext = {
  ticker: string;
  exchange?: string;
  country?: string;
  provider?: MarketProvider;
  apiKey?: string;
  finnhubKey?: string;
};

function mergeMetrics(
  base: FinancialMetrics,
  patch: Partial<FinancialMetrics>
): FinancialMetrics {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
    ),
    priceHistory: patch.priceHistory?.length
      ? patch.priceHistory
      : base.priceHistory,
    ohlcvHistory: patch.ohlcvHistory?.length
      ? patch.ohlcvHistory
      : base.ohlcvHistory,
    dataSources: [
      ...new Set([...(base.dataSources ?? []), ...(patch.dataSources ?? [])]),
    ],
  };
}

function emptyMetrics(ohlcv: OhlcvBar[]): FinancialMetrics {
  const last = ohlcv[ohlcv.length - 1];
  return {
    currentPrice: last?.close ?? 0,
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
    priceHistory: ohlcv.map((b) => ({ date: b.date, price: b.close })),
    ohlcvHistory: ohlcv,
    dataSources: [],
    isDelayed: true,
  };
}

async function tryYahooBundle(
  symbols: string[]
): Promise<{ ohlcv: OhlcvBar[]; financials: Partial<FinancialMetrics> } | null> {
  for (const symbol of symbols) {
    try {
      const ohlcv = await fetchYahooOhlcv(symbol);
      if (ohlcv.length === 0) continue;
      const yahooFund = await fetchYahooFundamentals(symbol, ohlcv);
      return {
        ohlcv,
        financials: { ...yahooFund, dataSources: ["Yahoo Finance"] },
      };
    } catch {
      // try next symbol variant
    }
  }
  return null;
}

export async function fetchMarketDataBundle(
  ticker: string,
  options?: Omit<MarketFetchContext, "ticker">
): Promise<MarketDataBundle> {
  const provider = options?.provider ?? "auto";
  const avKey = options?.apiKey ?? process.env.FINANCIAL_API_KEY;
  const finnhubKey = options?.finnhubKey ?? process.env.FINNHUB_API_KEY;
  const exchange = options?.exchange;
  const country = options?.country;
  const sources: string[] = [];

  let ohlcv: OhlcvBar[] = [];
  let financials = emptyMetrics([]);

  const yahooSymbols = resolveYahooSymbols(ticker, exchange, country);
  const yahooResult = await tryYahooBundle(yahooSymbols);

  if (yahooResult) {
    ohlcv = yahooResult.ohlcv;
    financials = mergeMetrics(emptyMetrics(ohlcv), yahooResult.financials);
    sources.push("Yahoo Finance");
  } else if (isNgxListing(exchange, country)) {
    try {
      const ngx = await fetchNgxMarketData(ticker);
      ohlcv = ngx.ohlcv;
      const { ohlcv: _o, ...metrics } = ngx;
      financials = mergeMetrics(emptyMetrics(ohlcv), metrics);
      for (const s of metrics.dataSources ?? ["NGX"]) {
        if (!sources.includes(s)) sources.push(s);
      }
    } catch {
      // fall through to AV / error
    }
  }

  if (ohlcv.length === 0 && avKey) {
    try {
      ohlcv = await fetchAlphaVantageOhlcv(ticker, avKey);
      sources.push("Alpha Vantage");
      const avFund = await fetchAlphaVantageOverview(ticker, avKey, ohlcv);
      financials = mergeMetrics(emptyMetrics(ohlcv), {
        ...avFund,
        dataSources: ["Alpha Vantage"],
      });
    } catch {
      // continue
    }
  }

  if (ohlcv.length === 0) {
    throw new Error(
      `Could not fetch market data for ${ticker}. US/UK tickers use Yahoo; NGX listings need exchange set to NGX.`
    );
  }

  if (avKey && provider === "auto" && !sources.includes("Alpha Vantage")) {
    try {
      const avFund = await fetchAlphaVantageOverview(ticker, avKey, ohlcv);
      financials = mergeMetrics(financials, {
        ...avFund,
        dataSources: ["Alpha Vantage"],
      });
      sources.push("Alpha Vantage");
    } catch {
      // rate limit
    }
  }

  if ((provider === "finnhub" || provider === "auto") && finnhubKey) {
    try {
      const fh = await fetchFinnhubFundamentals(ticker, finnhubKey);
      financials = mergeMetrics(financials, {
        ...fh,
        dataSources: [...(financials.dataSources ?? []), "Finnhub"],
      });
      sources.push("Finnhub");
    } catch {
      // optional
    }
  }

  let filings: Awaited<ReturnType<typeof fetchSecFilings>> = [];
  if (!isNgxListing(exchange, country)) {
    try {
      filings = await fetchSecFilings(ticker);
      if (filings.length) sources.push("SEC EDGAR");
    } catch {
      filings = [];
    }
  }

  financials = {
    ...financials,
    dataSources: [...new Set([...(financials.dataSources ?? []), ...sources])],
    isDelayed: true,
  };

  return { financials, ohlcv, filings, sources };
}
