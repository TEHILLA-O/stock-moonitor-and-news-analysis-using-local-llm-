"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
  delta?: number | null;
  className?: string;
}

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, enabled, reduceMotion]);

  return value;
}

function scoreBand(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Strong", color: "#22d3ee" };
  if (score >= 60) return { label: "Moderate", color: "#a78bfa" };
  if (score >= 45) return { label: "Neutral", color: "#fbbf24" };
  return { label: "Weak", color: "#f472b6" };
}

export function ScoreRing({
  score,
  size = 180,
  label,
  sublabel,
  delta,
  className,
}: ScoreRingProps) {
  const displayScore = useCountUp(score, 1400);
  const band = scoreBand(score);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative score-ring-glow" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums text-slate-100">
            {displayScore}
          </span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-sm font-semibold text-gradient">{label}</p>
      )}
      <p className="mt-1 text-xs font-medium" style={{ color: band.color }}>
        {band.label} match
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>}
      {delta !== undefined && delta !== null && (
        <p
          className={cn(
            "mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
            delta >= 0
              ? "bg-cyan-500/10 text-cyan-400"
              : "bg-fuchsia-500/10 text-fuchsia-400"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta} vs last scan
        </p>
      )}
    </div>
  );
}
