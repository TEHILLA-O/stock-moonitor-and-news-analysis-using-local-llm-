import type { AIAnalysis } from "@/lib/types";

export type AnalysisExportMeta = {
  ticker: string;
  companyName: string;
};

export function buildAnalysisExportPayload(
  analysis: AIAnalysis,
  meta: AnalysisExportMeta
) {
  let parsedRaw: unknown = null;
  if (analysis.rawJson) {
    try {
      parsedRaw = JSON.parse(analysis.rawJson);
    } catch {
      parsedRaw = analysis.rawJson;
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Private research only — not financial advice. Verify all figures independently.",
    company: meta,
    analysis: {
      id: analysis.id,
      type: analysis.type,
      createdAt: analysis.createdAt,
      overallScore: analysis.overallScore,
      decision: analysis.decision,
      confidence: analysis.confidence,
      scores: {
        financialHealth: analysis.financialHealthScore,
        growth: analysis.growthScore,
        valuation: analysis.valuationScore,
        risk: analysis.riskScore,
        momentum: analysis.momentumScore,
        newsSentiment: analysis.newsSentimentScore,
      },
      scoreBreakdown: analysis.scoreBreakdown,
      shortReasoning: analysis.shortReasoning,
      detailedReasoning: analysis.detailedReasoning,
      strengths: analysis.strengths,
      redFlags: analysis.redFlags,
      furtherQuestions: analysis.furtherQuestions,
      newsAnalysis: analysis.newsAnalysis,
      raw: parsedRaw,
    },
  };
}

export function formatAnalysisJson(
  analysis: AIAnalysis,
  meta: AnalysisExportMeta
): string {
  return JSON.stringify(buildAnalysisExportPayload(analysis, meta), null, 2);
}

export function formatAnalysisMarkdown(
  analysis: AIAnalysis,
  meta: AnalysisExportMeta
): string {
  const date = new Date(analysis.createdAt).toLocaleString();
  const lines: string[] = [
    `# AI Research Report — ${meta.ticker}`,
    "",
    `**Company:** ${meta.companyName} (${meta.ticker})`,
    `**Generated:** ${date}`,
    `**Analysis ID:** ${analysis.id}`,
    "",
    "---",
    "",
    "## Summary",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| Overall score | **${analysis.overallScore}** / 100 |`,
    `| Decision | **${analysis.decision.toUpperCase()}** |`,
    `| Confidence | ${analysis.confidence} |`,
    `| News sentiment | ${analysis.newsSentimentScore > 0 ? "+" : ""}${analysis.newsSentimentScore} |`,
    "",
    analysis.shortReasoning,
    "",
    "## Score breakdown",
    "",
    `| Dimension | Score |`,
    `| --- | ---: |`,
    `| Financial health | ${analysis.financialHealthScore} |`,
    `| Growth | ${analysis.growthScore} |`,
    `| Valuation | ${analysis.valuationScore} |`,
    `| Momentum | ${analysis.momentumScore} |`,
    `| Risk | ${analysis.riskScore} |`,
  ];

  if (analysis.scoreBreakdown) {
    lines.push(
      "",
      `**Weighted overall:** ${analysis.scoreBreakdown.overall}`,
      ""
    );
  }

  lines.push(
    "## Strengths",
    "",
    ...analysis.strengths.map((s) => `- ${s}`),
    "",
    "## Red flags",
    "",
    ...analysis.redFlags.map((r) => `- ${r}`),
    "",
    "## Detailed reasoning",
    "",
    analysis.detailedReasoning,
    "",
    "## Further research",
    "",
    ...analysis.furtherQuestions.map((q) => `- ${q}`)
  );

  if (analysis.newsAnalysis) {
    const na = analysis.newsAnalysis;
    lines.push(
      "",
      "## News analysis",
      "",
      na.summary,
      "",
      `**Overall news sentiment:** ${na.overallSentimentScore}`,
      "",
      "### Risks",
      "",
      ...na.risks.map((r) => `- ${r}`),
      "",
      "### Opportunities",
      "",
      ...na.opportunities.map((o) => `- ${o}`)
    );

    if (na.articles.length > 0) {
      lines.push("", "### Articles reviewed", "");
      for (const a of na.articles) {
        lines.push(
          `- **${a.classification}** (${a.sentimentScore > 0 ? "+" : ""}${a.sentimentScore}): ${a.explanation}`
        );
      }
    }
  }

  lines.push(
    "",
    "---",
    "",
    "*Private research only — not financial advice. Verify all figures independently.*"
  );

  return lines.join("\n");
}

export function analysisExportBasename(meta: AnalysisExportMeta): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${meta.ticker}-ai-analysis-${day}`;
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
