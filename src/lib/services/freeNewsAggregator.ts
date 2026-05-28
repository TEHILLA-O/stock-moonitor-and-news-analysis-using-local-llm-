/**
 * Free news for USA, UK, China, Nigeria — no API keys required.
 * Combines The Hear (US/UK/China) with regional RSS + Google News RSS.
 */

import type { NewsArticle, NewsRegion } from "@/lib/types";
import { scrapeFreeNewsSources } from "./freeNewsScraper";
import { fetchTheHearNews } from "./theHearNews";

export interface FreeNewsParams {
  ticker: string;
  companyName: string;
  companyId: string;
  region: NewsRegion;
  limit?: number;
}

function matchesCompany(
  text: string,
  ticker: string,
  companyName: string
): boolean {
  const haystack = text.toLowerCase();
  const symbols = [ticker, companyName].filter(Boolean);
  return symbols.some((s) => haystack.includes(s.toLowerCase()));
}

function dedupeByUrl(articles: NewsArticle[]): NewsArticle[] {
  return Array.from(new Map(articles.map((a) => [a.url, a])).values());
}

/** Merge Hear + RSS; prefer company-related items when enough exist. */
export async function fetchFreeRegionalNews(
  params: FreeNewsParams
): Promise<NewsArticle[]> {
  const limit = params.limit ?? 12;
  const region = params.region;

  const [hearResult, rssResult] = await Promise.allSettled([
    fetchTheHearNews({ companyId: params.companyId, region, limit: limit * 2 }),
    scrapeFreeNewsSources({
      ticker: params.ticker,
      companyName: params.companyName,
      companyId: params.companyId,
      region,
      limit: limit * 2,
    }),
  ]);

  const hear =
    hearResult.status === "fulfilled" ? hearResult.value : [];
  const rss = rssResult.status === "fulfilled" ? rssResult.value : [];

  const merged = dedupeByUrl([...hear, ...rss]).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const companyNews = merged.filter((a) =>
    matchesCompany(
      `${a.title} ${a.summary}`,
      params.ticker,
      params.companyName
    )
  );

  if (companyNews.length >= Math.min(3, limit)) {
    return companyNews.slice(0, limit);
  }

  return merged.slice(0, limit);
}

/** Regional headlines (no watchlist company required). */
export async function fetchRegionalHeadlines(
  region: NewsRegion,
  limit = 20
): Promise<NewsArticle[]> {
  const companyId = "00000000-0000-4000-8000-000000000099";
  const [hearResult, rssResult] = await Promise.allSettled([
    fetchTheHearNews({ companyId, region, limit: limit * 2 }),
    scrapeFreeNewsSources({
      ticker: "stock market",
      companyName: "business",
      companyId,
      region,
      limit: limit * 2,
    }),
  ]);

  const hear = hearResult.status === "fulfilled" ? hearResult.value : [];
  const rss = rssResult.status === "fulfilled" ? rssResult.value : [];

  return dedupeByUrl([...hear, ...rss])
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}
