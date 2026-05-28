import { AlertTriangle } from "lucide-react";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-slate-600">
        <span className="text-amber-500/80">Not financial advice</span> · Private research only
      </p>
    );
  }

  return (
    <div className="glass flex items-start gap-3 rounded-xl border-amber-500/15 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" />
      <div className="text-sm text-slate-400">
        <strong className="font-semibold text-amber-300/90">Disclaimer:</strong> Private
        research only. Not financial advice, recommendations, or solicitation to trade
        securities.
      </div>
    </div>
  );
}
