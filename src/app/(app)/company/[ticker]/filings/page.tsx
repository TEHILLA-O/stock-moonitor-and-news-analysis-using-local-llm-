import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { getCompanyPageData } from "@/lib/data/company-data";
import { fetchCompanyFilings } from "@/lib/services/financialDataService";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { NewsAgeLabel } from "@/components/news/news-age-label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FilingsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyPageData(ticker);
  if (!data) notFound();

  const { company } = data;
  const filings = await fetchCompanyFilings(company.ticker);

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} SEC Filings`}
        subtitle="Official 10-K, 10-Q, 8-K from SEC EDGAR (free)"
        icon="financials"
      />
      <CompanyNav ticker={company.ticker} />

      <p className="text-xs text-slate-500">
        Source: SEC EDGAR. Filings open on sec.gov. Not financial advice.
      </p>

      {filings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-slate-400">No SEC filings found for this ticker.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filings.map((filing) => (
            <Card key={filing.accessionNumber}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{filing.form}</Badge>
                    <NewsAgeLabel publishedAt={filing.filingDate} />
                  </div>
                  <p className="text-sm text-slate-300">{filing.description}</p>
                  {filing.reportDate ? (
                    <p className="text-xs text-slate-500">
                      Report period: {filing.reportDate}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={filing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
                >
                  View on SEC
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
