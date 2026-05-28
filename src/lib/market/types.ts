import type { FinancialMetrics } from "@/lib/types";

export type ChartInterval = "daily" | "weekly" | "monthly";

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

export interface MarketDataBundle {
  financials: FinancialMetrics;
  ohlcv: OhlcvBar[];
  filings: SecFiling[];
  sources: string[];
}
