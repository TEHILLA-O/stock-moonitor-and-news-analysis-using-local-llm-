import type {
  AIAnalysis,
  AppSettings,
  Company,
  FinancialSnapshot,
  NewsArticle,
  ResearchNote,
  StockSnapshot,
  TrendSnapshot,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { defaultAppSettings } from "./default-settings";
import { getSupabaseAdmin } from "./supabase-admin";

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    name: row.name as string,
    ticker: row.ticker as string,
    exchange: (row.exchange as string) ?? "",
    sector: (row.sector as string) ?? "",
    country: (row.country as string) ?? "",
    notes: (row.notes as string) ?? "",
    status: row.status as Company["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSettings(row: Record<string, unknown>): AppSettings {
  return {
    id: row.id as string,
    defaultExchange: row.default_exchange as string,
    newsProvider: row.news_provider as string,
    newsRegion: row.news_region as AppSettings["newsRegion"],
    newsIngestionMode: row.news_ingestion_mode as AppSettings["newsIngestionMode"],
    financialProvider: row.financial_provider as string,
    aiModel: row.ai_model as string,
    disclaimerAccepted: Boolean(row.disclaimer_accepted),
    updatedAt: String(row.updated_at),
  };
}

function mapAnalysis(row: Record<string, unknown>): AIAnalysis {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    type: row.type as AIAnalysis["type"],
    financialHealthScore: row.financial_health_score as number,
    growthScore: row.growth_score as number,
    valuationScore: row.valuation_score as number,
    riskScore: row.risk_score as number,
    momentumScore: row.momentum_score as number,
    newsSentimentScore: row.news_sentiment_score as number,
    overallScore: row.overall_score as number,
    decision: row.decision as AIAnalysis["decision"],
    confidence: row.confidence as AIAnalysis["confidence"],
    shortReasoning: row.short_reasoning as string,
    detailedReasoning: row.detailed_reasoning as string,
    redFlags: (row.red_flags as string[]) ?? [],
    strengths: (row.strengths as string[]) ?? [],
    furtherQuestions: (row.further_questions as string[]) ?? [],
    newsAnalysis: row.news_analysis as AIAnalysis["newsAnalysis"],
    scoreBreakdown: row.score_breakdown as AIAnalysis["scoreBreakdown"],
    rawJson: row.raw_json != null ? String(row.raw_json) : "",
    createdAt: String(row.created_at),
  };
}

async function ensureSeeded(): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("settings").select("id").limit(1);
  if (!data?.length) {
    await sb.from("settings").insert({
      id: generateId(),
      news_provider: process.env.NEWS_PROVIDER ?? "free",
      financial_provider: process.env.FINANCIAL_PROVIDER ?? "auto",
    });
  }
}

