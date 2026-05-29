export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { getDashboardDataFast } from "@/lib/data/dashboard-data";
import { DashboardGrid } from "@/components/company/dashboard-grid";
import { GlassHeader } from "@/components/layout/glass-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SystemStatusBanner } from "@/components/layout/system-status-banner";

export default async function DashboardPage() {
  const { cards, settings, companies } = await getDashboardDataFast();

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
        <DashboardGrid initialCards={cards} companies={companies} />
      </div>
    </div>
  );
}
