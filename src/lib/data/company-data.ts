import { cache } from "react";
import { db } from "@/lib/db";
import { getCompanyNews } from "@/lib/data/news-data";
import { resolveCompanyForTicker } from "@/lib/data/resolve-company";
import {
  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";
import { resolveListingCurrency } from "@/lib/utils";

export const getCompanyPageData = cache(async function getCompanyPageData(
  ticker: string
) {
  const company = await resolveCompanyForTicker(ticker);
  if (!company) return null;

  const settings = await db.getSettings();
  const inWatchlist = !company.id.startsWith("browse-");

  const [financialsResult, analyses, researchNotes, trends, news] =
    await Promise.all([
      fetchCompanyFinancials(
        {
          ticker: company.ticker,
          exchange: company.exchange,
          country: company.country,
        },
        {
          provider: resolveFinancialProvider(settings.financialProvider),
        }
      ).catch(() => null),
      inWatchlist ? db.getAIAnalyses(company.id) : Promise.resolve([]),
      inWatchlist ? db.getResearchNotes(company.id) : Promise.resolve([]),
      inWatchlist ? db.getTrendSnapshots(company.id) : Promise.resolve([]),
      getCompanyNews(company, { skipCache: !inWatchlist }),
    ]);

  const financials = {
    ...(financialsResult ??
      ({
        currentPrice: 0,
        marketCap: 0,
        peRatio: null,
        eps: null,
        revenue: 0,
        netIncome: 0,
        freeCashFlow: 0,
        totalDebt: 0,
        cash: 0,
        dividendYield: null,
        analystTarget: null,
        priceHistory: [],
        ohlcvHistory: [],
        dataSources: [],
        isDelayed: true,
      } as Awaited<ReturnType<typeof fetchCompanyFinancials>>)),
    currency: resolveListingCurrency(
      company.exchange,
      company.country,
      financialsResult?.currency
    ),
  };

  const latestAnalysis = analyses[0] ?? null;

  const changePercent =
    financials.priceHistory.length >= 2
      ? ((financials.currentPrice -
          financials.priceHistory[financials.priceHistory.length - 2].price) /
          financials.priceHistory[financials.priceHistory.length - 2].price) *
        100
      : 0;

  return {
    company,
    financials,
    analyses,
    latestAnalysis,
    researchNotes,
    trends,
    changePercent,
    news,
    inWatchlist,
  };
});
