import type { AppSettings } from "@/lib/types";
import { generateId } from "@/lib/utils";

/** Safe defaults when DB/Supabase is unavailable (e.g. Vercel misconfig). */
export function defaultAppSettings(): AppSettings {
  const now = new Date().toISOString();
  let newsProvider = process.env.NEWS_PROVIDER ?? "free";
  if (newsProvider === "mock") newsProvider = "free";
  if (
    newsProvider === "free" &&
    process.env.NEWSDATA_API_KEY?.trim() &&
    process.env.NEWS_PROVIDER === "newsdata"
  ) {
    newsProvider = "newsdata";
  } else if (
    newsProvider === "free" &&
    process.env.NEWS_API_KEY?.trim() &&
    process.env.NEWS_PROVIDER === "newsapi"
  ) {
    newsProvider = "newsapi";
  }

  let financialProvider = process.env.FINANCIAL_PROVIDER ?? "auto";
  if (financialProvider === "mock" || financialProvider === "alphavantage") {
    financialProvider = "auto";
  }

  return {
    id: generateId(),
    defaultExchange: "NASDAQ",
    newsProvider,
    newsRegion: "usa",
    newsIngestionMode: "auto",
    financialProvider,
    aiModel: "deepseek-v4-flash",
    disclaimerAccepted: false,
    updatedAt: now,
  };
}
