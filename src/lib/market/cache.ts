const store = new Map<string, { value: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export const CACHE_TTL = {
  ohlcv: 60 * 60 * 1000,
  fundamentals: 6 * 60 * 60 * 1000,
  filings: 12 * 60 * 60 * 1000,
  tape: 15 * 60 * 1000,
  /** NGX Pulse Personal tier — ~1 stocks call/hour ≈ 24 req/day for ticker */
  ngxPulseStocks: 60 * 60 * 1000,
  ngxPulseTape: 60 * 60 * 1000,
  ngxPulseQuote: 6 * 60 * 60 * 1000,
  ngxPulseRateLimit: 30 * 60 * 1000,
} as const;
