import YahooFinance from "yahoo-finance2";
import type { MarketTapeItem } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";
import { resolveYahooSymbols } from "./ticker-resolve";

const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function parseNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function fetchYahooTapeQuote(
  ticker: string,
  exchange?: string,
  country?: string
): Promise<MarketTapeItem | null> {
  const symbols = resolveYahooSymbols(ticker, exchange, country);

  for (const symbol of symbols) {
    const cacheKey = `yahoo:tape:${symbol}`;
    const cached = getCached<MarketTapeItem>(cacheKey);
    if (cached) return cached;

    try {
      const quote = await yahoo.quote(symbol);
      const price = parseNum(quote.regularMarketPrice);
      if (price == null || price <= 0) continue;

      const changePercent =
        parseNum(quote.regularMarketChangePercent) ?? 0;
      const change =
        parseNum(quote.regularMarketChange) ??
        (price * changePercent) / 100;

      const item: MarketTapeItem = {
        ticker: ticker.toUpperCase(),
        price,
        change,
        changePercent,
        currency: (quote.currency as string) ?? "USD",
      };

      setCached(cacheKey, item, CACHE_TTL.tape);
      return item;
    } catch {
      continue;
    }
  }

  return null;
}
