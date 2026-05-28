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
  const settings = await db.getSettings();
  const config = newsConfigFromSettings(settings);
  if (options?.limit) config.limit = options.limit;
  if (options?.region) config.region = options.region;
  if (options?.mode) config.mode = options.mode;

  return ensureFreshCompanyNews(company, config, {
    force: options?.force,
    skipCache: options?.skipCache,
  });
}
