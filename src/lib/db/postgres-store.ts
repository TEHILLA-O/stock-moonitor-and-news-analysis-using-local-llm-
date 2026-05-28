import { desc, eq, sql } from "drizzle-orm";
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
import { getDb } from "./client";
import * as s from "./schema";

function mapCompany(row: typeof s.companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    exchange: row.exchange,
    sector: row.sector,
    country: row.country,
    notes: row.notes,
    status: row.status as Company["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSettings(row: typeof s.settings.$inferSelect): AppSettings {
  return {
    id: row.id,
    defaultExchange: row.defaultExchange,
    newsProvider: row.newsProvider,
    newsRegion: row.newsRegion as AppSettings["newsRegion"],
    newsIngestionMode: row.newsIngestionMode as AppSettings["newsIngestionMode"],
    financialProvider: row.financialProvider,
    aiModel: row.aiModel,
    disclaimerAccepted: row.disclaimerAccepted,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAnalysis(row: typeof s.aiAnalyses.$inferSelect): AIAnalysis {
  return {
    id: row.id,
    companyId: row.companyId,
    type: row.type as AIAnalysis["type"],
    financialHealthScore: row.financialHealthScore,
    growthScore: row.growthScore,
    valuationScore: row.valuationScore,
    riskScore: row.riskScore,
    momentumScore: row.momentumScore,
    newsSentimentScore: row.newsSentimentScore,
    overallScore: row.overallScore,
    decision: row.decision as AIAnalysis["decision"],
    confidence: row.confidence as AIAnalysis["confidence"],
    shortReasoning: row.shortReasoning,
    detailedReasoning: row.detailedReasoning,
    redFlags: (row.redFlags as string[]) ?? [],
    strengths: (row.strengths as string[]) ?? [],
    furtherQuestions: (row.furtherQuestions as string[]) ?? [],
    newsAnalysis: row.newsAnalysis as AIAnalysis["newsAnalysis"],
    scoreBreakdown: row.scoreBreakdown as AIAnalysis["scoreBreakdown"],
    rawJson: row.rawJson,
    createdAt: row.createdAt.toISOString(),
  };
}

async function ensureSeeded(): Promise<void> {
  const db = getDb();
  const settingsRows = await db.select().from(s.settings).limit(1);
  if (settingsRows.length === 0) {
    await db.insert(s.settings).values({
      id: generateId(),
      newsProvider: "free",
      financialProvider: "auto",
      updatedAt: new Date(),
    });
  }
}

export const postgresStore = {
  async getCompanies(): Promise<Company[]> {
    await ensureSeeded();
    const rows = await getDb().select().from(s.companies);
    return rows.map(mapCompany);
  },

  async getCompanyByTicker(ticker: string): Promise<Company | null> {
    const rows = await getDb()
      .select()
      .from(s.companies)
      .where(sql`upper(${s.companies.ticker}) = ${ticker.toUpperCase()}`)
      .limit(1);
    return rows[0] ? mapCompany(rows[0]) : null;
  },

  async getCompanyById(id: string): Promise<Company | null> {
    const rows = await getDb()
      .select()
      .from(s.companies)
      .where(eq(s.companies.id, id))
      .limit(1);
    return rows[0] ? mapCompany(rows[0]) : null;
  },

  async upsertCompany(company: Company): Promise<Company> {
    const db = getDb();
    const existing = await db
      .select()
      .from(s.companies)
      .where(eq(s.companies.id, company.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(s.companies)
        .set({
          name: company.name,
          ticker: company.ticker.toUpperCase(),
          exchange: company.exchange,
          sector: company.sector,
          country: company.country,
          notes: company.notes,
          status: company.status,
          updatedAt: new Date(company.updatedAt),
        })
        .where(eq(s.companies.id, company.id));
    } else {
      await db.insert(s.companies).values({
        id: company.id,
        name: company.name,
        ticker: company.ticker.toUpperCase(),
        exchange: company.exchange,
        sector: company.sector,
        country: company.country,
        notes: company.notes,
        status: company.status,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
      });
    }
    return company;
  },

  async deleteCompany(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(s.companies)
      .where(eq(s.companies.id, id))
      .returning({ id: s.companies.id });
    return result.length > 0;
  },

  async getStockSnapshots(companyId: string): Promise<StockSnapshot[]> {
    const rows = await getDb()
      .select()
      .from(s.stockSnapshots)
      .where(eq(s.stockSnapshots.companyId, companyId))
      .orderBy(s.stockSnapshots.recordedAt);
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      price: r.price,
      changePercent: r.changePercent,
      volume: r.volume,
      recordedAt: r.recordedAt.toISOString(),
    }));
  },

  async addStockSnapshot(
    data: Omit<StockSnapshot, "id">
  ): Promise<StockSnapshot> {
    const id = generateId();
    await getDb().insert(s.stockSnapshots).values({
      id,
      companyId: data.companyId,
      price: data.price,
      changePercent: data.changePercent,
      volume: data.volume,
      recordedAt: new Date(data.recordedAt),
    });
    return { ...data, id };
  },

  async getFinancialSnapshots(companyId: string): Promise<FinancialSnapshot[]> {
    const rows = await getDb()
      .select()
      .from(s.financialSnapshots)
      .where(eq(s.financialSnapshots.companyId, companyId));
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      marketCap: r.marketCap,
      peRatio: r.peRatio,
      eps: r.eps,
      revenue: r.revenue,
      netIncome: r.netIncome,
      freeCashFlow: r.freeCashFlow,
      totalDebt: r.totalDebt,
      cash: r.cash,
      dividendYield: r.dividendYield,
      analystTarget: r.analystTarget,
      recordedAt: r.recordedAt.toISOString(),
    }));
  },

  async addFinancialSnapshot(
    data: Omit<FinancialSnapshot, "id">
  ): Promise<FinancialSnapshot> {
    const id = generateId();
    await getDb().insert(s.financialSnapshots).values({
      id,
      companyId: data.companyId,
      marketCap: data.marketCap,
      peRatio: data.peRatio,
      eps: data.eps,
      revenue: data.revenue,
      netIncome: data.netIncome,
      freeCashFlow: data.freeCashFlow,
      totalDebt: data.totalDebt,
      cash: data.cash,
      dividendYield: data.dividendYield,
      analystTarget: data.analystTarget,
      recordedAt: new Date(data.recordedAt),
    });
    return { ...data, id };
  },

  async getNewsArticles(companyId: string): Promise<NewsArticle[]> {
    const rows = await getDb()
      .select()
      .from(s.newsArticles)
      .where(eq(s.newsArticles.companyId, companyId))
      .orderBy(desc(s.newsArticles.publishedAt));
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      title: r.title,
      source: r.source,
      url: r.url,
      summary: r.summary,
      publishedAt: r.publishedAt.toISOString(),
      classification: r.classification as NewsArticle["classification"],
      sentimentScore: r.sentimentScore ?? undefined,
      aiExplanation: r.aiExplanation ?? undefined,
      fetchedAt: r.fetchedAt.toISOString(),
    }));
  },

  async setNewsArticles(
    companyId: string,
    articles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    const db = getDb();
    await db.delete(s.newsArticles).where(eq(s.newsArticles.companyId, companyId));
    if (articles.length > 0) {
      await db.insert(s.newsArticles).values(
        articles.map((a) => ({
          id: a.id,
          companyId,
          title: a.title,
          source: a.source,
          url: a.url,
          summary: a.summary,
          publishedAt: new Date(a.publishedAt),
          classification: a.classification,
          sentimentScore: a.sentimentScore,
          aiExplanation: a.aiExplanation,
          fetchedAt: new Date(a.fetchedAt),
        }))
      );
    }
    return articles;
  },

  async getAIAnalyses(companyId: string): Promise<AIAnalysis[]> {
    const rows = await getDb()
      .select()
      .from(s.aiAnalyses)
      .where(eq(s.aiAnalyses.companyId, companyId))
      .orderBy(desc(s.aiAnalyses.createdAt));
    return rows.map(mapAnalysis);
  },

  async addAIAnalysis(
    data: Omit<AIAnalysis, "id" | "createdAt">
  ): Promise<AIAnalysis> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    await getDb().insert(s.aiAnalyses).values({
      id,
      companyId: data.companyId,
      type: data.type,
      financialHealthScore: data.financialHealthScore,
      growthScore: data.growthScore,
      valuationScore: data.valuationScore,
      riskScore: data.riskScore,
      momentumScore: data.momentumScore,
      newsSentimentScore: data.newsSentimentScore,
      overallScore: data.overallScore,
      decision: data.decision,
      confidence: data.confidence,
      shortReasoning: data.shortReasoning,
      detailedReasoning: data.detailedReasoning,
      redFlags: data.redFlags,
      strengths: data.strengths,
      furtherQuestions: data.furtherQuestions,
      newsAnalysis: data.newsAnalysis,
      scoreBreakdown: data.scoreBreakdown,
      rawJson: data.rawJson,
      createdAt: new Date(createdAt),
    });
    return { ...data, id, createdAt };
  },

  async getResearchNotes(companyId: string): Promise<ResearchNote[]> {
    const rows = await getDb()
      .select()
      .from(s.researchNotes)
      .where(eq(s.researchNotes.companyId, companyId))
      .orderBy(desc(s.researchNotes.updatedAt));
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      title: r.title,
      thesis: r.thesis,
      notes: r.notes,
      aiSummary: r.aiSummary,
      decision: r.decision as ResearchNote["decision"],
      confidence: r.confidence as ResearchNote["confidence"],
      tags: (r.tags as string[]) ?? [],
      metricsSnapshot: r.metricsSnapshot as ResearchNote["metricsSnapshot"],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  async upsertResearchNote(note: ResearchNote): Promise<ResearchNote> {
    const db = getDb();
    const existing = await db
      .select()
      .from(s.researchNotes)
      .where(eq(s.researchNotes.id, note.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(s.researchNotes)
        .set({
          title: note.title,
          thesis: note.thesis,
          notes: note.notes,
          aiSummary: note.aiSummary,
          decision: note.decision,
          confidence: note.confidence,
          tags: note.tags,
          metricsSnapshot: note.metricsSnapshot,
          updatedAt: new Date(note.updatedAt),
        })
        .where(eq(s.researchNotes.id, note.id));
    } else {
      await db.insert(s.researchNotes).values({
        id: note.id,
        companyId: note.companyId,
        title: note.title,
        thesis: note.thesis,
        notes: note.notes,
        aiSummary: note.aiSummary,
        decision: note.decision,
        confidence: note.confidence,
        tags: note.tags,
        metricsSnapshot: note.metricsSnapshot,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      });
    }
    return note;
  },

  async deleteResearchNote(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(s.researchNotes)
      .where(eq(s.researchNotes.id, id))
      .returning({ id: s.researchNotes.id });
    return result.length > 0;
  },

  async getTrendSnapshots(companyId: string): Promise<TrendSnapshot[]> {
    const rows = await getDb()
      .select()
      .from(s.trendSnapshots)
      .where(eq(s.trendSnapshots.companyId, companyId))
      .orderBy(s.trendSnapshots.recordedAt);
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      price: r.price,
      marketCap: r.marketCap,
      peRatio: r.peRatio,
      sentimentScore: r.sentimentScore,
      overallScore: r.overallScore,
      decision: r.decision as TrendSnapshot["decision"],
      recordedAt: r.recordedAt.toISOString(),
    }));
  },

  async addTrendSnapshot(
    data: Omit<TrendSnapshot, "id">
  ): Promise<TrendSnapshot> {
    const id = generateId();
    await getDb().insert(s.trendSnapshots).values({
      id,
      companyId: data.companyId,
      price: data.price,
      marketCap: data.marketCap,
      peRatio: data.peRatio,
      sentimentScore: data.sentimentScore,
      overallScore: data.overallScore,
      decision: data.decision,
      recordedAt: new Date(data.recordedAt),
    });
    return { ...data, id };
  },

  async getSettings(): Promise<AppSettings> {
    await ensureSeeded();
    const rows = await getDb().select().from(s.settings).limit(1);
    if (rows[0]) return mapSettings(rows[0]);

    const id = generateId();
    const now = new Date();
    await getDb().insert(s.settings).values({
      id,
      newsProvider: "free",
      financialProvider: "auto",
      updatedAt: now,
    });
    const created = await getDb().select().from(s.settings).where(eq(s.settings.id, id)).limit(1);
    return mapSettings(created[0]);
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    await getDb()
      .update(s.settings)
      .set({
        defaultExchange: settings.defaultExchange,
        newsProvider: settings.newsProvider,
        newsRegion: settings.newsRegion,
        newsIngestionMode: settings.newsIngestionMode,
        financialProvider: settings.financialProvider,
        aiModel: settings.aiModel,
        disclaimerAccepted: settings.disclaimerAccepted,
        updatedAt: new Date(settings.updatedAt),
      })
      .where(eq(s.settings.id, settings.id));
    return settings;
  },
};
