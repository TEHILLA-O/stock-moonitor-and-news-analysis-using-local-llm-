export type CompanyStatus = "watching" | "researched" | "bought" | "rejected";
export type Decision = "buy" | "hold" | "watch" | "avoid";
export type Confidence = "low" | "medium" | "high";
export type NewsRegion = "usa" | "uk" | "china" | "nigeria";
export type NewsIngestionMode = "auto" | "api" | "scrape";

export type NewsClassification =
  | "positive"
  | "negative"
  | "neutral"
  | "risk"
  | "catalyst"
  | "hype"
  | "legal"
  | "earnings"
  | "macro"
  | "product"
  | "leadership";

export interface Company {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  sector: string;
  country: string;
  notes: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockSnapshot {
  id: string;
  companyId: string;
  price: number;
  changePercent: number;
  volume: number;
  recordedAt: string;
}

export interface FinancialSnapshot {
  id: string;
  companyId: string;
  marketCap: number;
  peRatio: number | null;
  eps: number | null;
  revenue: number;
  netIncome: number;
  freeCashFlow: number;
  totalDebt: number;
  cash: number;
  dividendYield: number | null;
  analystTarget: number | null;
  recordedAt: string;
}

export interface NewsArticle {
  id: string;
  companyId: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  classification?: NewsClassification;
  sentimentScore?: number;
  aiExplanation?: string;
  fetchedAt: string;
}

export interface NewsAnalysisResult {
  summary: string;
  overallSentimentScore: number;
  articles: Array<{
    articleId: string;
    classification: NewsClassification;
    sentimentScore: number;
    explanation: string;
  }>;
  risks: string[];
  opportunities: string[];
}

export interface OhlcvBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SecFiling {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string;
  primaryDocument: string;
  url: string;
  description: string;
}

export interface FinancialMetrics {
  marketCap: number;
  peRatio: number | null;
  eps: number | null;
  revenue: number;
  netIncome: number;
  freeCashFlow: number;
  totalDebt: number;
  cash: number;
  dividendYield: number | null;
  analystTarget: number | null;
  currentPrice: number;
  priceHistory: Array<{ date: string; price: number }>;
  ohlcvHistory?: OhlcvBar[];
  profitMargin?: number | null;
  institutionalOwnership?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  dataSources?: string[];
  isDelayed?: boolean;
  /** ISO 4217 when not USD (e.g. NGX listings use NGN). */
  currency?: string;
}

export interface ScoreBreakdown {
  financialHealth: number;
  growth: number;
  valuation: number;
  newsSentiment: number;
  priceMomentum: number;
  riskLevel: number;
  overall: number;
  weights: {
    financialHealth: number;
    growth: number;
    valuation: number;
    newsSentiment: number;
    priceMomentum: number;
    riskLevel: number;
  };
}

export interface AIAnalysis {
  id: string;
  companyId: string;
  type: "news" | "financial" | "combined";
  financialHealthScore: number;
  growthScore: number;
  valuationScore: number;
  riskScore: number;
  momentumScore: number;
  newsSentimentScore: number;
  overallScore: number;
  decision: Decision;
  confidence: Confidence;
  shortReasoning: string;
  detailedReasoning: string;
  redFlags: string[];
  strengths: string[];
  furtherQuestions: string[];
  newsAnalysis?: NewsAnalysisResult;
  scoreBreakdown?: ScoreBreakdown;
  rawJson: string;
  createdAt: string;
}

export interface ResearchNote {
  id: string;
  companyId: string;
  title: string;
  thesis: string;
  notes: string;
  aiSummary: string;
  decision: Decision | null;
  confidence: Confidence | null;
  tags: string[];
  metricsSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrendSnapshot {
  id: string;
  companyId: string;
  price: number;
  marketCap: number | null;
  peRatio: number | null;
  sentimentScore: number | null;
  overallScore: number | null;
  decision: Decision | null;
  recordedAt: string;
}

export interface AppSettings {
  id: string;
  defaultExchange: string;
  newsProvider: string;
  newsRegion: NewsRegion;
  newsIngestionMode: NewsIngestionMode;
  financialProvider: string;
  aiModel: string;
  disclaimerAccepted: boolean;
  updatedAt: string;
}

export interface CompanyAnalysisInput {
  company: Company;
  financialData: FinancialMetrics;
  newsData: NewsArticle[];
  priceTrend: Array<{ date: string; price: number }>;
  userNotes: string;
}

export interface MarketTapeItem {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface MarketTapeResponse {
  items: MarketTapeItem[];
  label: string;
  updatedAt: string;
}

export interface CompanyAnalysisOutput {
  financialHealthScore: number;
  growthScore: number;
  valuationScore: number;
  riskScore: number;
  momentumScore: number;
  newsSentimentScore: number;
  overallScore: number;
  decision: Decision;
  confidence: Confidence;
  shortReasoning: string;
  detailedReasoning: string;
  redFlags: string[];
  strengths: string[];
  furtherQuestions: string[];
  newsAnalysis: NewsAnalysisResult;
  scoreBreakdown: ScoreBreakdown;
}
