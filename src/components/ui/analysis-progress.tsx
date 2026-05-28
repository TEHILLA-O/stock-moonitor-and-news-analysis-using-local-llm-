"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Fetching financials & news" },
  { id: 2, label: "Running DeepSeek analysis" },
  { id: 3, label: "Computing research scores" },
];

interface AnalysisProgressProps {
  activeStep: number;
}

export function AnalysisProgress({ activeStep }: AnalysisProgressProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="glass-strong rounded-2xl p-8">
      <div className="mb-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <p className="text-sm font-medium text-slate-300">Analysis in progress…</p>
      </div>
      <div className="space-y-4">
        {STEPS.map((step) => {
          const done = activeStep > step.id;
          const active = activeStep === step.id;
          return (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                  done && "border-cyan-500/50 bg-cyan-500/20 text-cyan-400",
                  active && "border-violet-500/50 bg-violet-500/20 text-violet-300",
                  !done && !active && "border-white/10 text-slate-600"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  reduceMotion ? (
                    "…"
                  ) : (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      {step.id}
                    </motion.span>
                  )
                ) : (
                  step.id
                )}
              </div>
              <p
                className={cn(
                  "text-sm",
                  active ? "text-slate-200" : done ? "text-slate-400" : "text-slate-600"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
