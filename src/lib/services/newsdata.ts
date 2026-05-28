/**
 * NewsData.io — https://newsdata.io/documentation
 */

import { generateId } from "@/lib/utils";
import type { NewsArticle, NewsRegion } from "@/lib/types";

export type NewsDataFetchParams = {
  ticker: string;
  companyName: string;
  companyId: string;
  limit?: number;
  region?: NewsRegion;
};

const COUNTRY_MAP: Record<NewsRegion, string> = {
  usa: "us",
  uk: "gb",
  china: "cn",
  nigeria: "ng",
};

type NewsDataArticle = {
  article_id?: string;
  title?: string;
  link?: string;
  description?: string;
  source_id?: string;
  source_name?: string;
  pubDate?: string;
};

type NewsDataResponse = {
  status?: string;
  results?: NewsDataArticle[];
  message?: string;
};

function mapArticles(
  results: NewsDataArticle[],
  companyId: string
): NewsArticle[] {
  const now = new Date().toISOString();
  return results
    .filter((a) => a.title && a.link)
    .map((article) => ({
      id: generateId(),
      companyId,
      title: article.title!,
      source: article.source_name ?? article.source_id ?? "NewsData.io",
      url: article.link!,
      summary: article.description ?? "",
      publishedAt: article.pubDate
        ? new Date(article.pubDate).toISOString()
        : now,
      fetchedAt: now,
    }));
}

async function newsDataRequest(
  params: Record<string, string>,
  apiKey: string
): Promise<NewsDataArticle[]> {
  const query = new URLSearchParams({
    apikey: apiKey,
    language: "en",
    ...params,
  });

  const res = await fetch(
    `https://newsdata.io/api/1/latest?${query.toString()}`,
    { next: { revalidate: 300 } }
  );

  const data = (await res.json()) as NewsDataResponse;

  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `NewsData.io failed (${res.status})`);
  }

  return data.results ?? [];
}

/** Latest headlines — regional or company-specific search. */
export async function fetchFromNewsData(
  params: NewsDataFetchParams,
  apiKey: string
): Promise<NewsArticle[]> {
  if (!apiKey) {
    throw new Error("NEWSDATA_API_KEY missing for NewsData.io mode");
  }

  const region = params.region ?? "usa";
  const country = COUNTRY_MAP[region];
  const size = String(Math.min(params.limit ?? 10, 50));

  if (params.ticker && params.companyName) {
    const q = `${params.ticker} OR "${params.companyName}"`;
    try {
      const companyResults = await newsDataRequest(
        { q, country, size },
        apiKey
      );
      if (companyResults.length > 0) {
        return mapArticles(companyResults, params.companyId);
      }
    } catch {
      /* fall through to regional */
    }
  }

  const regionalResults = await newsDataRequest({ country, size }, apiKey);
  return mapArticles(regionalResults, params.companyId);
}
