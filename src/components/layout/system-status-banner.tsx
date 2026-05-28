"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type HealthResponse = {
  ok: boolean;
  storage: string;
  recommendations: string[];
  checks: Record<string, { ok: boolean; detail: string }>;
};

export function SystemStatusBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => null);
  }, []);

  if (!health || dismissed) return null;

  const show =
    health.storage === "local" || health.recommendations.length > 0 || !health.ok;

  if (!show) return null;

  const isWarning = health.storage === "local" || !health.ok;

  return (
    <div
      className={`relative rounded-xl border px-4 py-3 text-sm ${
        isWarning
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : "border-cyan-500/20 bg-cyan-500/5 text-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-2 pr-8">
        {health.ok ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        )}
        <div className="space-y-1">
          <p className="font-medium">
            {health.storage === "local"
              ? "Local storage only — data won’t persist on Vercel"
              : "System check"}
          </p>
          <ul className="list-inside list-disc text-xs opacity-90">
            {health.recommendations.slice(0, 3).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Link href="/settings" className="text-xs text-cyan-400 hover:underline">
            Open Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
