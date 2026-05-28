import { db } from "@/lib/db";
import { isDeepSeekConfigured } from "@/lib/services/deepseekService";
import { SettingsClient } from "./settings-client";
import { GlassHeader } from "@/components/layout/glass-header";

export default async function SettingsPage() {
  const settings = await db.getSettings();
  const hasDeepSeek = isDeepSeekConfigured();
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  return (
    <div className="space-y-8">
      <GlassHeader
        title="Settings"
        subtitle="Configure providers and preferences"
        icon="settings"
      />

      <SettingsClient
        initialSettings={settings}
        hasDeepSeek={hasDeepSeek}
        hasDatabase={hasDatabase}
        hasNewsApi={Boolean(process.env.NEWS_API_KEY)}
        hasFinancialApi={Boolean(process.env.FINANCIAL_API_KEY)}
        hasNgxPulse={Boolean(process.env.NGX_PULSE_API_KEY?.trim())}
      />
    </div>
  );
}
