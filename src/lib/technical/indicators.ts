import type { OhlcvBar } from "@/lib/types";

export interface TechnicalRow {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  rsi14: number | null;
  volume: number;
}

export interface TechnicalSnapshot {
  lastPrice: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  trend: "bullish" | "bearish" | "neutral";
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volatility30d: number;
}

function sma(values: number[], period: number, idx: number): number | null {
  if (idx + 1 < period) return null;
  const window = values.slice(idx + 1 - period, idx + 1);
  return window.reduce((sum, v) => sum + v, 0) / period;
}

function emaSeries(values: number[], period: number): Array<number | null> {
  const multiplier = 2 / (period + 1);
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const firstSma = values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  out[period - 1] = firstSma;
  for (let i = period; i < values.length; i++) {
    const prev = out[i - 1] ?? values[i - 1];
    out[i] = (values[i] - prev) * multiplier + prev;
  }
  return out;
}

function rsiSeries(values: number[], period = 14): Array<number | null> {
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gain += delta;
    else loss += Math.abs(delta);
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const g = Math.max(delta, 0);
    const l = Math.max(-delta, 0);
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function buildTechnicalData(
  history: Array<{ date: string; price: number }>,
  volumes?: Array<{ date: string; volume: number }>
): { rows: TechnicalRow[]; snapshot: TechnicalSnapshot | null } {
  if (history.length === 0) return { rows: [], snapshot: null };

  const volumeByDate = new Map(
    (volumes ?? []).map((v) => [v.date, v.volume])
  );

  const prices = history.map((h) => h.price);
  const ema12 = emaSeries(prices, 12);
  const ema26 = emaSeries(prices, 26);
  const rsi14 = rsiSeries(prices, 14);

  const macd = prices.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null
      ? (ema12[i] as number) - (ema26[i] as number)
      : null
  );
  const macdNums = macd.map((v) => v ?? 0);
  const signalRaw = emaSeries(macdNums, 9);
  const signal = signalRaw.map((v, i) => (macd[i] === null ? null : v));
  const hist = macd.map((v, i) =>
    v !== null && signal[i] !== null ? v - (signal[i] as number) : null
  );

  const rows: TechnicalRow[] = history.map((h, i) => ({
    date: h.date,
    price: h.price,
    open: h.price,
    high: h.price,
    low: h.price,
    sma20: sma(prices, 20, i),
    sma50: sma(prices, 50, i),
    sma200: sma(prices, 200, i),
    ema12: ema12[i],
    ema26: ema26[i],
    macd: macd[i],
    signal: signal[i],
    histogram: hist[i],
    rsi14: rsi14[i],
    volume: volumeByDate.get(h.date) ?? 0,
  }));

  return { rows, snapshot: buildSnapshot(rows, prices) };
}

export function buildTechnicalDataFromOhlcv(
  ohlcv: OhlcvBar[]
): { rows: TechnicalRow[]; snapshot: TechnicalSnapshot | null } {
  if (ohlcv.length === 0) return { rows: [], snapshot: null };

  const prices = ohlcv.map((b) => b.close);
  const ema12 = emaSeries(prices, 12);
  const ema26 = emaSeries(prices, 26);
  const rsi14 = rsiSeries(prices, 14);

  const macd = prices.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null
      ? (ema12[i] as number) - (ema26[i] as number)
      : null
  );
  const macdNums = macd.map((v) => v ?? 0);
  const signalRaw = emaSeries(macdNums, 9);
  const signal = signalRaw.map((v, i) => (macd[i] === null ? null : v));
  const hist = macd.map((v, i) =>
    v !== null && signal[i] !== null ? v - (signal[i] as number) : null
  );

  const rows: TechnicalRow[] = ohlcv.map((b, i) => ({
    date: b.date,
    price: b.close,
    open: b.open,
    high: b.high,
    low: b.low,
    sma20: sma(prices, 20, i),
    sma50: sma(prices, 50, i),
    sma200: sma(prices, 200, i),
    ema12: ema12[i],
    ema26: ema26[i],
    macd: macd[i],
    signal: signal[i],
    histogram: hist[i],
    rsi14: rsi14[i],
    volume: b.volume,
  }));

  return { rows, snapshot: buildSnapshot(rows, prices) };
}

function buildSnapshot(
  rows: TechnicalRow[],
  prices: number[]
): TechnicalSnapshot | null {
  if (rows.length === 0) return null;
  const last = rows[rows.length - 1];
  const w252 = prices.slice(-252);
  const recent30 = prices.slice(-30);
  const trend =
    last.sma20 && last.sma50
      ? last.price > last.sma20 && last.sma20 > last.sma50
        ? "bullish"
        : last.price < last.sma20 && last.sma20 < last.sma50
          ? "bearish"
          : "neutral"
      : "neutral";

  return {
    lastPrice: last.price,
    sma20: last.sma20,
    sma50: last.sma50,
    sma200: last.sma200,
    rsi14: last.rsi14,
    macd: last.macd,
    macdSignal: last.signal,
    macdHist: last.histogram,
    trend,
    fiftyTwoWeekHigh: Math.max(...w252),
    fiftyTwoWeekLow: Math.min(...w252),
    volatility30d: stdDev(recent30),
  };
}
