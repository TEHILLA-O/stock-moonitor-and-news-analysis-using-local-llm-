import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialMetrics } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface MetricsGridProps {
  financials: FinancialMetrics;
}

export function MetricsGrid({ financials }: MetricsGridProps) {
  const currency = financials.currency;
  const metrics = [
    {
      label: "Current Price",
      value: formatCurrency(financials.currentPrice, { currency }),
    },
    {
      label: "Market Cap",
      value: formatCurrency(financials.marketCap, { compact: true, currency }),
    },
    { label: "P/E Ratio", value: financials.peRatio?.toFixed(1) ?? "—" },
    { label: "EPS", value: financials.eps ? `$${financials.eps.toFixed(2)}` : "—" },
    {
      label: "Revenue",
      value: formatCurrency(financials.revenue, { compact: true, currency }),
    },
    {
      label: "Net Income",
      value: formatCurrency(financials.netIncome, { compact: true, currency }),
    },
    {
      label: "Profit Margin",
      value:
        financials.profitMargin != null
          ? `${financials.profitMargin.toFixed(1)}%`
          : "—",
    },
    {
      label: "Free Cash Flow",
      value: formatCurrency(financials.freeCashFlow, { compact: true, currency }),
    },
    {
      label: "Total Debt",
      value: formatCurrency(financials.totalDebt, { compact: true, currency }),
    },
    { label: "Cash", value: formatCurrency(financials.cash, { compact: true, currency }) },
    {
      label: "Dividend Yield",
      value: financials.dividendYield != null ? `${financials.dividendYield.toFixed(2)}%` : "—",
    },
    {
      label: "Institutional Ownership",
      value:
        financials.institutionalOwnership != null
          ? `${financials.institutionalOwnership.toFixed(1)}%`
          : "—",
    },
    {
      label: "52-Week High",
      value: financials.fiftyTwoWeekHigh
        ? formatCurrency(financials.fiftyTwoWeekHigh, { currency })
        : "—",
    },
    {
      label: "52-Week Low",
      value: financials.fiftyTwoWeekLow
        ? formatCurrency(financials.fiftyTwoWeekLow, { currency })
        : "—",
    },
    {
      label: "Analyst Target",
      value: financials.analystTarget
        ? formatCurrency(financials.analystTarget, { currency })
        : "—",
    },
    {
      label: "Upside to Target",
      value: financials.analystTarget
        ? `${formatNumber(((financials.analystTarget - financials.currentPrice) / financials.currentPrice) * 100)}%`
        : "—",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-slate-500">
              {m.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-lg font-semibold text-slate-100">{m.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
