"use client";

import { useEffect, useState } from "react";
import type { AppSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

interface SettingsClientProps {
  initialSettings: AppSettings;
  hasDeepSeek: boolean;
  hasDatabase: boolean;
  hasNewsApi: boolean;
  hasFinancialApi: boolean;
  hasNgxPulse: boolean;
}

export function SettingsClient({
  initialSettings,
  hasDeepSeek,
  hasDatabase,
  hasNewsApi,
  hasFinancialApi,
  hasNgxPulse,
}: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<{
    checks: Record<string, { ok: boolean; detail: string }>;
    recommendations: string[];
    storage: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) =>
        setHealth({
          checks: d.checks ?? {},
          recommendations: d.recommendations ?? [],
          storage: d.storage ?? "local",
        })
      )
      .catch(() => null);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultExchange: settings.defaultExchange,
          newsProvider: settings.newsProvider,
          newsRegion: settings.newsRegion,
          newsIngestionMode: settings.newsIngestionMode,
          financialProvider: settings.financialProvider,
          disclaimerAccepted: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusRow label="DeepSeek API" ok={hasDeepSeek} />
          <StatusRow
            label={health?.storage === "supabase" ? "Supabase DB" : "Database"}
            ok={health?.checks.database?.ok ?? hasDatabase}
          />
          <StatusRow
            label="Yahoo Finance"
            ok={health?.checks.yahoo?.ok ?? false}
          />
          <StatusRow label="News API (optional)" ok={hasNewsApi} />
          <StatusRow label="Alpha Vantage" ok={hasFinancialApi} />
          <StatusRow
            label="NGX Pulse (Nigeria)"
            ok={health?.checks.ngxPulse?.ok ?? hasNgxPulse}
          />
          {health?.checks.ngxPulse?.detail ? (
            <p className="text-xs text-slate-500">{health.checks.ngxPulse.detail}</p>
          ) : null}
          {health?.checks.database?.detail ? (
            <p className="text-xs text-slate-500">{health.checks.database.detail}</p>
          ) : null}
          {health?.checks.yahoo?.detail ? (
            <p className="text-xs text-slate-500">{health.checks.yahoo.detail}</p>
          ) : null}
          {health?.recommendations && health.recommendations.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-amber-400/90">
              {health.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {!hasDeepSeek && (
            <p className="text-xs text-amber-400/90">
              Add DEEPSEEK_API_KEY to .env.local for real AI analysis. Mock analysis is used otherwise.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Default Exchange</Label>
              <Select
                value={settings.defaultExchange}
                onChange={(e) =>
                  setSettings({ ...settings, defaultExchange: e.target.value })
                }
              >
                <option value="NASDAQ">NASDAQ</option>
                <option value="NYSE">NYSE</option>
                <option value="LSE">LSE</option>
                <option value="TSE">TSE</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>News Provider</Label>
              <Select
                value={settings.newsProvider}
                onChange={(e) =>
                  setSettings({ ...settings, newsProvider: e.target.value })
                }
              >
                <option value="free">Free (Hear + RSS)</option>
                <option value="newsapi">NewsAPI (optional key)</option>
                <option value="finnhub">Finnhub</option>
                <option value="fmp">Financial Modeling Prep</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>News Ingestion Mode</Label>
              <Select
                value={settings.newsIngestionMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    newsIngestionMode: e.target.value as AppSettings["newsIngestionMode"],
                  })
                }
              >
                <option value="auto">Auto (API then scrape)</option>
                <option value="api">API only</option>
                <option value="scrape">Scrape free sources only</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>News Region</Label>
              <Select
                value={settings.newsRegion}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    newsRegion: e.target.value as AppSettings["newsRegion"],
                  })
                }
              >
                <option value="usa">USA</option>
                <option value="uk">UK</option>
                <option value="china">China</option>
                <option value="nigeria">Nigeria</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Financial Data Provider</Label>
              <Select
                value={settings.financialProvider}
                onChange={(e) =>
                  setSettings({ ...settings, financialProvider: e.target.value })
                }
              >
                <option value="auto">Auto (Yahoo + AV + Finnhub)</option>
                <option value="yahoo">Yahoo Finance</option>
                <option value="alphavantage">Alpha Vantage</option>
                <option value="finnhub">Finnhub</option>
              </Select>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-slate-400">
{`DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
NEXT_PUBLIC_APP_NAME=Private Market Research Assistant
DATABASE_URL=postgresql://...
DATABASE_URL=postgresql://...supabase...
FINANCIAL_API_KEY=optional_alphavantage
FINNHUB_API_KEY=optional_finnhub
NEWS_API_KEY=optional`}
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            Database: set <code className="text-slate-400">DATABASE_URL</code> to your Supabase
            pooler URI (see <code className="text-slate-400">docs/SUPABASE.md</code>). Without it,
            data stays in <code className="text-slate-400">.data/store.json</code> locally only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        {ok ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-500">Not configured</span>
          </>
        )}
      </div>
    </div>
  );
}
