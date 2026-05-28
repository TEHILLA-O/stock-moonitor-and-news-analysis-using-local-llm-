"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyDirectoryEntry } from "@/lib/data/company-directory";
import { CompanySearch } from "@/components/watchlist/company-search";
import type { Company, CompanyStatus } from "@/lib/types";

interface CompanyFormProps {
  initial?: Partial<Company>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CompanyForm({ initial, onSuccess, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTicker, setExistingTicker] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    ticker: initial?.ticker ?? "",
    exchange: initial?.exchange ?? "NASDAQ",
    sector: initial?.sector ?? "",
    country: initial?.country ?? "USA",
    notes: initial?.notes ?? "",
    status: (initial?.status ?? "watching") as CompanyStatus,
  });

  function applyDirectoryEntry(entry: CompanyDirectoryEntry) {
    setForm({
      name: entry.name,
      ticker: entry.ticker,
      exchange: entry.exchange,
      sector: entry.sector,
      country: entry.country,
      notes: form.notes,
      status: form.status,
    });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExistingTicker(null);
    const url = initial?.id ? `/api/companies/${initial.id}` : "/api/companies";
    const method = initial?.id ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      const match = message.match(/ticker\s+([A-Za-z0-9.-]+)\s+already exists/i);
      if (match) setExistingTicker(match[1].toUpperCase());
    } finally {      setLoading(false);
    }
  }

  const isNew = !initial?.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isNew && (
        <CompanySearch onSelect={applyDirectoryEntry} disabled={loading} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker *</Label>
          <Input
            id="ticker"
            required
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
            disabled={!!initial?.id}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exchange">Exchange</Label>
          <Input
            id="exchange"
            value={form.exchange}
            onChange={(e) => setForm({ ...form, exchange: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Input
            id="sector"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as CompanyStatus })
            }
          >
            <option value="watching">Watching</option>
            <option value="researched">Researched</option>
            <option value="bought">Bought</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      {error && (
        <div className="space-y-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 px-3 py-2">
          <p className="text-sm text-fuchsia-300">{error}</p>
          {existingTicker && (
            <Link
              href={`/company/${existingTicker}`}
              className="text-sm text-cyan-400 hover:underline"
            >
              Open {existingTicker} →
            </Link>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initial?.id ? "Update" : "Add Company"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
