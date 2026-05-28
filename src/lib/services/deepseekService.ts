import OpenAI from "openai";
import type {
  CompanyAnalysisInput,
  CompanyAnalysisOutput,
  NewsAnalysisResult,
} from "@/lib/types";
import { calculateOverallScore, sentimentToScore } from "@/lib/scoring";

const MODEL = "deepseek-v4-flash";

const PLACEHOLDER_KEYS = new Set([
  "your_deepseek_key_here",
  "optional_later",
  "",
]);

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  return Boolean(key && !PLACEHOLDER_KEYS.has(key) && key.startsWith("sk-"));
}

function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!isDeepSeekConfigured()) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Add your key to .env.local and restart the dev server."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  });
}

const ANALYSIS_SYSTEM_PROMPT = `You are a private investment research assistant. The user is conducting personal research only — NOT providing financial advice.

Analyze the company data and return ONLY valid JSON matching this exact schema (no markdown, no extra text):

{
  "financialHealthScore": number 0-100,
  "growthScore": number 0-100,
  "valuationScore": number 0-100,
  "riskScore": number 0-100 (higher = more risk),
  "momentumScore": number 0-100,
  "newsSentimentScore": number -100 to +100,
  "decision": "buy" | "hold" | "watch" | "avoid",
  "confidence": "low" | "medium" | "high",
  "shortReasoning": "string max 200 chars",
  "detailedReasoning": "string",
  "redFlags": ["string"],
  "strengths": ["string"],
  "furtherQuestions": ["string"],
  "newsAnalysis": {
    "summary": "string",
    "overallSentimentScore": number -100 to +100,
    "articles": [{
      "articleId": "string",
      "classification": "positive"|"negative"|"neutral"|"risk"|"catalyst"|"hype"|"legal"|"earnings"|"macro"|"product"|"leadership",
      "sentimentScore": number -100 to +100,
      "explanation": "string"
    }],
    "risks": ["string"],
    "opportunities": ["string"]
  }
}

Scoring guidance:
- Financial health: balance sheet, cash, debt, profitability
- Growth: revenue/earnings trajectory
- Valuation: P/E, relative value vs growth
- Risk: regulatory, competitive, macro, concentration
- Momentum: recent price trend
- News: classify each article and explain why

Be objective, cite specific data points, and flag uncertainty.`;

export async function analyseCompanyWithDeepSeek(
  input: CompanyAnalysisInput
): Promise<CompanyAnalysisOutput> {
  const client = getClient();

  const payload = {
    company: {
      name: input.company.name,
      ticker: input.company.ticker,
      exchange: input.company.exchange,
      sector: input.company.sector,
      country: input.company.country,
      status: input.company.status,
      notes: input.company.notes,
      userNotes: input.userNotes,
    },
    financialData: input.financialData,
    newsData: input.newsData.map((n) => ({
      id: n.id,
      title: n.title,
      source: n.source,
      summary: n.summary,
      publishedAt: n.publishedAt,
    })),
    priceTrend: input.priceTrend.slice(-30),
  };

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this company for private research:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from DeepSeek");
  }

  const parsed = JSON.parse(content) as {
    financialHealthScore: number;
    growthScore: number;
    valuationScore: number;
    riskScore: number;
    momentumScore: number;
    newsSentimentScore: number;
    decision: CompanyAnalysisOutput["decision"];
    confidence: CompanyAnalysisOutput["confidence"];
    shortReasoning: string;
    detailedReasoning: string;
    redFlags: string[];
    strengths: string[];
    furtherQuestions: string[];
    newsAnalysis: NewsAnalysisResult;
  };

  const newsSentimentNormalized = sentimentToScore(parsed.newsSentimentScore);

  const scoreBreakdown = calculateOverallScore({
    financialHealth: parsed.financialHealthScore,
    growth: parsed.growthScore,
    valuation: parsed.valuationScore,
    newsSentiment: newsSentimentNormalized,
    priceMomentum: parsed.momentumScore,
    riskScore: parsed.riskScore,
  });

  return {
    financialHealthScore: parsed.financialHealthScore,
    growthScore: parsed.growthScore,
    valuationScore: parsed.valuationScore,
    riskScore: parsed.riskScore,
    momentumScore: parsed.momentumScore,
    newsSentimentScore: parsed.newsSentimentScore,
    overallScore: scoreBreakdown.overall,
    decision: parsed.decision,
    confidence: parsed.confidence,
    shortReasoning: parsed.shortReasoning,
    detailedReasoning: parsed.detailedReasoning,
    redFlags: parsed.redFlags,
    strengths: parsed.strengths,
    furtherQuestions: parsed.furtherQuestions,
    newsAnalysis: parsed.newsAnalysis,
    scoreBreakdown,
  };
}

export async function runCompanyAnalysis(
  input: CompanyAnalysisInput
): Promise<CompanyAnalysisOutput> {
  if (!isDeepSeekConfigured()) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Add your key to .env.local and restart the dev server."
    );
  }
  return analyseCompanyWithDeepSeek(input);
}
