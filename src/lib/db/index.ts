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
import { memoryStore } from "./memory-store";
import { postgresStore } from "./postgres-store";

export function useDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
}

function usePostgres(): boolean {
  return useDatabase();
}

/** Repository — Supabase/Postgres when DATABASE_URL is set, else local `.data/store.json` */
export const db = {
  async getCompanies(): Promise<Company[]> {
    if (usePostgres()) return postgresStore.getCompanies();
    return memoryStore.getCompanies();
  },

  async getCompanyByTicker(ticker: string): Promise<Company | null> {
    if (usePostgres()) return postgresStore.getCompanyByTicker(ticker);
    return memoryStore.getCompanyByTicker(ticker) ?? null;
  },

  async getCompanyById(id: string): Promise<Company | null> {
    if (usePostgres()) return postgresStore.getCompanyById(id);
    return memoryStore.getCompanyById(id) ?? null;
  },

  async createCompany(
    data: Omit<Company, "id" | "createdAt" | "updatedAt">
  ): Promise<Company> {
    const now = new Date().toISOString();
    const existing = await this.getCompanyByTicker(data.ticker);
    if (existing) {
      throw new Error(`Company with ticker ${data.ticker} already exists`);
    }

    const company: Company = {
      ...data,
      ticker: data.ticker.toUpperCase(),
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    if (usePostgres()) return postgresStore.upsertCompany(company);
    return memoryStore.upsertCompany(company);
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company | null> {
    const existing = await this.getCompanyById(id);
    if (!existing) return null;
    const updated: Company = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    if (usePostgres()) return postgresStore.upsertCompany(updated);
    return memoryStore.upsertCompany(updated);
  },

  async deleteCompany(id: string): Promise<boolean> {
    if (usePostgres()) return postgresStore.deleteCompany(id);
    return memoryStore.deleteCompany(id);
  },

  async getStockSnapshots(companyId: string): Promise<StockSnapshot[]> {
    if (usePostgres()) return postgresStore.getStockSnapshots(companyId);
    return memoryStore
      .getStockSnapshots(companyId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  },

  async addStockSnapshot(data: Omit<StockSnapshot, "id">): Promise<StockSnapshot> {
    const snapshot: StockSnapshot = { ...data, id: generateId() };
    if (usePostgres()) return postgresStore.addStockSnapshot(snapshot);
    return memoryStore.addStockSnapshot(snapshot);
  },

  async getFinancialSnapshots(companyId: string): Promise<FinancialSnapshot[]> {
    if (usePostgres()) return postgresStore.getFinancialSnapshots(companyId);
    return memoryStore.getFinancialSnapshots(companyId);
  },

  async addFinancialSnapshot(
    data: Omit<FinancialSnapshot, "id">
  ): Promise<FinancialSnapshot> {
    const snapshot: FinancialSnapshot = { ...data, id: generateId() };
    if (usePostgres()) return postgresStore.addFinancialSnapshot(snapshot);
    return memoryStore.addFinancialSnapshot(snapshot);
  },

  async getNewsArticles(companyId: string): Promise<NewsArticle[]> {
    if (usePostgres()) return postgresStore.getNewsArticles(companyId);
    return memoryStore.getNewsArticles(companyId);
  },

  async setNewsArticles(
    companyId: string,
    articles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    if (usePostgres()) return postgresStore.setNewsArticles(companyId, articles);
    return memoryStore.setNewsArticles(companyId, articles);
  },

  async getAIAnalyses(companyId: string): Promise<AIAnalysis[]> {
    if (usePostgres()) return postgresStore.getAIAnalyses(companyId);
    return memoryStore.getAIAnalyses(companyId);
  },

  async addAIAnalysis(data: Omit<AIAnalysis, "id" | "createdAt">): Promise<AIAnalysis> {
    if (usePostgres()) return postgresStore.addAIAnalysis(data);
    return memoryStore.addAIAnalysis({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
  },

  async getResearchNotes(companyId: string): Promise<ResearchNote[]> {
    if (usePostgres()) return postgresStore.getResearchNotes(companyId);
    return memoryStore.getResearchNotes(companyId);
  },

  async upsertResearchNote(note: ResearchNote): Promise<ResearchNote> {
    if (usePostgres()) return postgresStore.upsertResearchNote(note);
    return memoryStore.upsertResearchNote(note);
  },

  async createResearchNote(
    data: Omit<ResearchNote, "id" | "createdAt" | "updatedAt">
  ): Promise<ResearchNote> {
    const now = new Date().toISOString();
    const note: ResearchNote = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    if (usePostgres()) return postgresStore.upsertResearchNote(note);
    return memoryStore.upsertResearchNote(note);
  },

  async deleteResearchNote(id: string): Promise<boolean> {
    if (usePostgres()) return postgresStore.deleteResearchNote(id);
    return memoryStore.deleteResearchNote(id);
  },

  async getTrendSnapshots(companyId: string): Promise<TrendSnapshot[]> {
    if (usePostgres()) return postgresStore.getTrendSnapshots(companyId);
    return memoryStore
      .getTrendSnapshots(companyId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  },

  async addTrendSnapshot(data: Omit<TrendSnapshot, "id">): Promise<TrendSnapshot> {
    const snapshot: TrendSnapshot = { ...data, id: generateId() };
    if (usePostgres()) return postgresStore.addTrendSnapshot(snapshot);
    return memoryStore.addTrendSnapshot(snapshot);
  },

  async getSettings(): Promise<AppSettings> {
    if (usePostgres()) return postgresStore.getSettings();
    return memoryStore.getSettings();
  },

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (usePostgres()) return postgresStore.updateSettings(updated);
    return memoryStore.updateSettings(updated);
  },
};
