import { db } from "@/lib/db";
import { fetchNgxMarketTape } from "@/lib/market/ngx-tape";
import { isNgxPulseConfigured } from "@/lib/market/ngx-pulse";
import { isNgxListing } from "@/lib/market/ticker-resolve";
import { fetchYahooTapeQuote } from "@/lib/market/yahoo-tape";
import type { MarketTapeItem, MarketTapeResponse } from "@/lib/types";

export async function getMarketTape(): Promise<MarketTapeResponse> {
  const companies = await db.getCompanies();
  const ngxTape = await fetchNgxMarketTape();
  const ngxByTicker = new Map(ngxTape.map((item) => [item.ticker, item]));

  const priority: MarketTapeItem[] = [];
  const seen = new Set<string>();

  const usWatchlist = companies.filter(
    (c) => !isNgxListing(c.exchange, c.country)
  );
  const ngxWatchlist = companies.filter((c) =>
    isNgxListing(c.exchange, c.country)
  );

  for (const company of ngxWatchlist) {
    const hit = ngxByTicker.get(company.ticker.toUpperCase());
    if (hit && !seen.has(hit.ticker)) {
      priority.push(hit);
      seen.add(hit.ticker);
    }
  }

  const yahooResults = await Promise.all(
    usWatchlist.slice(0, 12).map((c) =>
      fetchYahooTapeQuote(c.ticker, c.exchange, c.country)
    )
  );
  for (const item of yahooResults) {
    if (item && !seen.has(item.ticker)) {
      priority.push(item);
      seen.add(item.ticker);
    }
  }

  const rest = ngxTape.filter((item) => !seen.has(item.ticker));
  const items = [...priority, ...rest];

  const hasNgx = items.some((i) => i.currency === "NGN");
  const hasUsd = items.some((i) => i.currency === "USD");

  const ngxSource = isNgxPulseConfigured() ? "NGX Pulse" : "NGX";
  let label = "Daily change";
  if (hasNgx && hasUsd) label = `Daily change · Watchlist + ${ngxSource}`;
  else if (hasNgx) label = `Daily change · ${ngxSource}`;
  else if (hasUsd) label = "Daily change · Watchlist";

  return {
    items,
    label,
    updatedAt: new Date().toISOString(),
  };
}
