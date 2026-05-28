import { notFound } from "next/navigation";
import { getCompanyPageData } from "@/lib/data/company-data";
import { getLatestFetchedAt } from "@/lib/news/refresh";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { NewsClient } from "./news-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyPageData(ticker);
  if (!data) notFound();

  const { company, news, latestAnalysis } = data;

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} News`}
        subtitle="Latest headlines & AI sentiment"
        icon="news"
        step={{ current: 3, total: 4 }}
      />
      <CompanyNav ticker={company.ticker} />

      {latestAnalysis?.newsAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI News Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">{latestAnalysis.newsAnalysis.summary}</p>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-slate-500">Sentiment Score</p>
                <p
                  className={
                    latestAnalysis.newsSentimentScore >= 0
                      ? "text-2xl font-bold text-cyan-400"
                      : "text-2xl font-bold text-fuchsia-400"
                  }
                >
                  {latestAnalysis.newsSentimentScore > 0 ? "+" : ""}
                  {latestAnalysis.newsSentimentScore}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-rose-400">Risks</p>
                <ul className="list-inside list-disc text-sm text-slate-400">
                  {latestAnalysis.newsAnalysis.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-cyan-400">Opportunities</p>
                <ul className="list-inside list-disc text-sm text-slate-400">
                  {latestAnalysis.newsAnalysis.opportunities.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <NewsClient
        companyId={company.id}
        initialNews={news}
        initialLastFetchedAt={getLatestFetchedAt(news)?.toISOString() ?? null}
      />
    </div>
  );
}
