import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import path from "path";
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
interface StoreData {
  companies: Company[];
  stockSnapshots: StockSnapshot[];
  financialSnapshots: FinancialSnapshot[];
  newsArticles: NewsArticle[];
  aiAnalyses: AIAnalysis[];
  researchNotes: ResearchNote[];
  trendSnapshots: TrendSnapshot[];
  settings: AppSettings | null;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
/** Vercel serverless filesystem is read-only — keep data in memory only. */
const useDisk = !process.env.VERCEL;

function defaultStore(): StoreData {
  const now = new Date().toISOString();

  return {
    companies: [],
    stockSnapshots: [],
    financialSnapshots: [],
    newsArticles: [],
    aiAnalyses: [],
    researchNotes: [],
    trendSnapshots: [],
    settings: {
      id: generateId(),
      defaultExchange: "NASDAQ",
      newsProvider: "free",
      newsRegion: "usa",
      newsIngestionMode: "auto",
      financialProvider: "auto",
      aiModel: "deepseek-v4-flash",
      disclaimerAccepted: false,
      updatedAt: now,
    },
  };
}

function loadStore(): StoreData {
  if (!existsSync(STORE_FILE)) {
    const store = defaultStore();
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    return store;
  }
  return JSON.parse(readFileSync(STORE_FILE, "utf-8")) as StoreData;
}

function saveStore(data: StoreData): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

let cache: StoreData | null = null;
let cacheMtime = 0;

/** Reload from disk when the file changes (fixes dev multi-worker stale lists). */
function getStore(): StoreData {
  if (!useDisk) {
    if (!cache) cache = defaultStore();
    return cache;
  }

  if (!existsSync(STORE_FILE)) {
    cache = defaultStore();
    mkdirSync(DATA_DIR, { recursive: true });
    saveStore(cache);
    cacheMtime = statSync(STORE_FILE).mtimeMs;
    return cache;
  }

  const mtime = statSync(STORE_FILE).mtimeMs;
  if (!cache || mtime !== cacheMtime) {
    cache = loadStore();
    cacheMtime = mtime;
  }
  return cache;
}

function persist(): void {
  if (!useDisk || !cache) return;
  try {
    saveStore(cache);
    if (existsSync(STORE_FILE)) {
      cacheMtime = statSync(STORE_FILE).mtimeMs;
    }
  } catch {
    /* read-only filesystem on serverless */
  }
}

export const memoryStore = {
  reset() {
    cache = defaultStore();
    persist();
  },

  getCompanies(): Company[] {
    return getStore().companies;
  },

  getCompanyByTicker(ticker: string): Company | undefined {
    return getStore().companies.find(
      (c) => c.ticker.toUpperCase() === ticker.toUpperCase()
    );
  },

  getCompanyById(id: string): Company | undefined {
    return getStore().companies.find((c) => c.id === id);
  },

  upsertCompany(company: Company): Company {
    const store = getStore();
    const idx = store.companies.findIndex((c) => c.id === company.id);
    if (idx >= 0) store.companies[idx] = company;
    else store.companies.push(company);
    persist();
    return company;
  },

  deleteCompany(id: string): boolean {
    const store = getStore();
    const before = store.companies.length;
    store.companies = store.companies.filter((c) => c.id !== id);
    store.stockSnapshots = store.stockSnapshots.filter((s) => s.companyId !== id);
    store.financialSnapshots = store.financialSnapshots.filter((f) => f.companyId !== id);
    store.newsArticles = store.newsArticles.filter((n) => n.companyId !== id);
    store.aiAnalyses = store.aiAnalyses.filter((a) => a.companyId !== id);
    store.researchNotes = store.researchNotes.filter((r) => r.companyId !== id);
    store.trendSnapshots = store.trendSnapshots.filter((t) => t.companyId !== id);
    persist();
    return store.companies.length < before;
  },

  getStockSnapshots(companyId: string): StockSnapshot[] {
    return getStore().stockSnapshots.filter((s) => s.companyId === companyId);
  },

  addStockSnapshot(snapshot: StockSnapshot): StockSnapshot {
    getStore().stockSnapshots.push(snapshot);
    persist();
    return snapshot;
  },

  getFinancialSnapshots(companyId: string): FinancialSnapshot[] {
    return getStore().financialSnapshots.filter((f) => f.companyId === companyId);
  },

  addFinancialSnapshot(snapshot: FinancialSnapshot): FinancialSnapshot {
    getStore().financialSnapshots.push(snapshot);
    persist();
    return snapshot;
  },

  getNewsArticles(companyId: string): NewsArticle[] {
    return getStore().newsArticles.filter((n) => n.companyId === companyId);
  },

  setNewsArticles(companyId: string, articles: NewsArticle[]): NewsArticle[] {
    const store = getStore();
    store.newsArticles = store.newsArticles.filter((n) => n.companyId !== companyId);
    store.newsArticles.push(...articles);
    persist();
    return articles;
  },

  getAIAnalyses(companyId: string): AIAnalysis[] {
    return getStore().aiAnalyses.filter((a) => a.companyId === companyId);
  },

  addAIAnalysis(analysis: AIAnalysis): AIAnalysis {
    getStore().aiAnalyses.unshift(analysis);
    persist();
    return analysis;
  },

  getResearchNotes(companyId: string): ResearchNote[] {
    return getStore().researchNotes.filter((r) => r.companyId === companyId);
  },

  upsertResearchNote(note: ResearchNote): ResearchNote {
    const store = getStore();
    const idx = store.researchNotes.findIndex((r) => r.id === note.id);
    if (idx >= 0) store.researchNotes[idx] = note;
    else store.researchNotes.unshift(note);
    persist();
    return note;
  },

  deleteResearchNote(id: string): boolean {
    const store = getStore();
    const before = store.researchNotes.length;
    store.researchNotes = store.researchNotes.filter((r) => r.id !== id);
    persist();
    return store.researchNotes.length < before;
  },

  getTrendSnapshots(companyId: string): TrendSnapshot[] {
    return getStore().trendSnapshots.filter((t) => t.companyId === companyId);
  },

  addTrendSnapshot(snapshot: TrendSnapshot): TrendSnapshot {
    getStore().trendSnapshots.push(snapshot);
    persist();
    return snapshot;
  },

  getSettings(): AppSettings {
    const store = getStore();
    if (!store.settings) {
      store.settings = defaultStore().settings!;
      persist();
    }
    const defaults = defaultStore().settings!;
    store.settings = {
      ...defaults,
      ...store.settings,
    };
    if (
      store.settings.financialProvider === "mock" ||
      store.settings.financialProvider === "alphavantage"
    ) {
      store.settings.financialProvider =
        process.env.FINANCIAL_PROVIDER ?? "auto";
    }
    if (store.settings.newsProvider === "mock") {
      store.settings.newsProvider = process.env.NEWS_PROVIDER ?? "free";
    }
    if (
      store.settings.newsProvider === "free" &&
      process.env.NEWSDATA_API_KEY &&
      process.env.NEWS_PROVIDER === "newsdata"
    ) {
      store.settings.newsProvider = "newsdata";
    } else if (
      store.settings.newsProvider === "free" &&
      process.env.NEWS_API_KEY &&
      process.env.NEWS_PROVIDER === "newsapi"
    ) {
      store.settings.newsProvider = "newsapi";
    }
    return store.settings;
  },

  updateSettings(settings: AppSettings): AppSettings {
    getStore().settings = settings;
    persist();
    return settings;
  },
};
