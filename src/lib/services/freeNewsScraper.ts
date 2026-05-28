import { generateId } from "@/lib/utils";
import type { NewsArticle, NewsRegion } from "@/lib/types";

interface ScrapeParams {
  ticker: string;
  companyName: string;
  companyId: string;
  region: NewsRegion;
  limit?: number;
}

const GOOGLE_REGION: Record<NewsRegion, { hl: string; gl: string; ceid: string }> = {
  usa: { hl: "en-US", gl: "US", ceid: "US:en" },
  uk: { hl: "en-GB", gl: "GB", ceid: "GB:en" },
  china: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  nigeria: { hl: "en-NG", gl: "NG", ceid: "NG:en" },
};

/** Public RSS feeds — no API keys, per region. */
const REGIONAL_FEEDS: Record<NewsRegion, string[]> = {
  usa: [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
    "https://feeds.marketwatch.com/marketwatch/topstories/",
  ],
  uk: [
    "https://www.theguardian.com/uk/business/rss",
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
  ],
  china: [
    "https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    "https://www.scmp.com/rss/91/feed",
    "https://feeds.bbci.co.uk/news/world/asia/china/rss.xml",
  ],
  nigeria: [
    "https://businessday.ng/feed/",
    "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/",
    "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
  ],
};

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function parseRssItems(
  xml: string
): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => {
    const title = item.match(
      /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i
    );
    const link = item.match(/<link>(.*?)<\/link>/i);
    const description = item.match(
      /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i
    );
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/i);

    return {
      title: stripTags((title?.[1] ?? title?.[2] ?? "").trim()),
      link: (link?.[1] ?? "").trim(),
      description: stripTags(
        (description?.[1] ?? description?.[2] ?? "").trim()
      ),
      pubDate: (pubDate?.[1] ?? new Date().toUTCString()).trim(),
    };
  });
}

function googleRssUrl(
  ticker: string,
  companyName: string,
  region: NewsRegion
): string {
  const geo = GOOGLE_REGION[region];
  const q = encodeURIComponent(
    `${ticker} OR "${companyName}" stock market`
  );
  return `https://news.google.com/rss/search?q=${q}&hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
}

/** Regional top-headlines via Google News (no API key). */
export function googleNewsRegionalRssUrl(region: NewsRegion): string {
  const geo = GOOGLE_REGION[region];
  return `https://news.google.com/rss?hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
}

export async function scrapeFreeNewsSources(
  params: ScrapeParams
): Promise<NewsArticle[]> {
  const urls = [
    googleRssUrl(params.ticker, params.companyName, params.region),
    googleNewsRegionalRssUrl(params.region),
    ...REGIONAL_FEEDS[params.region],
  ];

  const responses = await Promise.allSettled(
    urls.map(async (url) => {
      const r = await fetch(url, {
        headers: { "User-Agent": "PrivateMarketResearchAssistant/1.0" },
        next: { revalidate: 300 },
      });
      if (!r.ok) throw new Error(`Failed feed: ${url}`);
      return r.text();
    })
  );

  const collected = responses
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .flatMap((r) => parseRssItems(r.value))
    .filter((item) => item.title && item.link);

  const deduped = Array.from(
    new Map(collected.map((item) => [item.link, item])).values()
  );
  const limited = deduped.slice(0, params.limit ?? 12);

  return limited.map((item) => ({
    id: generateId(),
    companyId: params.companyId,
    title: item.title,
    source: params.region.toUpperCase(),
    url: item.link,
    summary: item.description || "No summary available.",
    publishedAt: new Date(item.pubDate).toISOString(),
    fetchedAt: new Date().toISOString(),
  }));
}
