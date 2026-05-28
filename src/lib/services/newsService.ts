/**
 * News provider abstraction layer.
 * NewsAPI, Finnhub, FMP, scrape fallbacks, and free sources.
 */

import { generateId } from "@/lib/utils";
import type { NewsArticle, NewsIngestionMode, NewsRegion } from "@/lib/types";
import { fetchFreeRegionalNews } from "./freeNewsAggregator";
import { fetchFromNewsData } from "./newsdata";
import { scrapeFreeNewsSources } from "./freeNewsScraper";

export type NewsProvider =
  | "free"
  | "newsdata"
  | "newsapi"
  | "finnhub"
  | "fmp"
  | "gdelt"
  | "serpapi"
  | "alphavantage";

export interface FetchNewsParams {
  ticker: string;
  companyName: string;
  companyId: string;
  limit?: number;
  region?: NewsRegion;
}

export interface NewsServiceConfig {
  provider: NewsProvider;
  apiKey?: string;
  mode?: NewsIngestionMode;
  region?: NewsRegion;
}

const COUNTRY_MAP: Record<NewsRegion, string> = {
  usa: "us",
  uk: "gb",
  china: "cn",
  nigeria: "ng",
};

/** Free-tier top-headlines often only returns US; use everything for other regions. */
const REGION_EVERYTHING_FALLBACK: Record<
  NewsRegion,
  Record<string, string> | null
> = {
  usa: null,
  uk: {
    domains: "bbc.co.uk,reuters.com,ft.com,theguardian.com",
    language: "en",
    sortBy: "publishedAt",
  },
  china: {
    q: "China economy OR China markets OR Beijing business",
    language: "en",
    sortBy: "publishedAt",
  },
  nigeria: {
    q: "Nigeria economy OR Lagos business",
    language: "en",
    sortBy: "publishedAt",
  },
};

type NewsApiArticle = {
  title: string;
  url: string;
  description?: string;
  source?: { name?: string };
  publishedAt?: string;
};

function getNewsDataKey(): string | undefined {
  return process.env.NEWSDATA_API_KEY?.trim() || undefined;
}

function getNewsApiKey(): string | undefined {
  return process.env.NEWS_API_KEY?.trim() || undefined;
}

function getProvider(): NewsProvider {
  const env = process.env.NEWS_PROVIDER;
  if (env && env !== "mock") return env as NewsProvider;
  if (getNewsDataKey()) return "newsdata";
  if (getNewsApiKey()) return "newsapi";
  return "free";
}

export { fetchFromNewsData };

/** Map persisted settings / env values to a live provider (no mock). */
export function resolveNewsProvider(configProvider?: string): NewsProvider {
  if (!configProvider || configProvider === "mock") {
    return getProvider();
  }
  return configProvider as NewsProvider;
}

/** Free multi-source feed (The Hear + RSS) — no API key. */
export async function fetchFromFreeSources(
  params: FetchNewsParams
): Promise<NewsArticle[]> {
  const region = params.region ?? "usa";
  return fetchFreeRegionalNews({
    ticker: params.ticker,
    companyName: params.companyName,
    companyId: params.companyId,
    region,
    limit: params.limit ?? 12,
  });
}

function resolveProvider(configProvider?: string): NewsProvider {
  return resolveNewsProvider(configProvider);
}

function getMode(): NewsIngestionMode {
  const env = process.env.NEWS_INGESTION_MODE as NewsIngestionMode | undefined;
  return env ?? "auto";
}

function mapNewsApiArticles(
  articles: NewsApiArticle[],
  companyId: string
): NewsArticle[] {
  return articles
    .filter((a) => a.title && a.url)
    .map((article) => ({
      id: generateId(),
      companyId,
      title: article.title,
      source: article.source?.name ?? "NewsAPI",
      url: article.url,
      summary: article.description ?? "",
      publishedAt: article.publishedAt ?? new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    }));
}

async function newsApiRequest(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<NewsApiArticle[]> {
  const query = new URLSearchParams(params);
  const url = `https://newsapi.org/v2/${path}?${query.toString()}`;

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  const data = (await res.json()) as {
    status?: string;
    code?: string;
    message?: string;
    totalResults?: number;
    articles?: NewsApiArticle[];
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? `NewsAPI request failed (${res.status})`
    );
  }

  if (data.status === "error") {
    throw new Error(data.message ?? "NewsAPI returned an error");
  }

  return data.articles ?? [];
}

/** NewsAPI — https://newsapi.org/docs */
export async function fetchFromNewsAPI(
  params: FetchNewsParams,
  apiKey: string
): Promise<NewsArticle[]> {
  if (!apiKey) {
    throw new Error("NEWS_API_KEY missing for NewsAPI mode");
  }

  const region = params.region ?? "usa";
  const country = COUNTRY_MAP[region];
  const limit = String(params.limit ?? 10);

  if (params.ticker) {
    const companyQuery = `${params.ticker} OR "${params.companyName}"`;
    try {
      const companyArticles = await newsApiRequest(
        "everything",
        {
          q: companyQuery,
          language: "en",
          sortBy: "publishedAt",
          pageSize: limit,
        },
        apiKey
      );

      if (companyArticles.length > 0) {
        return mapNewsApiArticles(companyArticles, params.companyId);
      }
    } catch {
      // Fall through to regional headlines
    }
  }

  const regionalArticles = await newsApiRequest(
    "top-headlines",
    {
      country,
      pageSize: limit,
    },
    apiKey
  );

  if (regionalArticles.length > 0) {
    return mapNewsApiArticles(regionalArticles, params.companyId);
  }

  const everythingFallback = REGION_EVERYTHING_FALLBACK[region];
  if (everythingFallback) {
    const fallbackArticles = await newsApiRequest(
      "everything",
      { ...everythingFallback, pageSize: limit },
      apiKey
    );
    if (fallbackArticles.length > 0) {
      return mapNewsApiArticles(fallbackArticles, params.companyId);
    }
  }

  return [];
}

