"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TechnicalRow } from "@/lib/technical/indicators";

export function TechnicalChart({ data }: { data: TechnicalRow[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
        <YAxis
          yAxisId="price"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={(v) => `$${v}`}
          domain={["auto", "auto"]}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          tick={{ fill: "#475569", fontSize: 10 }}
          tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`}
        />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
          formatter={(value, name) => {
            const n = Number(value ?? 0);
            if (name === "volume") return [n.toLocaleString(), "Volume"];
            return [n.toFixed(2), String(name)];
          }}
        />
        <Bar yAxisId="volume" dataKey="volume" fill="rgba(34,211,238,0.18)" maxBarSize={8} />
        <Line yAxisId="price" type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} dot={false} />
        <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#a78bfa" strokeWidth={1.8} dot={false} />
        <Line yAxisId="price" type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.4} dot={false} />
        <Line yAxisId="price" type="monotone" dataKey="sma200" stroke="#f472b6" strokeWidth={1.4} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
