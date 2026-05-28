import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchCompanyFinancials,
  resolveFinancialProvider,
} from "@/lib/services/financialDataService";
import { getCompanyNews } from "@/lib/data/news-data";
import { runCompanyAnalysis } from "@/lib/services/deepseekService";
import { analyzeCompanySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sentimentToScore } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`analysis-${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. AI analysis is limited to 20 requests per minute.", retryAfter: limit.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { companyId, userNotes } = analyzeCompanySchema.parse(body);

    const company = await db.getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const settings = await db.getSettings();
    const financialData = await fetchCompanyFinancials(
      { ticker: company.ticker, exchange: company.exchange },
      { provider: resolveFinancialProvider(settings.financialProvider) }
    );

    const newsData = await getCompanyNews(company);

    const result = await runCompanyAnalysis({
      company,
      financialData,
      newsData,
      priceTrend: financialData.priceHistory,
      userNotes: userNotes ?? company.notes,
    });

    const analysis = await db.addAIAnalysis({
      companyId,
      type: "combined",
      financialHealthScore: result.financialHealthScore,
      growthScore: result.growthScore,
      valuationScore: result.valuationScore,
      riskScore: result.riskScore,
      momentumScore: result.momentumScore,
      newsSentimentScore: result.newsSentimentScore,
      overallScore: result.overallScore,
      decision: result.decision,
      confidence: result.confidence,
      shortReasoning: result.shortReasoning,
      detailedReasoning: result.detailedReasoning,
      redFlags: result.redFlags,
      strengths: result.strengths,
      furtherQuestions: result.furtherQuestions,
      newsAnalysis: result.newsAnalysis,
      scoreBreakdown: result.scoreBreakdown,
      rawJson: JSON.stringify(result),
    });

    await db.addTrendSnapshot({
      companyId,
      price: financialData.currentPrice,
      marketCap: financialData.marketCap,
      peRatio: financialData.peRatio,
      sentimentScore: result.newsSentimentScore,
      overallScore: result.overallScore,
      decision: result.decision,
      recordedAt: new Date().toISOString(),
    });

    const updatedNews = newsData.map((article) => {
      const match = result.newsAnalysis.articles.find(
        (a) => a.articleId === article.id
      );
      if (!match) return article;
      return {
        ...article,
        classification: match.classification,
        sentimentScore: match.sentimentScore,
        aiExplanation: match.explanation,
      };
    });
    await db.setNewsArticles(companyId, updatedNews);

    return NextResponse.json({
      analysis,
      result,
      newsSentimentNormalized: sentimentToScore(result.newsSentimentScore),
    });
  } catch (err) {
    console.error("Analysis error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
