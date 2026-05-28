import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const companyId = request.nextUrl.searchParams.get("companyId");

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const settings = await db.getSettings();
  const financials = await fetchCompanyFinancials(
    { ticker },
    { provider: resolveFinancialProvider(settings.financialProvider) }
  );

  if (companyId) {
    await db.addFinancialSnapshot({
      companyId,
      marketCap: financials.marketCap,
      peRatio: financials.peRatio,
      eps: financials.eps,
      revenue: financials.revenue,
      netIncome: financials.netIncome,
      freeCashFlow: financials.freeCashFlow,
      totalDebt: financials.totalDebt,
      cash: financials.cash,
      dividendYield: financials.dividendYield,
      analystTarget: financials.analystTarget,
      recordedAt: new Date().toISOString(),
    });
    await db.addStockSnapshot({
      companyId,
      price: financials.currentPrice,
      changePercent:
        financials.priceHistory.length >= 2
          ? ((financials.currentPrice - financials.priceHistory.at(-2)!.price) /
              financials.priceHistory.at(-2)!.price) *
            100
          : 0,
      volume: 0,
      recordedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(financials);
}
