"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import type { OhlcvBar } from "@/lib/types";
import type { ChartInterval } from "@/lib/market/types";
import { resampleOhlcv } from "@/lib/market/resample";
import {
  buildTechnicalDataFromOhlcv,
  type TechnicalSnapshot,
} from "@/lib/technical/indicators";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { MacdChart, RsiChart } from "@/components/charts/macd-rsi-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

function pct(a: number, b: number): string {
  if (b === 0) return "0.00%";
  return `${(((a - b) / b) * 100).toFixed(2)}%`;
}

export function TechnicalView({
  ohlcv,
  snapshot: fallbackSnapshot,
  dataSources,
}: {
  ohlcv: OhlcvBar[];
  snapshot: TechnicalSnapshot | null;
  dataSources?: string[];
}) {
  const [interval, setInterval] = useState<ChartInterval>("daily");

  const { rows, snapshot } = useMemo(() => {
    const resampled = resampleOhlcv(ohlcv, interval);
    const built = buildTechnicalDataFromOhlcv(resampled);
    return {
      rows: built.rows,
      snapshot: built.snapshot ?? fallbackSnapshot,
    };
  }, [ohlcv, interval, fallbackSnapshot]);

  if (!snapshot || rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Not enough price history for technical indicators.
      </p>
    );
  }

  const intervals: { id: ChartInterval; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {intervals.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setInterval(opt.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              interval === opt.id
                ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}
        {dataSources?.length ? (
          <span className="ml-auto text-xs text-slate-500">
            Sources: {dataSources.join(" · ")} · delayed data
          </span>
        ) : null}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Candlestick + SMA 20/50/200</CardTitle>
          <Badge
            variant={
              snapshot.trend === "bullish"
                ? "success"
                : snapshot.trend === "bearish"
                  ? "danger"
                  : "secondary"
            }
          >
            {snapshot.trend}
          </Badge>
        </CardHeader>
        <CardContent>
          <CandlestickChart data={rows} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MACD</CardTitle>
          </CardHeader>
          <CardContent>
            <MacdChart data={rows} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">RSI (14)</CardTitle>
          </CardHeader>
          <CardContent>
            <RsiChart data={rows} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Last Price" value={formatCurrency(snapshot.lastPrice)} />
        <Metric title="SMA 20" value={snapshot.sma20 ? formatCurrency(snapshot.sma20) : "—"} />
        <Metric title="SMA 50" value={snapshot.sma50 ? formatCurrency(snapshot.sma50) : "—"} />
        <Metric title="SMA 200" value={snapshot.sma200 ? formatCurrency(snapshot.sma200) : "—"} />
        <Metric title="RSI (14)" value={snapshot.rsi14 ? snapshot.rsi14.toFixed(2) : "—"} />
        <Metric title="MACD" value={snapshot.macd ? snapshot.macd.toFixed(3) : "—"} />
        <Metric title="Signal" value={snapshot.macdSignal ? snapshot.macdSignal.toFixed(3) : "—"} />
        <Metric title="Histogram" value={snapshot.macdHist ? snapshot.macdHist.toFixed(3) : "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Technical Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Item label="52W High" value={formatCurrency(snapshot.fiftyTwoWeekHigh)} />
            <Item label="52W Low" value={formatCurrency(snapshot.fiftyTwoWeekLow)} />
            <Item
              label="Distance from 52W High"
              value={pct(snapshot.lastPrice, snapshot.fiftyTwoWeekHigh)}
            />
            <Item
              label="Distance from 52W Low"
              value={pct(snapshot.lastPrice, snapshot.fiftyTwoWeekLow)}
            />
            <Item label="30D Volatility" value={snapshot.volatility30d.toFixed(2)} />
            <Item label="Bars" value={rows.length.toString()} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-200">{value}</p>
    </div>
  );
}
