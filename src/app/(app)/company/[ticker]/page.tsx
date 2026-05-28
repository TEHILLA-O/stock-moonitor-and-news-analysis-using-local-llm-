import { notFound } from "next/navigation";
import { NewsAgeLabel } from "@/components/news/news-age-label";
import Link from "next/link";
import { getCompanyPageData } from "@/lib/data/company-data";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { MetricsGrid } from "@/components/company/metrics-grid";
import { AnalysisPanel } from "@/components/company/analysis-panel";
import { PriceChart } from "@/components/charts/price-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasNgxPulseKey } from "@/lib/config/env";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyPageData(ticker);
  if (!data) notFound();

  const { company, financials, news, latestAnalysis, analyses, trends, changePercent } = data;
  const positive = changePercent >= 0;
  const currency = financials.currency;
  const isNgx = company.exchange?.toUpperCase() === "NGX" || company.country === "Nigeria";
  const limitedHistory =
    financials.priceHistory.length > 0 && financials.priceHistory.length < 30;

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} · ${company.name}`}
        subtitle={`${company.exchange} · ${company.sector} · ${company.country}`}
        icon="chart"
        step={{ current: 1, total: 4 }}
        action={
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-100">
              {formatCurrency(financials.currentPrice, { currency })}
            </p>
            <p
              className={cn(
                "text-sm font-semibold",
                positive ? "text-cyan-400" : "text-fuchsia-400"
              )}
            >
              {formatPercent(changePercent)}
            </p>
            <Badge variant="secondary" className="mt-2">
              {company.status}
            </Badge>
          </div>
        }
      />
      <CompanyNav ticker={company.ticker} />

      {isNgx && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">NGX listing — Nigerian Naira (₦) pricing</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Yahoo Finance does not cover most NGX tickers. Prices use{" "}
            {hasNgxPulseKey()
              ? "NGX Pulse API"
              : "a free NGX feed"}
            {limitedHistory ? " (chart history may be limited)" : ""}. SEC filings are
            not available for Nigerian companies.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart data={financials.priceHistory} />
        </CardContent>
      </Card>

      <MetricsGrid financials={financials} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest News</CardTitle>
            <Link
              href={`/company/${company.ticker}/news`}
              className="text-sm text-cyan-400 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.slice(0, 3).map((article) => (
              <div key={article.id} className="border-b border-white/5 pb-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">{article.title}</p>
                  <NewsAgeLabel publishedAt={article.publishedAt} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{article.source}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart trends={trends} />
          </CardContent>
        </Card>
      </div>

      <AnalysisPanel
        companyId={company.id}
        companyTicker={company.ticker}
        companyName={company.name}
        latestAnalysis={latestAnalysis}
        analyses={analyses}
      />
    </div>
  );
}
