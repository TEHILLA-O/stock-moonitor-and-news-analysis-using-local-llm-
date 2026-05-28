import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const companies = await db.getCompanies();
  const items: Array<{
    id: string;
    companyId: string;
    ticker: string;
    companyName: string;
    overallScore: number;
    decision: string;
    confidence: string;
    shortReasoning: string;
    createdAt: string;
  }> = [];

  for (const company of companies) {
    const analyses = await db.getAIAnalyses(company.id);
    for (const a of analyses.slice(0, 5)) {
      items.push({
        id: a.id,
        companyId: a.companyId,
        ticker: company.ticker,
        companyName: company.name,
        overallScore: a.overallScore,
        decision: a.decision,
        confidence: a.confidence,
        shortReasoning: a.shortReasoning,
        createdAt: a.createdAt,
      });
    }
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(items.slice(0, 30));
}
