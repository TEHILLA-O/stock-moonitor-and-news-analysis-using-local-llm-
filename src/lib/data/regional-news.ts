import { db } from "@/lib/db";
import { fetchRegionalHeadlines } from "@/lib/services/freeNewsAggregator";
import {
  fetchFromNewsAPI,
  fetchFromNewsData,
} from "@/lib/services/newsService";
import type { NewsArticle, NewsRegion } from "@/lib/types";

/** Live regional headlines — works even with an empty watchlist. */
export async function getRegionalNews(
  region?: NewsRegion,
  limit = 24
): Promise<NewsArticle[]> {
  const settings = await db.getSettings();
  const newsRegion = region ?? settings.newsRegion;
  const newsDataKey = process.env.NEWSDATA_API_KEY?.trim();
  const newsApiKey = process.env.NEWS_API_KEY?.trim();
  const params = {
    ticker: "",
    companyName: "",
    companyId: "regional",
    limit,
    region: newsRegion,
  };

  try {
    if (newsDataKey && settings.newsProvider === "newsdata") {
      const fromApi = await fetchFromNewsData(params, newsDataKey);
      if (fromApi.length > 0) return fromApi;
    }
    if (newsApiKey && settings.newsProvider === "newsapi") {
      const fromApi = await fetchFromNewsAPI(params, newsApiKey);
      if (fromApi.length > 0) return fromApi;
    }
    if (newsDataKey && !newsApiKey) {
      const fromApi = await fetchFromNewsData(params, newsDataKey);
      if (fromApi.length > 0) return fromApi;
    }

    return await fetchRegionalHeadlines(newsRegion, limit);
  } catch {
    try {
      return await fetchRegionalHeadlines(newsRegion, limit);
    } catch {
      return [];
    }
  }
}
