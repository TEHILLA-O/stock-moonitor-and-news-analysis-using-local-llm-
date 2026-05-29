import { db } from "@/lib/db";
import { defaultAppSettings } from "@/lib/db/default-settings";
import type { AIAnalysis, AppSettings, Company } from "@/lib/types";

export type DashboardCardData = {
  company: Company;
  price?: number;
  changePercent: number;
  latestAnalysis: AIAnalysis | null;
};

/** Fast dashboard load — Supabase only, no live market API calls. */
export async function getDashboardDataFast(): Promise<{
  cards: DashboardCardData[];
  settings: AppSettings;
  companies: Company[];
}> {
  const [companies, settings] = await Promise.all([
    db.getCompanies().catch(() => [] as Company[]),
    db.getSettings().catch(() => defaultAppSettings()),
  ]);

  const cards = await Promise.all(
    companies.map(async (company) => {
      const [analyses, snapshots] = await Promise.all([
        db.getAIAnalyses(company.id).catch(() => [] as AIAnalysis[]),
        db.getStockSnapshots(company.id).catch(() => []),
      ]);

      const latest = [...snapshots].sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )[0];

      return {
        company,
        price: latest?.price,
        changePercent: latest?.changePercent ?? 0,
        latestAnalysis: analyses[0] ?? null,
      };
    })
  );

  return { cards, settings, companies };
}
