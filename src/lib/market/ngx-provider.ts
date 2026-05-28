/**
 * Nigerian Exchange (NGX) quotes — NGX Pulse API when keyed, kwayisi.org for OHLCV fallback.
 */

import type { FinancialMetrics } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";
import {
  fetchNgxPulseQuote,
  isNgxPulseConfigured,
} from "./ngx-pulse";
import type { OhlcvBar } from "./types";
import { ohlcvToPriceHistory } from "./resample";

function parseNgnAmount(raw: string): number {
  const s = raw.replace(/,/g, "").trim().toUpperCase();
  if (!s || s === "—" || s === "-") return 0;
  let mult = 1;
  let numStr = s;
  if (s.endsWith("T")) {
    mult = 1e12;
    numStr = s.slice(0, -1);
  } else if (s.endsWith("B")) {
    mult = 1e9;
    numStr = s.slice(0, -1);
  } else if (s.endsWith("M")) {
    mult = 1e6;
    numStr = s.slice(0, -1);
  } else if (s.endsWith("K")) {
    mult = 1e3;
    numStr = s.slice(0, -1);
  }
  const n = Number.parseFloat(numStr);
  return Number.isFinite(n) ? n * mult : 0;
}

function parseHistoricalRows(html: string): OhlcvBar[] {
  const rows = [
    ...html.matchAll(
      /<tr><td>(\d{4}-\d{2}-\d{2})<td>([0-9,]*)<td>([0-9,]+\.?[0-9]*)/g
    ),
  ];

  return rows
    .map((m) => {
      const close = Number.parseFloat(m[3].replace(/,/g, ""));
      if (!Number.isFinite(close)) return null;
      return {
        date: m[1],
        open: close,
        high: close,
        low: close,
        close,
        volume: Number.parseInt(m[2].replace(/,/g, ""), 10) || 0,
      };
    })
    .filter((b): b is OhlcvBar => b !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchNgxKwayisiBundle(
  ticker: string
): Promise<Partial<FinancialMetrics> & { ohlcv: OhlcvBar[] }> {
  const symbol = ticker.toLowerCase().replace(/\.(lg|ng)$/i, "");
  const cacheKey = `ngx:kwayisi:${symbol}`;
  const cached = getCached<Partial<FinancialMetrics> & { ohlcv: OhlcvBar[] }>(
    cacheKey
  );
  if (cached) return cached;

  const url = `https://afx.kwayisi.org/ngx/${symbol}.html`;
  const res = await fetch(url, {
    headers: { "User-Agent": "PrivateMarketResearchAssistant/1.0" },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`NGX quote page not found for ${ticker.toUpperCase()}`);
  }

  const html = await res.text();
  const ohlcv = parseHistoricalRows(html);

  const priceMatch = html.match(
    new RegExp(
      `${ticker.toUpperCase()}[^0-9]{0,80}([0-9,]+\\.[0-9]{2})`,
      "i"
    )
  );
  const headerPrice = priceMatch
    ? Number.parseFloat(priceMatch[1].replace(/,/g, ""))
    : null;

  const capMatch = html.match(/Market Capitalization<td>([^<]+)/i);
  const marketCap = capMatch ? parseNgnAmount(capMatch[1]) : 0;

  const currentPrice =
    headerPrice ?? ohlcv[ohlcv.length - 1]?.close ?? 0;

  if (!currentPrice && ohlcv.length === 0) {
    throw new Error(`No NGX price data for ${ticker.toUpperCase()}`);
  }

  const result = {
    currentPrice,
    marketCap,
    peRatio: null,
    eps: null,
    revenue: 0,
    netIncome: 0,
    freeCashFlow: 0,
    totalDebt: 0,
    cash: 0,
    dividendYield: null,
    analystTarget: null,
    priceHistory: ohlcvToPriceHistory(ohlcv),
    ohlcvHistory: ohlcv,
    dataSources: ["NGX (Kwayisi)"],
    isDelayed: true,
    currency: "NGN" as const,
    ohlcv,
  };

  setCached(cacheKey, result, CACHE_TTL.fundamentals);
  return result;
}

export async function fetchNgxMarketData(
  ticker: string
): Promise<Partial<FinancialMetrics> & { ohlcv: OhlcvBar[] }> {
  let bundle: Partial<FinancialMetrics> & { ohlcv: OhlcvBar[] };
  let usedPulse = false;

  if (isNgxPulseConfigured()) {
    try {
      const pulse = await fetchNgxPulseQuote(ticker);
      try {
        const kwayisi = await fetchNgxKwayisiBundle(ticker);
        bundle = {
          ...kwayisi,
          ...pulse,
          priceHistory: kwayisi.priceHistory,
          ohlcvHistory: kwayisi.ohlcv,
          ohlcv: kwayisi.ohlcv,
          dataSources: [
            ...new Set([
              ...(pulse.dataSources ?? []),
              ...(kwayisi.dataSources ?? []),
            ]),
          ],
        };
      } catch {
        bundle = {
          ...pulse,
          ohlcv: pulse.ohlcvHistory ?? [],
          priceHistory: pulse.priceHistory ?? [],
          ohlcvHistory: pulse.ohlcvHistory ?? [],
        };
      }
      usedPulse = true;
    } catch {
      bundle = await fetchNgxKwayisiBundle(ticker);
    }
  } else {
    bundle = await fetchNgxKwayisiBundle(ticker);
  }

  if (!usedPulse && bundle.ohlcv.length === 0 && !bundle.currentPrice) {
    throw new Error(`No NGX price data for ${ticker.toUpperCase()}`);
  }

  return bundle;
}
