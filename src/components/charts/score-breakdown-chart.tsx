"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoreBreakdown } from "@/lib/types";

const COLORS = ["#22d3ee", "#a78bfa", "#e879f9", "#fbbf24", "#67e8f9", "#f472b6"];

interface ScoreBreakdownChartProps {
  breakdown: ScoreBreakdown;
}

export function ScoreBreakdownChart({ breakdown }: ScoreBreakdownChartProps) {
  const data = [
    {
      name: "Financial",
      score: breakdown.financialHealth,
      weight: breakdown.weights.financialHealth,
    },
    { name: "Growth", score: breakdown.growth, weight: breakdown.weights.growth },
    {
      name: "Valuation",
      score: breakdown.valuation,
      weight: breakdown.weights.valuation,
    },
    {
      name: "News",
      score: breakdown.newsSentiment,
      weight: breakdown.weights.newsSentiment,
    },
    {
      name: "Momentum",
      score: breakdown.priceMomentum,
      weight: breakdown.weights.priceMomentum,
    },
    { name: "Risk*", score: breakdown.riskLevel, weight: breakdown.weights.riskLevel },
  ];

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-sm text-slate-400">Overall Research Score</p>
          <p className="text-4xl font-bold text-gradient">{breakdown.overall}</p>
        </div>
        <p className="text-xs text-slate-500">*Risk inverted (lower risk = higher score)</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            formatter={(value) => {
              const v = Number(value);
              return [`${v}/100`, "Score"];
            }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
