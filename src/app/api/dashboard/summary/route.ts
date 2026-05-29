import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { defaultAppSettings } from "@/lib/db/default-settings";
import {
  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";

export const dynamic = "force-dynamic";

export async function GET() {
  const companies = await db.getCompanies().catch(() => []);
  if (companies.length === 0) {
    return NextResponse.json({ prices: [] });
  }

  const settings = await db.getSettings().catch(() => defaultAppSettings());
  const provider = resolveFinancialProvider(settings.financialProvider);

  const results = await Promise.allSettled(
    companies.map(async (company) => {
      const financials = await fetchCompanyFinancials(
        {
          ticker: company.ticker,
          exchange: company.exchange,
          country: company.country,
        },
        { provider }
      );

      const changePercent =
        financials.priceHistory.length >= 2
          ? ((financials.currentPrice -
              financials.priceHistory[financials.priceHistory.length - 2]
                .price) /
              financials.priceHistory[financials.priceHistory.length - 2]
                .price) *
            100
          : 0;

      void db
        .addStockSnapshot({
          companyId: company.id,
          price: financials.currentPrice,
          changePercent,
          volume: 0,
          recordedAt: new Date().toISOString(),
        })
        .catch(() => {});

      return {
        companyId: company.id,
        ticker: company.ticker,
        price: financials.currentPrice,
        changePercent,
      };
    })
  );

  const prices = results
    .filter(
      (r): r is PromiseFulfilledResult<{
        companyId: string;
        ticker: string;
        price: number;
        changePercent: number;
      }> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  return NextResponse.json(
    { prices },
    {
      headers: {
        "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