/** Finnhub — https://finnhub.io/docs/api/company-news */
export async function fetchFromFinnhub(
  params: FetchNewsParams,
  apiKey: string
): Promise<NewsArticle[]> {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    symbol: params.ticker,
    from,
    to,
    token: apiKey,
  });

  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?${query.toString()}`,
    { next: { revalidate: 600 } }
  );
  if (!res.ok) throw new Error(`Finnhub news failed (${res.status})`);

  const data = (await res.json()) as Array<{
    headline?: string;
    url?: string;
    summary?: string;
    source?: string;
    datetime?: number;
  }>;

  return data
    .filter((a) => a.headline && a.url)
    .slice(0, params.limit ?? 12)
    .map((article) => ({
      id: generateId(),
      companyId: params.companyId,
      title: article.headline!,
      source: article.source ?? "Finnhub",
      url: article.url!,
      summary: article.summary ?? "",
      publishedAt: article.datetime
        ? new Date(article.datetime * 1000).toISOString()
        : new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    }));
}

/** Financial Modeling Prep */
export async function fetchFromFMP(
  _params: FetchNewsParams,
  _apiKey: string
): Promise<NewsArticle[]> {
  throw new Error("FMP news integration not yet implemented. Use the free or newsapi provider instead.");
}

/** GDELT */
export async function fetchFromGDELT(
  _params: FetchNewsParams
): Promise<NewsArticle[]> {
  throw new Error("GDELT integration not yet implemented. Use the free or newsapi provider instead.");
}

/** SerpAPI */
export async function fetchFromSerpAPI(
  _params: FetchNewsParams,
  _apiKey: string
): Promise<NewsArticle[]> {
  throw new Error("SerpAPI integration not yet implemented. Use the free or newsapi provider instead.");
}

/** Alpha Vantage */
export async function fetchFromAlphaVantage(
  _params: FetchNewsParams,
  _apiKey: string
): Promise<NewsArticle[]> {
  throw new Error("Alpha Vantage news integration not yet implemented. Use the free or newsapi provider instead.");
}

export async function fetchCompanyNews(
  params: FetchNewsParams,
  config?: Partial<NewsServiceConfig>
): Promise<NewsArticle[]> {
  const provider = resolveProvider(config?.provider);
  const newsDataKey = getNewsDataKey();
  const newsApiKey = getNewsApiKey();
  const apiKey =
    config?.apiKey ??
    (provider === "newsdata" ? newsDataKey : newsApiKey);
  const region = config?.region ?? params.region ?? "usa";
  const mode = config?.mode ?? getMode();

  if (mode === "scrape") {
    return scrapeFreeNewsSources({ ...params, region });
  }

  if (mode === "api") {
    switch (provider) {
      case "free":
        return fetchFromFreeSources({ ...params, region });
      case "newsdata":
        return fetchFromNewsData({ ...params, region }, apiKey ?? newsDataKey!);
      case "newsapi":
        return fetchFromNewsAPI({ ...params, region }, apiKey ?? newsApiKey!);
      case "finnhub":
        return fetchFromFinnhub(params, apiKey!);
      case "fmp":
        return fetchFromFMP(params, apiKey!);
      case "gdelt":
        return fetchFromGDELT(params);
      case "serpapi":
        return fetchFromSerpAPI(params, apiKey!);
      case "alphavantage":
        return fetchFromAlphaVantage(params, apiKey!);
      default:
        return fetchFromFreeSources({ ...params, region });
    }
  }

  const finnhubKey = process.env.FINNHUB_API_KEY;

  async function fetchPrimaryApi(): Promise<NewsArticle[]> {
    if (provider === "newsdata" && newsDataKey) {
      return fetchFromNewsData({ ...params, region }, newsDataKey);
    }
    if (provider === "newsapi" && newsApiKey) {
      return fetchFromNewsAPI({ ...params, region }, newsApiKey);
    }
    if (newsDataKey) {
      return fetchFromNewsData({ ...params, region }, newsDataKey);
    }
    if (newsApiKey) {
      return fetchFromNewsAPI({ ...params, region }, newsApiKey);
    }
    return [];
  }

  try {
    if (provider === "finnhub" && finnhubKey) {
      return fetchFromFinnhub(params, finnhubKey);
    }

    const freeArticles = await fetchFromFreeSources({ ...params, region });
    if (freeArticles.length > 0) {
      if (provider === "finnhub" && finnhubKey) {
        try {
          const fh = await fetchFromFinnhub(params, finnhubKey);
          const merged = [
            ...fh,
            ...freeArticles.filter((f) => !fh.some((a) => a.url === f.url)),
          ];
          return merged.slice(0, params.limit ?? 12);
        } catch {
          // use free only
        }
      }
      if (!newsDataKey && !newsApiKey) {
        return freeArticles;
      }
      const apiArticles = await fetchPrimaryApi();
      if (apiArticles.length === 0) return freeArticles;
      const merged = [
        ...apiArticles,
        ...freeArticles.filter((f) => !apiArticles.some((a) => a.url === f.url)),
      ];
      return merged.slice(0, params.limit ?? 12);
    }

    const apiArticles = await fetchPrimaryApi();
    if (apiArticles.length > 0) return apiArticles;

    return await scrapeFreeNewsSources({ ...params, region });
  } catch {
    try {
      return await fetchFromFreeSources({ ...params, region });
    } catch {
      return [];
    }
  }
}
