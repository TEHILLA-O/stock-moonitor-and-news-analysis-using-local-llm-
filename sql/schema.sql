-- Private Market Research Assistant — PostgreSQL schema
-- Run against your DATABASE_URL (Neon, Supabase, or local Postgres)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ticker TEXT NOT NULL UNIQUE,
  exchange TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'researched', 'bought', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  price REAL NOT NULL,
  change_percent REAL NOT NULL DEFAULT 0,
  volume REAL NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market_cap REAL NOT NULL,
  pe_ratio REAL,
  eps REAL,
  revenue REAL NOT NULL,
  net_income REAL NOT NULL,
  free_cash_flow REAL NOT NULL,
  total_debt REAL NOT NULL,
  cash REAL NOT NULL,
  dividend_yield REAL,
  analyst_target REAL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL,
  classification TEXT,
  sentiment_score REAL,
  ai_explanation TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'combined',
  financial_health_score INTEGER NOT NULL,
  growth_score INTEGER NOT NULL,
  valuation_score INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  momentum_score INTEGER NOT NULL,
  news_sentiment_score INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  decision TEXT NOT NULL,
  confidence TEXT NOT NULL,
  short_reasoning TEXT NOT NULL,
  detailed_reasoning TEXT NOT NULL,
  red_flags JSONB NOT NULL DEFAULT '[]',
  strengths JSONB NOT NULL DEFAULT '[]',
  further_questions JSONB NOT NULL DEFAULT '[]',
  news_analysis JSONB,
  score_breakdown JSONB,
  raw_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thesis TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  ai_summary TEXT NOT NULL DEFAULT '',
  decision TEXT,
  confidence TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  metrics_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  price REAL NOT NULL,
  market_cap REAL,
  pe_ratio REAL,
  sentiment_score REAL,
  overall_score REAL,
  decision TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_exchange TEXT NOT NULL DEFAULT 'NASDAQ',
  news_provider TEXT NOT NULL DEFAULT 'mock',
  news_region TEXT NOT NULL DEFAULT 'usa',
  news_ingestion_mode TEXT NOT NULL DEFAULT 'auto',
  financial_provider TEXT NOT NULL DEFAULT 'mock',
  ai_model TEXT NOT NULL DEFAULT 'deepseek-v4-flash',
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_snapshots_company ON stock_snapshots(company_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_company ON financial_snapshots(company_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_company ON news_articles(company_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_company ON ai_analyses(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_notes_company ON research_notes(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_company ON trend_snapshots(company_id, recorded_at DESC);
