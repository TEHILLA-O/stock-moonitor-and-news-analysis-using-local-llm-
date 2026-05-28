import { db } from "@/lib/db";
import { fetchRegionalHeadlines } from "@/lib/services/freeNewsAggregator";
import { fetchFromNewsAPI } from "@/lib/services/newsService";
import type { NewsArticle, NewsRegion } from "@/lib/types";

/** Live regional headlines — works even with an empty watchlist. */
export async function getRegionalNews(
  region?: NewsRegion,
  limit = 24
): Promise<NewsArticle[]> {
  const settings = await db.getSettings();
  const newsRegion = region ?? settings.newsRegion;
  const apiKey = process.env.NEWS_API_KEY;

  try {
    if (apiKey && settings.newsProvider === "newsapi") {
      const fromApi = await fetchFromNewsAPI(
        {
          ticker: "",
          companyName: "",
          companyId: "regional",
          limit,
          region: newsRegion,
        },
        apiKey
      );
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
