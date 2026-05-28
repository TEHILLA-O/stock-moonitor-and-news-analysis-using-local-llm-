import { notFound } from "next/navigation";
import { getCompanyPageData } from "@/lib/data/company-data";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { MetricsGrid } from "@/components/company/metrics-grid";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { buildTechnicalDataFromOhlcv } from "@/lib/technical/indicators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function FinancialsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyPageData(ticker);
  if (!data) notFound();

  const { company, financials } = data;
  const ohlcv =
    financials.ohlcvHistory ??
    financials.priceHistory.map((p) => ({
      date: p.date,
      open: p.price,
      high: p.price,
      low: p.price,
      close: p.price,
      volume: 0,
    }));
  const { rows } = buildTechnicalDataFromOhlcv(ohlcv);

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} Financials`}
        subtitle="Fundamentals & price history"
        icon="financials"
        step={{ current: 2, total: 5 }}
      />
      <CompanyNav ticker={company.ticker} />

      <Card>
        <CardHeader>
          <CardTitle>Price & Volume (daily)</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <CandlestickChart
              data={rows}
              enableZoom
              initialVisibleBars={126}
            />
          ) : (
            <p className="text-sm text-slate-500">No price data available.</p>
          )}
        </CardContent>
      </Card>

      <MetricsGrid financials={financials} />

      <Card>
        <CardContent className="space-y-2 py-4">
          <p className="text-xs text-slate-500">
            Data:{" "}
            {financials.dataSources?.length
              ? financials.dataSources.join(" · ")
              : "unavailable"}
            {financials.isDelayed !== false
              ? " · Free feeds are delayed and rate-limited — fine for private research, not live trading."
              : ""}
          </p>
          <Link
            href={`/company/${company.ticker}/filings`}
            className="text-xs text-cyan-400 hover:underline"
          >
            View SEC filings →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
