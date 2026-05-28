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
import { hasSupabaseClientEnv } from "@/lib/config/env";
import { memoryStore } from "./memory-store";
import { postgresStore } from "./postgres-store";
import { supabaseRestStore } from "./supabase-rest-store";

export function useDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres") || hasSupabaseClientEnv();
}

function usePostgres(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return url.startsWith("postgres");
}

function useSupabaseRest(): boolean {
  return !usePostgres() && hasSupabaseClientEnv();
}

type Store = typeof postgresStore;

function getStore(): Store {
  if (usePostgres()) return postgresStore;
  if (useSupabaseRest()) return supabaseRestStore;
  return memoryStore as unknown as Store;
}

/** Repository — Postgres, Supabase REST, or local `.data/store.json` */
export const db = {
  async getCompanies(): Promise<Company[]> {
    return getStore().getCompanies();
  },

  async getCompanyByTicker(ticker: string): Promise<Company | null> {
    return getStore().getCompanyByTicker(ticker);
  },

  async getCompanyById(id: string): Promise<Company | null> {
    return getStore().getCompanyById(id);
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

    return getStore().upsertCompany(company);
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
    return getStore().upsertCompany(updated);
  },

  async deleteCompany(id: string): Promise<boolean> {
    return getStore().deleteCompany(id);
  },

  async getStockSnapshots(companyId: string): Promise<StockSnapshot[]> {
    return getStore().getStockSnapshots(companyId);
  },

  async addStockSnapshot(data: Omit<StockSnapshot, "id">): Promise<StockSnapshot> {
    const snapshot: StockSnapshot = { ...data, id: generateId() };
    return getStore().addStockSnapshot(snapshot);
  },

  async getFinancialSnapshots(companyId: string): Promise<FinancialSnapshot[]> {
    return getStore().getFinancialSnapshots(companyId);
  },

  async addFinancialSnapshot(
    data: Omit<FinancialSnapshot, "id">
  ): Promise<FinancialSnapshot> {
    const snapshot: FinancialSnapshot = { ...data, id: generateId() };
    return getStore().addFinancialSnapshot(snapshot);
  },

  async getNewsArticles(companyId: string): Promise<NewsArticle[]> {
    return getStore().getNewsArticles(companyId);
  },

  async setNewsArticles(
    companyId: string,
    articles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    return getStore().setNewsArticles(companyId, articles);
  },

  async getAIAnalyses(companyId: string): Promise<AIAnalysis[]> {
    return getStore().getAIAnalyses(companyId);
  },

  async addAIAnalysis(data: Omit<AIAnalysis, "id" | "createdAt">): Promise<AIAnalysis> {
    if (useSupabaseRest() || usePostgres()) {
      return getStore().addAIAnalysis(data);
    }
    return memoryStore.addAIAnalysis({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
  },

  async getResearchNotes(companyId: string): Promise<ResearchNote[]> {
    return getStore().getResearchNotes(companyId);
  },

  async upsertResearchNote(note: ResearchNote): Promise<ResearchNote> {
    return getStore().upsertResearchNote(note);
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
    return getStore().upsertResearchNote(note);
  },

  async deleteResearchNote(id: string): Promise<boolean> {
    return getStore().deleteResearchNote(id);
  },

  async getTrendSnapshots(companyId: string): Promise<TrendSnapshot[]> {
    return getStore().getTrendSnapshots(companyId);
  },

  async addTrendSnapshot(data: Omit<TrendSnapshot, "id">): Promise<TrendSnapshot> {
    const snapshot: TrendSnapshot = { ...data, id: generateId() };
    return getStore().addTrendSnapshot(snapshot);
  },

  async getSettings(): Promise<AppSettings> {
    return getStore().getSettings();
  },

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return getStore().updateSettings(updated);
  },
};
