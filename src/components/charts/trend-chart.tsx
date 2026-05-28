"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendSnapshot } from "@/lib/types";

interface TrendChartProps {
  trends: TrendSnapshot[];
}

export function TrendChart({ trends }: TrendChartProps) {
  const data = trends.map((t) => ({
    date: new Date(t.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: t.overallScore ?? 0,
    sentiment: t.sentimentScore ?? 0,
    price: t.price,
  }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No trend data yet. Run AI analysis to record snapshots.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#22d3ee" name="Overall Score" dot />
        <Line type="monotone" dataKey="sentiment" stroke="#a78bfa" name="Sentiment" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
