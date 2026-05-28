import { COMPANY_DIRECTORY } from "@/lib/data/company-directory";
import { db } from "@/lib/db";
import { fetchNgxPulseStocks, isNgxPulseConfigured } from "@/lib/market/ngx-pulse";
import type { Company } from "@/lib/types";

const INDEX_TICKERS = new Set(["ASI", "NGX", "NGX30", "NGX50"]);

function directoryMatch(ticker: string) {
  const upper = ticker.toUpperCase();
  return COMPANY_DIRECTORY.find((e) => e.ticker.toUpperCase() === upper);
}

function buildCompany(
  ticker: string,
  meta: {
    name: string;
    exchange: string;
    sector: string;
    country: string;
    id?: string;
    notes?: string;
  }
): Company {
  const now = new Date().toISOString();
  return {
    id: meta.id ?? `browse-${ticker.toUpperCase()}`,
    name: meta.name,
    ticker: ticker.toUpperCase(),
    exchange: meta.exchange,
    sector: meta.sector,
    country: meta.country,
    notes: meta.notes ?? "",
    status: "watching",
    createdAt: now,
    updatedAt: now,
  };
}

async function ngxPulseMeta(ticker: string): Promise<{
  name: string;
  sector: string;
} | null> {
  if (!isNgxPulseConfigured()) return null;
  try {
    const stocks = await fetchNgxPulseStocks();
    const hit = stocks.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase());
    if (!hit) return null;
    return {
      name: hit.name ?? ticker.toUpperCase(),
      sector: hit.sector ?? "",
    };
  } catch {
    return null;
  }
}

/** True when company was opened from ticker bar / search, not saved in watchlist. */
export function isBrowseOnlyCompany(company: Company): boolean {
  return company.id.startsWith("browse-");
}

/**
 * Resolve a ticker for company pages — watchlist first, then directory / NGX Pulse,
 * then a browse-only NGX stub so ticker-bar links always open a data page.
 */
export async function resolveCompanyForTicker(
  ticker: string
): Promise<Company | null> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return null;

  const inWatchlist = await db.getCompanyByTicker(normalized);
  if (inWatchlist) return inWatchlist;

  const fromDirectory = directoryMatch(normalized);
  if (fromDirectory) {
    return buildCompany(normalized, {
      name: fromDirectory.name,
      exchange: fromDirectory.exchange,
      sector: fromDirectory.sector,
      country: fromDirectory.country,
    });
  }

  const ngx = await ngxPulseMeta(normalized);
  if (ngx) {
    return buildCompany(normalized, {
      name: ngx.name,
      exchange: "NGX",
      sector: ngx.sector,
      country: "Nigeria",
      notes: "Opened from market ticker",
    });
  }

  if (INDEX_TICKERS.has(normalized)) {
    return buildCompany(normalized, {
      name:
        normalized === "ASI"
          ? "NGX All Share Index"
          : `${normalized} Index`,
      exchange: "NGX",
      sector: "Index",
      country: "Nigeria",
      notes: "Market index",
    });
  }

  // Default: assume NGX listing from ticker tape (most tape symbols are NGX)
  return buildCompany(normalized, {
    name: normalized,
    exchange: "NGX",
    sector: "",
    country: "Nigeria",
    notes: "Opened from market ticker",
  });
}
