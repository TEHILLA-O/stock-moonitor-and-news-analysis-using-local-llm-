"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TrendingUp, Brain, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pmr-onboarding-done";

export function OnboardingOverlay() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-strong relative max-w-lg rounded-2xl p-8"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:text-slate-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
              <TrendingUp className="h-7 w-7 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-gradient">
              Private Market Research
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Your personal investment research workspace. Not financial advice — for
              private research only.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: List,
                  title: "Build your watchlist",
                  desc: "Track companies you are researching with status and notes.",
                },
                {
                  icon: Brain,
                  title: "Run DeepSeek analysis",
                  desc: "Get scores, sentiment, and buy/hold/watch/avoid decisions.",
                },
                {
                  icon: TrendingUp,
                  title: "Document trends",
                  desc: "Snapshots over time show how your thesis evolves.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <item.icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full rounded-full" onClick={dismiss}>
              Get started
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
