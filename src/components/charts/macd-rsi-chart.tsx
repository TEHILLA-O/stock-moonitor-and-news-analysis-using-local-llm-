"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TechnicalRow } from "@/lib/technical/indicators";

export function MacdChart({ data }: { data: TechnicalRow[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="histogram" fill="rgba(167,139,250,0.45)" maxBarSize={6} />
        <Line type="monotone" dataKey="macd" stroke="#22d3ee" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RsiChart({ data }: { data: TechnicalRow[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
        <ReferenceLine y={70} stroke="rgba(244,114,182,0.4)" strokeDasharray="4 4" />
        <ReferenceLine y={30} stroke="rgba(34,211,238,0.4)" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Line type="monotone" dataKey="rsi14" stroke="#a78bfa" strokeWidth={1.8} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
