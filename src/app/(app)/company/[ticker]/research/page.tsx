import { notFound } from "next/navigation";
import { getCompanyPageData } from "@/lib/data/company-data";
import { CompanyNav } from "@/components/company/company-nav";
import { GlassHeader } from "@/components/layout/glass-header";
import { ResearchJournal } from "@/components/research/research-journal";
import { AnalysisPanel } from "@/components/company/analysis-panel";

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyPageData(ticker);
  if (!data) notFound();

  const { company, researchNotes, latestAnalysis, analyses } = data;

  return (
    <div className="space-y-8">
      <GlassHeader
        title={`${company.ticker} Research`}
        subtitle="AI analysis & research journal"
        icon="brain"
        step={{ current: 4, total: 4 }}
      />
      <CompanyNav ticker={company.ticker} />

      <AnalysisPanel
        companyId={company.id}
        companyTicker={company.ticker}
        companyName={company.name}
        latestAnalysis={latestAnalysis}
        analyses={analyses}
      />

      <ResearchJournal companyId={company.id} initialNotes={researchNotes} />
    </div>
  );
}
