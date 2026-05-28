"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PriceChartProps {
  data: Array<{ date: string; price: number }>;
}

export function PriceChart({ data }: PriceChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        price: d.price,
        ts: new Date(d.date).getTime(),
      })),
    [data]
  );

  const latest = data[data.length - 1]?.price ?? 0;
  const first = data[0]?.price ?? latest;
  const positive = latest >= first;
  const stroke = positive ? "#22d3ee" : "#e879f9";

  const formatAxisDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatTooltipDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
        No price history
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
            <stop
              offset="95%"
              stopColor={positive ? "#a78bfa" : "#f472b6"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAxisDate}
          minTickGap={48}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `$${v}`}
          width={52}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.28)", strokeWidth: 1 }}
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          labelFormatter={(value) => formatTooltipDate(Number(value))}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
        />
        {/* Fill only — no hover dot (prevents dot/cursor offset) */}
        <Area
          type="monotone"
          dataKey="price"
          stroke="none"
          fill="url(#priceGradient)"
          isAnimationActive={false}
          activeDot={false}
          dot={false}
          legendType="none"
        />
        {/* Stroke + aligned hover dot */}
        <Line
          type="monotone"
          dataKey="price"
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            stroke,
            fill: "#0f172a",
          }}
          isAnimationActive={false}
          legendType="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
