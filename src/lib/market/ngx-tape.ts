import type { MarketTapeItem } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";

const NGX_LIST_ROW =
  /\/ngx\/([a-z0-9]+)\.html[^>]*>([A-Z0-9]+)<\/a><td><a href=[^>]+>[^<]+<\/a><td>(?:[^<]*)<td>([0-9,]+\.?[0-9]*)<td[^>]*>([+-]?[0-9.]+)/gi;

function parseNgxListHtml(html: string): MarketTapeItem[] {
  const byTicker = new Map<string, MarketTapeItem>();

  for (const match of html.matchAll(NGX_LIST_ROW)) {
    const ticker = match[2].toUpperCase();
    const price = Number.parseFloat(match[3].replace(/,/g, ""));
    const change = Number.parseFloat(match[4]);
    if (!Number.isFinite(price) || price <= 0) continue;

    const previousClose = price - change;
    const changePercent =
      Number.isFinite(previousClose) && previousClose > 0
        ? (change / previousClose) * 100
        : 0;

    byTicker.set(ticker, {
      ticker,
      price,
      change,
      changePercent,
      currency: "NGN",
    });
  }

  return [...byTicker.values()].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );
}

import {
  fetchNgxPulseMarketTape,
  isNgxPulseConfigured,
} from "./ngx-pulse";

/** NGX daily tape — NGX Pulse when keyed, else kwayisi.org scrape. */
export async function fetchNgxMarketTape(): Promise<MarketTapeItem[]> {
  if (isNgxPulseConfigured()) {
    try {
      return await fetchNgxPulseMarketTape();
    } catch {
      /* fall through to kwayisi */
    }
  }
  return fetchNgxMarketTapeKwayisi();
}

/** All NGX listings with daily price change from kwayisi.org (delayed). */
async function fetchNgxMarketTapeKwayisi(): Promise<MarketTapeItem[]> {
  const cacheKey = "ngx:tape:kwayisi";
  const cached = getCached<MarketTapeItem[]>(cacheKey);
  if (cached) return cached;

  const headers = { "User-Agent": "PrivateMarketResearchAssistant/1.0" };
  const [page1, page2] = await Promise.all([
    fetch("https://afx.kwayisi.org/ngx/", { headers, next: { revalidate: 900 } }),
    fetch("https://afx.kwayisi.org/ngx/?page=2", {
      headers,
      next: { revalidate: 900 },
    }),
  ]);

  if (!page1.ok) {
    throw new Error("Could not load NGX market list");
  }

  const html =
    (await page1.text()) + (page2.ok ? await page2.text() : "");
  const items = parseNgxListHtml(html);

  setCached(cacheKey, items, CACHE_TTL.tape);
  return items;
}
