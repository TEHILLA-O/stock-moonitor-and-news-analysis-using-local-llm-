/** Central env helpers — server only */

export function hasDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
}

export function storageMode(): "supabase" | "local" {
  return hasDatabaseUrl() ? "supabase" : "local";
}

export function hasFinnhubKey(): boolean {
  const k = process.env.FINNHUB_API_KEY?.trim();
  return Boolean(k && k !== "optional_finnhub_key");
}

export function hasNgxPulseKey(): boolean {
  const k = process.env.NGX_PULSE_API_KEY?.trim();
  return Boolean(k && !k.startsWith("your_"));
}

export function recommendedFinancialProvider(): string {
  return process.env.FINANCIAL_PROVIDER ?? "auto";
}

export function recommendedNewsProvider(): string {
  return process.env.NEWS_PROVIDER ?? "free";
}
