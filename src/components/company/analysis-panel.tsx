"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp, Download, FileJson, FileText } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { ShimmerCard } from "@/components/ui/shimmer";
import { AnalysisProgress } from "@/components/ui/analysis-progress";
import { ScoreBreakdownChart } from "@/components/charts/score-breakdown-chart";
import type { AIAnalysis } from "@/lib/types";
import { cn, decisionColor } from "@/lib/utils";
import {
  analysisExportBasename,
  downloadTextFile,
  formatAnalysisJson,
  formatAnalysisMarkdown,
  type AnalysisExportMeta,
} from "@/lib/export/analysis-export";

interface AnalysisPanelProps {
  companyId: string;
  companyTicker: string;
  companyName: string;
  latestAnalysis: AIAnalysis | null;
  analyses?: AIAnalysis[];
  onAnalysisComplete?: () => void;
}

export function AnalysisPanel({
  companyId,
  companyTicker,
  companyName,
  latestAnalysis,
  analyses = [],
  onAnalysisComplete,
}: AnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(latestAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const previous = analyses[1];
  const delta =
    analysis && previous
      ? analysis.overallScore - previous.overallScore
      : null;

  useEffect(() => {
    setAnalysis(latestAnalysis);
  }, [latestAnalysis]);

  useEffect(() => {
    if (!loading) return;
    const t1 = setTimeout(() => setActiveStep(2), 1200);
    const t2 = setTimeout(() => setActiveStep(3), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const exportMeta: AnalysisExportMeta = {
    ticker: companyTicker,
    companyName,
  };

  function exportJson() {
    if (!analysis) return;
    const base = analysisExportBasename(exportMeta);
    downloadTextFile(
      formatAnalysisJson(analysis, exportMeta),
      `${base}.json`,
      "application/json"
    );
  }

  function exportMarkdown() {
    if (!analysis) return;
    const base = analysisExportBasename(exportMeta);
    downloadTextFile(
      formatAnalysisMarkdown(analysis, exportMeta),
      `${base}.md`,
      "text/markdown"
    );
  }

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setActiveStep(1);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis);
      onAnalysisComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
      setActiveStep(1);
    }
  }

  const current = analysis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runAnalysis} disabled={loading} size="lg">
          <Brain className="h-4 w-4" />
          {loading ? "Analyzing…" : "Run DeepSeek Analysis"}
        </Button>
        {current && !loading && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={exportMarkdown}
              title="Download report as Markdown"
            >
              <FileText className="h-4 w-4" />
              Export .md
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={exportJson}
              title="Download full analysis as JSON"
            >
              <FileJson className="h-4 w-4" />
              Export .json
            </Button>
          </>
        )}
        {error && <p className="text-sm text-fuchsia-400">{error}</p>}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <AnalysisProgress activeStep={activeStep} />
            <ShimmerCard />
          </motion.div>
        ) : current ? (
          <motion.div
            key="results"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-end gap-2">
              <p className="mr-auto text-xs text-slate-500">
                Analysis complete · {new Date(current.createdAt).toLocaleString()}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={exportMarkdown}
              >
                <Download className="h-3.5 w-3.5" />
                Download report
              </Button>
            </div>

            <Card className="glass-strong overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
                <ScoreRing
                  score={current.overallScore}
                  label="Research Score"
                  sublabel={`${current.confidence} confidence`}
                  delta={delta}
                  size={200}
                />
                <div className="flex flex-col items-center gap-3 md:items-end">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    AI Decision
                  </p>
                  <p
                    className={cn(
                      "text-4xl font-bold capitalize",
                      decisionColor(current.decision)
                    )}
                  >
                    {current.decision}
                  </p>
                  <Badge variant="info">{current.confidence} confidence</Badge>
                  <p
                    className={cn(
                      "max-w-sm text-center text-sm text-slate-400 md:text-right",
                      !reduceMotion && "md:text-right"
                    )}
                  >
                    {current.shortReasoning}
                  </p>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500">Sentiment</p>
                      <p
                        className={cn(
                          "text-lg font-bold",
                          current.newsSentimentScore >= 0
                            ? "text-cyan-400"
                            : "text-fuchsia-400"
                        )}
                      >
                        {current.newsSentimentScore > 0 ? "+" : ""}
                        {current.newsSentimentScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Risk</p>
                      <p className="text-lg font-bold text-violet-300">
                        {current.riskScore}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Financial", value: current.financialHealthScore, color: "text-cyan-400" },
                { label: "Growth", value: current.growthScore, color: "text-violet-400" },
                { label: "Valuation", value: current.valuationScore, color: "text-fuchsia-400" },
                { label: "Momentum", value: current.momentumScore, color: "text-cyan-300" },
                { label: "Risk", value: current.riskScore, color: "text-amber-400" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-gradient-subtle">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {current.scoreBreakdown && (
                  <ScoreBreakdownChart breakdown={current.scoreBreakdown} />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-cyan-500/10">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {current.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-cyan-500/5 px-3 py-2 text-sm text-slate-300"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-fuchsia-500/10">
                <CardHeader>
                  <CardTitle className="text-fuchsia-400">Red Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {current.redFlags.map((r, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-fuchsia-500/5 px-3 py-2 text-sm text-slate-300"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <button
                type="button"
                className="flex w-full items-center justify-between p-6 text-left"
                onClick={() => setDetailsOpen(!detailsOpen)}
              >
                <CardTitle className="mb-0">Detailed Breakdown</CardTitle>
                {detailsOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
              <AnimatePresence>
                {detailsOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-4 border-t border-white/[0.06] pt-0">
                      <p className="text-sm text-slate-400 whitespace-pre-wrap">
                        {current.detailedReasoning}
                      </p>
                      <div>
                        <p className="mb-2 text-sm font-medium text-violet-300">
                          Further research
                        </p>
                        <ul className="space-y-1">
                          {current.furtherQuestions.map((q, i) => (
                            <li key={i} className="text-sm text-slate-500">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="mx-auto mb-4 h-12 w-12 text-violet-500/40" />
                <p className="text-slate-400">
                  No AI analysis yet. Run DeepSeek to generate your research score.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
