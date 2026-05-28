import type { ScoreBreakdown } from "@/lib/types";

export const SCORE_WEIGHTS = {
  financialHealth: 0.25,
  growth: 0.2,
  valuation: 0.2,
  newsSentiment: 0.15,
  priceMomentum: 0.1,
  riskLevel: 0.1,
} as const;

/** Risk score is inverted: lower risk = higher contribution */
export function calculateOverallScore(scores: {
  financialHealth: number;
  growth: number;
  valuation: number;
  newsSentiment: number;
  priceMomentum: number;
  riskScore: number;
}): ScoreBreakdown {
  const riskContribution = 100 - scores.riskScore;

  const overall = Math.round(
    scores.financialHealth * SCORE_WEIGHTS.financialHealth +
      scores.growth * SCORE_WEIGHTS.growth +
      scores.valuation * SCORE_WEIGHTS.valuation +
      scores.newsSentiment * SCORE_WEIGHTS.newsSentiment +
      scores.priceMomentum * SCORE_WEIGHTS.priceMomentum +
      riskContribution * SCORE_WEIGHTS.riskLevel
  );

  return {
    financialHealth: scores.financialHealth,
    growth: scores.growth,
    valuation: scores.valuation,
    newsSentiment: scores.newsSentiment,
    priceMomentum: scores.priceMomentum,
    riskLevel: riskContribution,
    overall: Math.min(100, Math.max(0, overall)),
    weights: {
      financialHealth: SCORE_WEIGHTS.financialHealth * 100,
      growth: SCORE_WEIGHTS.growth * 100,
      valuation: SCORE_WEIGHTS.valuation * 100,
      newsSentiment: SCORE_WEIGHTS.newsSentiment * 100,
      priceMomentum: SCORE_WEIGHTS.priceMomentum * 100,
      riskLevel: SCORE_WEIGHTS.riskLevel * 100,
    },
  };
}

export function sentimentToScore(sentiment: number): number {
  return Math.round(((sentiment + 100) / 200) * 100);
}
