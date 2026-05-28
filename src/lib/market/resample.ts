import type { ChartInterval, OhlcvBar } from "./types";

export function ohlcvToPriceHistory(
  bars: OhlcvBar[]
): Array<{ date: string; price: number }> {
  return bars.map((b) => ({ date: b.date, price: b.close }));
}

export function resampleOhlcv(
  bars: OhlcvBar[],
  interval: ChartInterval
): OhlcvBar[] {
  if (interval === "daily" || bars.length === 0) return bars;

  const bucketKey = (date: string) => {
    const d = new Date(date);
    if (interval === "weekly") {
      const day = d.getUTCDay();
      const diff = (day + 6) % 7;
      d.setUTCDate(d.getUTCDate() - diff);
      return d.toISOString().slice(0, 10);
    }
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  const buckets = new Map<string, OhlcvBar[]>();
  for (const bar of bars) {
    const key = bucketKey(bar.date);
    const list = buckets.get(key) ?? [];
    list.push(bar);
    buckets.set(key, list);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, group]) => {
      const open = group[0].open;
      const close = group[group.length - 1].close;
      const high = Math.max(...group.map((g) => g.high));
      const low = Math.min(...group.map((g) => g.low));
      const volume = group.reduce((s, g) => s + g.volume, 0);
      return { date, open, high, low, close, volume };
    });
}
