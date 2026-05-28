/**
 * The Hear — free, keyless regional headlines API.
 * https://www.thehear.org/api
 */

import { generateId } from "@/lib/utils";
import type { NewsArticle, NewsRegion } from "@/lib/types";

const HEAR_COUNTRY: Partial<Record<NewsRegion, string>> = {
  usa: "us",
  uk: "uk",
  china: "china",
};

type HearHeadline = {
  sourceLabel?: string;
  headline?: string;
  subtitle?: string;
  link?: string;
  capturedAt?: string;
};

type HearResponse = {
  headlines?: HearHeadline[];
};

export function isTheHearSupported(region: NewsRegion): boolean {
  return region in HEAR_COUNTRY;
}

export async function fetchTheHearNews(params: {
  companyId: string;
  region: NewsRegion;
  limit?: number;
}): Promise<NewsArticle[]> {
  const countryKey = HEAR_COUNTRY[params.region];
  if (!countryKey) return [];

  const res = await fetch(
    `https://www.thehear.org/api/country-view/${countryKey}`,
    {
      headers: { "User-Agent": "PrivateMarketResearchAssistant/1.0" },
      next: { revalidate: 900 },
    }
  );

  if (!res.ok) {
    throw new Error(`The Hear API failed (${res.status})`);
  }

  const data = (await res.json()) as HearResponse;
  const limit = params.limit ?? 20;

  return (data.headlines ?? [])
    .filter((h) => h.headline && h.link)
    .slice(0, limit)
    .map((h) => ({
      id: generateId(),
      companyId: params.companyId,
      title: h.headline!,
      source: h.sourceLabel ?? "The Hear",
      url: h.link!,
      summary: h.subtitle ?? "",
      publishedAt: h.capturedAt ?? new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    }));
}
