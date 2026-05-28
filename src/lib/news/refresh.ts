import type { NewsArticle } from "@/lib/types";
import type { NewsIngestionMode, NewsRegion } from "@/lib/types";
import { db } from "@/lib/db";
import {
  fetchCompanyNews,
  type NewsProvider,
} from "@/lib/services/newsService";

/** Refresh cached news once per calendar day. */
export const NEWS_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function getLatestFetchedAt(articles: NewsArticle[]): Date | null {
  if (articles.length === 0) return null;
  const latestMs = Math.max(
    ...articles.map((a) => new Date(a.fetchedAt).getTime())
  );
  return Number.isFinite(latestMs) ? new Date(latestMs) : null;
}

export function isNewsStale(
  articles: NewsArticle[],
  now = Date.now()
): boolean {
  if (articles.length === 0) return true;
  const latest = getLatestFetchedAt(articles);
  if (!latest) return true;
  return now - latest.getTime() >= NEWS_REFRESH_INTERVAL_MS;
}

/** Keep AI tags on articles that still appear in the fresh fetch. */
export function mergeNewsArticles(
  existing: NewsArticle[],
  fresh: NewsArticle[]
): NewsArticle[] {
  const byUrl = new Map(existing.map((a) => [a.url, a]));
  return fresh.map((article) => {
    const prev = byUrl.get(article.url);
    if (!prev) return article;
    return {
      ...article,
      id: prev.id,
      classification: prev.classification ?? article.classification,
      sentimentScore: prev.sentimentScore ?? article.sentimentScore,
      aiExplanation: prev.aiExplanation ?? article.aiExplanation,
    };
  });
}

export type NewsFetchConfig = {
  provider: string;
  region: NewsRegion;
  mode: NewsIngestionMode;
  limit?: number;
};

export async function ensureFreshCompanyNews(
  company: { id: string; ticker: string; name: string },
  config: NewsFetchConfig,
  options?: { force?: boolean; skipCache?: boolean }
): Promise<NewsArticle[]> {
  const skipPersist = options?.skipCache || company.id.startsWith("browse-");

  let articles = skipPersist ? [] : await db.getNewsArticles(company.id);

  if (!options?.force && !skipPersist && !isNewsStale(articles)) {
    return articles;
  }

  const fresh = await fetchCompanyNews(
    {
      ticker: company.ticker,
      companyName: company.name,
      companyId: company.id,
      limit: config.limit ?? 12,
      region: config.region,
    },
    {
      provider: config.provider as NewsProvider,
      region: config.region,
      mode: config.mode,
    }
  );

  articles = mergeNewsArticles(articles, fresh);
  if (!skipPersist) {
    await db.setNewsArticles(company.id, articles);
  }
  return articles;
}

export function newsConfigFromSettings(settings: {
  newsProvider: string;
  newsRegion: NewsRegion;
  newsIngestionMode: NewsIngestionMode;
}): NewsFetchConfig {
  return {
    provider: settings.newsProvider,
    region: settings.newsRegion,
    mode: settings.newsIngestionMode,
  };
}
