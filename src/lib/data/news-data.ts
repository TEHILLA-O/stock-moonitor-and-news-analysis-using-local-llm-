import { db } from "@/lib/db";
import type { NewsArticle, NewsIngestionMode, NewsRegion } from "@/lib/types";
import {
  ensureFreshCompanyNews,
  newsConfigFromSettings,
} from "@/lib/news/refresh";

export async function getCompanyNews(
  company: { id: string; ticker: string; name: string },
  options?: {
    force?: boolean;
    skipCache?: boolean;
    limit?: number;
    region?: NewsRegion;
    mode?: NewsIngestionMode;
  }
): Promise<NewsArticle[]> {
  try {
    const settings = await db.getSettings();
    const config = newsConfigFromSettings(settings);
    if (options?.limit) config.limit = options.limit;
    if (options?.region) config.region = options.region;
    if (options?.mode) config.mode = options.mode;

    return await ensureFreshCompanyNews(company, config, {
      force: options?.force,
      skipCache: options?.skipCache,
    });
  } catch {
    return [];
  }
}

/** Read cached news from DB only — no external API (fast page loads). */
export async function getCachedCompanyNewsOnly(
  companyId: string,
  limit = 4
): Promise<NewsArticle[]> {
  try {
    const articles = await db.getNewsArticles(companyId);
    return articles.slice(0, limit);
  } catch {
    return [];
  }
}
