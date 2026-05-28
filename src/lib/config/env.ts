/** Central env helpers — server only */

export function hasDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
}

export function storageMode(): "supabase" | "local" {
  if (hasDatabaseUrl() || hasSupabaseClientEnv()) return "supabase";
  return "local";
}

export function hasFinnhubKey(): boolean {
  const k = process.env.FINNHUB_API_KEY?.trim();
  return Boolean(k && k !== "optional_finnhub_key");
}

export function hasNgxPulseKey(): boolean {
  const k = process.env.NGX_PULSE_API_KEY?.trim();
  return Boolean(k && !k.startsWith("your_"));
}

export function hasSupabaseClientEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

export function recommendedFinancialProvider(): string {
  return process.env.FINANCIAL_PROVIDER ?? "auto";
}

export function recommendedNewsProvider(): string {
  if (process.env.NEWS_PROVIDER) return process.env.NEWS_PROVIDER;
  if (process.env.NEWSDATA_API_KEY?.trim()) return "newsdata";
  if (process.env.NEWS_API_KEY?.trim()) return "newsapi";
  return "free";
}

export function hasNewsDataKey(): boolean {
  const k = process.env.NEWSDATA_API_KEY?.trim();
  return Boolean(k && !k.startsWith("your_"));
}
