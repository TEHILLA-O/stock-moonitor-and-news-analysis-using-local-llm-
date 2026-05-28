import { cache } from "react";
import { db } from "@/lib/db";

import { getCompanyNews } from "@/lib/data/news-data";

import {

  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";



export const getCompanyPageData = cache(async function getCompanyPageData(
  ticker: string
) {

  const company = await db.getCompanyByTicker(ticker);

  if (!company) return null;



  const settings = await db.getSettings();

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
      db.getAIAnalyses(company.id),
      db.getResearchNotes(company.id),
      db.getTrendSnapshots(company.id),
      getCompanyNews(company),
    ]);

  const financials =
    financialsResult ??
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
    } as Awaited<ReturnType<typeof fetchCompanyFinancials>>);



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

  };
});

