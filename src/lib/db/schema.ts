import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  boolean,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ticker: text("ticker").notNull().unique(),
  exchange: text("exchange").notNull().default(""),
  sector: text("sector").notNull().default(""),
  country: text("country").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("watching"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stockSnapshots = pgTable("stock_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  changePercent: real("change_percent").notNull().default(0),
  volume: real("volume").notNull().default(0),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financialSnapshots = pgTable("financial_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  marketCap: real("market_cap").notNull(),
  peRatio: real("pe_ratio"),
  eps: real("eps"),
  revenue: real("revenue").notNull(),
  netIncome: real("net_income").notNull(),
  freeCashFlow: real("free_cash_flow").notNull(),
  totalDebt: real("total_debt").notNull(),
  cash: real("cash").notNull(),
  dividendYield: real("dividend_yield"),
  analystTarget: real("analyst_target"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull(),
  summary: text("summary").notNull().default(""),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  classification: text("classification"),
  sentimentScore: real("sentiment_score"),
  aiExplanation: text("ai_explanation"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiAnalyses = pgTable("ai_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("combined"),
  financialHealthScore: integer("financial_health_score").notNull(),
  growthScore: integer("growth_score").notNull(),
  valuationScore: integer("valuation_score").notNull(),
  riskScore: integer("risk_score").notNull(),
  momentumScore: integer("momentum_score").notNull(),
  newsSentimentScore: integer("news_sentiment_score").notNull(),
  overallScore: integer("overall_score").notNull(),
  decision: text("decision").notNull(),
  confidence: text("confidence").notNull(),
  shortReasoning: text("short_reasoning").notNull(),
  detailedReasoning: text("detailed_reasoning").notNull(),
  redFlags: jsonb("red_flags").$type<string[]>().notNull().default([]),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  furtherQuestions: jsonb("further_questions").$type<string[]>().notNull().default([]),
  newsAnalysis: jsonb("news_analysis"),
  scoreBreakdown: jsonb("score_breakdown"),
  rawJson: text("raw_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const researchNotes = pgTable("research_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  thesis: text("thesis").notNull().default(""),
  notes: text("notes").notNull().default(""),
  aiSummary: text("ai_summary").notNull().default(""),
  decision: text("decision"),
  confidence: text("confidence"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  metricsSnapshot: jsonb("metrics_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trendSnapshots = pgTable("trend_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  marketCap: real("market_cap"),
  peRatio: real("pe_ratio"),
  sentimentScore: real("sentiment_score"),
  overallScore: real("overall_score"),
  decision: text("decision"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  defaultExchange: text("default_exchange").notNull().default("NASDAQ"),
  newsProvider: text("news_provider").notNull().default("free"),
  newsRegion: text("news_region").notNull().default("usa"),
  newsIngestionMode: text("news_ingestion_mode").notNull().default("auto"),
  financialProvider: text("financial_provider").notNull().default("auto"),
  aiModel: text("ai_model").notNull().default("deepseek-v4-flash"),
  disclaimerAccepted: boolean("disclaimer_accepted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