export const supabaseRestStore = {
  async getCompanies(): Promise<Company[]> {
    await ensureSeeded();
    const { data, error } = await getSupabaseAdmin()
      .from("companies")
      .select("*")
      .order("ticker");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapCompany(r));
  },

  async getCompanyByTicker(ticker: string): Promise<Company | null> {
    const { data, error } = await getSupabaseAdmin()
      .from("companies")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapCompany(data) : null;
  },

  async getCompanyById(id: string): Promise<Company | null> {
    const { data, error } = await getSupabaseAdmin()
      .from("companies")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapCompany(data) : null;
  },

  async upsertCompany(company: Company): Promise<Company> {
    const row = {
      id: company.id,
      name: company.name,
      ticker: company.ticker.toUpperCase(),
      exchange: company.exchange,
      sector: company.sector,
      country: company.country,
      notes: company.notes,
      status: company.status,
      created_at: company.createdAt,
      updated_at: company.updatedAt,
    };
    const { error } = await getSupabaseAdmin()
      .from("companies")
      .upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return company;
  },

  async deleteCompany(id: string): Promise<boolean> {
    const { error, count } = await getSupabaseAdmin()
      .from("companies")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  async getStockSnapshots(companyId: string): Promise<StockSnapshot[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("stock_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .order("recorded_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      price: r.price as number,
      changePercent: r.change_percent as number,
      volume: r.volume as number,
      recordedAt: String(r.recorded_at),
    }));
  },

  async addStockSnapshot(data: Omit<StockSnapshot, "id">): Promise<StockSnapshot> {
    const id = generateId();
    const { error } = await getSupabaseAdmin().from("stock_snapshots").insert({
      id,
      company_id: data.companyId,
      price: data.price,
      change_percent: data.changePercent,
      volume: data.volume,
      recorded_at: data.recordedAt,
    });
    if (error) throw new Error(error.message);
    return { ...data, id };
  },

  async getFinancialSnapshots(companyId: string): Promise<FinancialSnapshot[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("financial_snapshots")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      marketCap: r.market_cap as number,
      peRatio: r.pe_ratio as number | null,
      eps: r.eps as number | null,
      revenue: r.revenue as number,
      netIncome: r.net_income as number,
      freeCashFlow: r.free_cash_flow as number,
      totalDebt: r.total_debt as number,
      cash: r.cash as number,
      dividendYield: r.dividend_yield as number | null,
      analystTarget: r.analyst_target as number | null,
      recordedAt: String(r.recorded_at),
    }));
  },

  async addFinancialSnapshot(
    data: Omit<FinancialSnapshot, "id">
  ): Promise<FinancialSnapshot> {
    const id = generateId();
    const { error } = await getSupabaseAdmin().from("financial_snapshots").insert({
      id,
      company_id: data.companyId,
      market_cap: data.marketCap,
      pe_ratio: data.peRatio,
      eps: data.eps,
      revenue: data.revenue,
      net_income: data.netIncome,
      free_cash_flow: data.freeCashFlow,
      total_debt: data.totalDebt,
      cash: data.cash,
      dividend_yield: data.dividendYield,
      analyst_target: data.analystTarget,
      recorded_at: data.recordedAt,
    });
    if (error) throw new Error(error.message);
    return { ...data, id };
  },

  async getNewsArticles(companyId: string): Promise<NewsArticle[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("news_articles")
      .select("*")
      .eq("company_id", companyId)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      title: r.title as string,
      source: r.source as string,
      url: r.url as string,
      summary: r.summary as string,
      publishedAt: String(r.published_at),
      classification: r.classification as NewsArticle["classification"],
      sentimentScore: r.sentiment_score as number | undefined,
      aiExplanation: r.ai_explanation as string | undefined,
      fetchedAt: String(r.fetched_at),
    }));
  },

  async setNewsArticles(
    companyId: string,
    articles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    const sb = getSupabaseAdmin();
    await sb.from("news_articles").delete().eq("company_id", companyId);
    if (articles.length > 0) {
      const { error } = await sb.from("news_articles").insert(
        articles.map((a) => ({
          id: a.id,
          company_id: companyId,
          title: a.title,
          source: a.source,
          url: a.url,
          summary: a.summary,
          published_at: a.publishedAt,
          classification: a.classification,
          sentiment_score: a.sentimentScore,
          ai_explanation: a.aiExplanation,
          fetched_at: a.fetchedAt,
        }))
      );
      if (error) throw new Error(error.message);
    }
    return articles;
  },

  async getAIAnalyses(companyId: string): Promise<AIAnalysis[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("ai_analyses")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapAnalysis(r));
  },

  async addAIAnalysis(
    data: Omit<AIAnalysis, "id" | "createdAt">
  ): Promise<AIAnalysis> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const { error } = await getSupabaseAdmin().from("ai_analyses").insert({
      id,
      company_id: data.companyId,
      type: data.type,
      financial_health_score: data.financialHealthScore,
      growth_score: data.growthScore,
      valuation_score: data.valuationScore,
      risk_score: data.riskScore,
      momentum_score: data.momentumScore,
      news_sentiment_score: data.newsSentimentScore,
      overall_score: data.overallScore,
      decision: data.decision,
      confidence: data.confidence,
      short_reasoning: data.shortReasoning,
      detailed_reasoning: data.detailedReasoning,
      red_flags: data.redFlags,
      strengths: data.strengths,
      further_questions: data.furtherQuestions,
      news_analysis: data.newsAnalysis,
      score_breakdown: data.scoreBreakdown,
      raw_json: data.rawJson,
      created_at: createdAt,
    });
    if (error) throw new Error(error.message);
    return { ...data, id, createdAt };
  },

  async getResearchNotes(companyId: string): Promise<ResearchNote[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("research_notes")
      .select("*")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      title: r.title as string,
      thesis: r.thesis as string,
      notes: r.notes as string,
      aiSummary: r.ai_summary as string,
      decision: r.decision as ResearchNote["decision"],
      confidence: r.confidence as ResearchNote["confidence"],
      tags: (r.tags as string[]) ?? [],
      metricsSnapshot: r.metrics_snapshot as ResearchNote["metricsSnapshot"],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  async upsertResearchNote(note: ResearchNote): Promise<ResearchNote> {
    const row = {
      id: note.id,
      company_id: note.companyId,
      title: note.title,
      thesis: note.thesis,
      notes: note.notes,
      ai_summary: note.aiSummary,
      decision: note.decision,
      confidence: note.confidence,
      tags: note.tags,
      metrics_snapshot: note.metricsSnapshot,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    };
    const { error } = await getSupabaseAdmin()
      .from("research_notes")
      .upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return note;
  },

  async deleteResearchNote(id: string): Promise<boolean> {
    const { error, count } = await getSupabaseAdmin()
      .from("research_notes")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  async getTrendSnapshots(companyId: string): Promise<TrendSnapshot[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("trend_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .order("recorded_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      price: r.price as number,
      marketCap: r.market_cap as number | null,
      peRatio: r.pe_ratio as number | null,
      sentimentScore: r.sentiment_score as number | null,
      overallScore: r.overall_score as number | null,
      decision: r.decision as TrendSnapshot["decision"],
      recordedAt: String(r.recorded_at),
    }));
  },

  async addTrendSnapshot(data: Omit<TrendSnapshot, "id">): Promise<TrendSnapshot> {
    const id = generateId();
    const { error } = await getSupabaseAdmin().from("trend_snapshots").insert({
      id,
      company_id: data.companyId,
      price: data.price,
      market_cap: data.marketCap,
      pe_ratio: data.peRatio,
      sentiment_score: data.sentimentScore,
      overall_score: data.overallScore,
      decision: data.decision,
      recorded_at: data.recordedAt,
    });
    if (error) throw new Error(error.message);
    return { ...data, id };
  },

  async getSettings(): Promise<AppSettings> {
    try {
      await ensureSeeded();
      const { data, error } = await getSupabaseAdmin()
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return mapSettings(data);
    } catch {
      /* fall through to env-based defaults */
    }
    return defaultAppSettings();
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    const { error } = await getSupabaseAdmin()
      .from("settings")
      .update({
        default_exchange: settings.defaultExchange,
        news_provider: settings.newsProvider,
        news_region: settings.newsRegion,
        news_ingestion_mode: settings.newsIngestionMode,
        financial_provider: settings.financialProvider,
        ai_model: settings.aiModel,
        disclaimer_accepted: settings.disclaimerAccepted,
        updated_at: settings.updatedAt,
      })
      .eq("id", settings.id);
    if (error) throw new Error(error.message);
    return settings;
  },
};
