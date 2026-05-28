export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import {
  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";
import { CompanyCard } from "@/components/company/company-card";
import { GlassHeader } from "@/components/layout/glass-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SystemStatusBanner } from "@/components/layout/system-status-banner";

export default async function DashboardPage() {
  const companies = await db.getCompanies();
  const settings = await db.getSettings();

  const cards = await Promise.all(
    companies.map(async (company) => {
      const analyses = await db.getAIAnalyses(company.id);
      try {
        const financials = await fetchCompanyFinancials(
          {
            ticker: company.ticker,
            exchange: company.exchange,
            country: company.country,
          },
          { provider: resolveFinancialProvider(settings.financialProvider) }
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

        return {
          company,
          price: financials.currentPrice,
          changePercent,
          latestAnalysis: analyses[0] ?? null,
        };
      } catch {
        return {
          company,
          price: undefined,
          changePercent: 0,
          latestAnalysis: analyses[0] ?? null,
        };
      }
    })
  );

  const avgScore =
    cards.filter((c) => c.latestAnalysis).length > 0
      ? Math.round(
          cards
            .filter((c) => c.latestAnalysis)
            .reduce((sum, c) => sum + (c.latestAnalysis?.overallScore ?? 0), 0) /
            cards.filter((c) => c.latestAnalysis).length
        )
      : null;

  return (
    <div className="space-y-8">
      <GlassHeader
        title="Research Dashboard"
        subtitle="Private investment research — not financial advice"
        icon="dashboard"
        action={
          <Link href="/watchlist">
            <Button>
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </Link>
        }
      />

      <SystemStatusBanner />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Watchlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gradient">{companies.length}</p>
            <p className="text-xs text-slate-600">companies tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Avg AI Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-violet-300">{avgScore ?? "—"}</p>
            <p className="text-xs text-slate-600">across analyzed stocks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
              AI Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <p className="text-lg font-semibold text-slate-200">{settings.aiModel}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Your Companies
        </h2>
        {cards.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-slate-400">No companies yet.</p>
              <Link href="/watchlist" className="mt-4 inline-block">
                <Button>Add your first company</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <CompanyCard
                key={c.company.id}
                company={c.company}
                price={c.price}
                changePercent={c.changePercent}
                latestAnalysis={c.latestAnalysis}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
