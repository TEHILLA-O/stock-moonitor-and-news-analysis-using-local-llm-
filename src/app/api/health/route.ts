import { NextResponse } from "next/server";
import { useDatabase } from "@/lib/db";
import { db } from "@/lib/db";
import { isDeepSeekConfigured } from "@/lib/services/deepseekService";
import {
  hasDatabaseUrl,
  hasFinnhubKey,
  hasNgxPulseKey,
  hasSupabaseClientEnv,
  storageMode,
} from "@/lib/config/env";
import { defaultAppSettings } from "@/lib/db/default-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  checks.storage = {
    ok: true,
    detail:
      storageMode() === "supabase"
        ? "PostgreSQL (Supabase)"
        : "Local file (.data/store.json) — add DATABASE_URL for Vercel",
  };

  checks.deepseek = {
    ok: isDeepSeekConfigured(),
    detail: isDeepSeekConfigured()
      ? "DeepSeek API configured"
      : "Add DEEPSEEK_API_KEY to .env.local",
  };

  const { hasNewsDataKey } = await import("@/lib/config/env");
  checks.newsData = {
    ok: hasNewsDataKey(),
    detail: hasNewsDataKey()
      ? "NewsData.io key present"
      : "No NEWSDATA_API_KEY",
  };

  checks.newsApi = {
    ok: Boolean(process.env.NEWS_API_KEY),
    detail: process.env.NEWS_API_KEY
      ? "NewsAPI.org key present"
      : "No NEWS_API_KEY",
  };

  checks.financialApi = {
    ok: Boolean(process.env.FINANCIAL_API_KEY),
    detail: process.env.FINANCIAL_API_KEY
      ? `Alpha Vantage key present (${process.env.FINANCIAL_PROVIDER ?? "auto"})`
      : "No FINANCIAL_API_KEY — Yahoo Finance used for prices",
  };

  checks.finnhub = {
    ok: hasFinnhubKey(),
    detail: hasFinnhubKey()
      ? "Finnhub key present"
      : "Optional FINNHUB_API_KEY not set",
  };

  checks.ngxPulse = {
    ok: hasNgxPulseKey(),
    detail: hasNgxPulseKey()
      ? "NGX Pulse API key present (stocks, indices, ETFs)"
      : "Optional NGX_PULSE_API_KEY — get free key at ngxpulse.ng/api",
  };

  if (hasNgxPulseKey()) {
    const { getCached } = await import("@/lib/market/cache");
    const cached = getCached<unknown[]>("ngx:pulse:stocks");
    checks.ngxPulse = {
      ok: true,
      detail: cached
        ? `Key set — ${cached.length} equities cached (no API call on health check)`
        : "Key set — loads on first page view (~1 API call/hour on Personal tier)",
    };
  }

  let dbOk = false;
  if (hasDatabaseUrl()) {
    try {
      const companies = await db.getCompanies();
      dbOk = true;
      checks.database = {
        ok: true,
        detail: `Postgres connected — ${companies.length} companies in watchlist`,
      };
    } catch (e) {
      checks.database = {
        ok: false,
        detail: e instanceof Error ? e.message : "Database connection failed",
      };
    }
  } else if (hasSupabaseClientEnv()) {
    try {
      const companies = await db.getCompanies();
      dbOk = true;
      checks.database = {
        ok: true,
        detail: `Supabase REST connected — ${companies.length} companies in watchlist`,
      };
    } catch (e) {
      checks.database = {
        ok: false,
        detail: e instanceof Error ? e.message : "Supabase REST failed",
      };
    }
  } else {
    checks.database = {
      ok: false,
      detail: "No DATABASE_URL or Supabase keys — using local JSON only",
    };
  }

  let marketOk = false;
  try {
    const { fetchYahooOhlcv } = await import("@/lib/market/yahoo-provider");
    const bars = await fetchYahooOhlcv("AAPL");
    marketOk = bars.length > 10;
    checks.yahoo = {
      ok: marketOk,
      detail: marketOk
        ? `Yahoo Finance OK (${bars.length} daily bars for AAPL)`
        : "Yahoo returned no price data",
    };
  } catch (e) {
    checks.yahoo = {
      ok: false,
      detail: e instanceof Error ? e.message : "Yahoo Finance unreachable",
    };
  }

  const settings = await db.getSettings().catch(() => defaultAppSettings());

  const recommendations: string[] = [];

  if (!hasDatabaseUrl() && !checks.database?.ok) {
    recommendations.push(
      "Add Supabase DATABASE_URL for persistent storage (see docs/SUPABASE.md)."
    );
  }
  if (
    settings.financialProvider === "mock" ||
    settings.financialProvider === "alphavantage"
  ) {
    recommendations.push(
      'Set Financial provider to "Auto" in Settings (Yahoo + Alpha Vantage).'
    );
  }
  if (settings.newsProvider === "mock") {
    recommendations.push('Set News provider to "Free (Hear + RSS)" for live headlines.');
  }
  if (!isDeepSeekConfigured()) {
    recommendations.push("Configure DEEPSEEK_API_KEY for real AI analysis.");
  }

  const criticalOk =
    checks.storage.ok &&
    (checks.database.ok || storageMode() === "local") &&
    checks.yahoo.ok;

  return NextResponse.json({
    ok: criticalOk,
    storage: storageMode(),
    usePostgres: useDatabase(),
    settings: {
      financialProvider: settings.financialProvider,
      newsProvider: settings.newsProvider,
      newsRegion: settings.newsRegion,
    },
    checks,
    recommendations,
  });
}
