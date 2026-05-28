import { notFound } from "next/navigation";
import { getCompanyPageData } from "@/lib/data/company-data";
import { buildTechnicalDataFromOhlcv } from "@/lib/technical/indicators";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { TechnicalView } from "./technical-view";

export default async function TechnicalPage({
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

  const { snapshot } = buildTechnicalDataFromOhlcv(ohlcv);

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} Technical`}
        subtitle="Candlesticks, SMA, RSI, MACD — daily / weekly / monthly"
        icon="chart"
      />
      <CompanyNav ticker={company.ticker} />
      <TechnicalView
        ohlcv={ohlcv}
        snapshot={snapshot}
        dataSources={financials.dataSources}
      />
    </div>
  );
}
