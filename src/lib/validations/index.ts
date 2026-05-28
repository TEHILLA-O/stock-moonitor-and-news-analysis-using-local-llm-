import { z } from "zod";

export const companyStatusSchema = z.enum([
  "watching",
  "researched",
  "bought",
  "rejected",
]);

export const decisionSchema = z.enum(["buy", "hold", "watch", "avoid"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  ticker: z.string().min(1).max(12).regex(/^[A-Za-z0-9.-]+$/),
  exchange: z.string().max(50).optional().default(""),
  sector: z.string().max(100).optional().default(""),
  country: z.string().max(100).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  status: companyStatusSchema.optional().default("watching"),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
});

export const createResearchNoteSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(1).max(300),
  thesis: z.string().max(10000).optional().default(""),
  notes: z.string().max(20000).optional().default(""),
  aiSummary: z.string().max(5000).optional().default(""),
  decision: decisionSchema.nullable().optional(),
  confidence: confidenceSchema.nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  metricsSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const analyzeCompanySchema = z.object({
  companyId: z.string().uuid(),
  userNotes: z.string().max(5000).optional().default(""),
});

export const tickerParamSchema = z.string().min(1).max(12);
