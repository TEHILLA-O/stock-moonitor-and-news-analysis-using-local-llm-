"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Brain } from "lucide-react";
import { cn, decisionColor } from "@/lib/utils";

interface HistoryItem {
  id: string;
  companyId: string;
  ticker: string;
  companyName: string;
  overallScore: number;
  decision: string;
  confidence: string;
  shortReasoning: string;
  createdAt: string;
}

export function HistoryDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/history")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0a0a12]/95 shadow-2xl backdrop-blur-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" />
              <Dialog.Title className="text-lg font-semibold text-slate-100">
                Analysis History
              </Dialog.Title>
            </div>
            <Dialog.Close className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-sm text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No analyses yet. Run DeepSeek on a company to see history here.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/company/${item.ticker}`}
                      onClick={() => onOpenChange(false)}
                      className="glass block rounded-xl p-4 transition-all hover:border-cyan-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-400">{item.ticker}</span>
                        <span className="text-lg font-bold text-violet-300">
                          {item.overallScore}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.companyName}</p>
                      <p className={cn("mt-1 text-xs font-medium capitalize", decisionColor(item.decision))}>
                        {item.decision} · {item.confidence}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                        {item.shortReasoning}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-600">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
