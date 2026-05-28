"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Company } from "@/lib/types";

type AddToWatchlistButtonProps = Pick<
  Company,
  "name" | "ticker" | "exchange" | "sector" | "country" | "notes"
>;

export function AddToWatchlistButton({
  name,
  ticker,
  exchange,
  sector,
  country,
  notes,
}: AddToWatchlistButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ticker: ticker.toUpperCase(),
          exchange: exchange ?? "",
          sector: sector ?? "",
          country: country ?? "",
          notes: notes ?? "",
          status: "watching",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const alreadyExists = /already exists/i.test(data.error ?? "");
        if (alreadyExists) {
          router.refresh();
          return;
        }
        throw new Error(data.error ?? "Could not add to watchlist");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to watchlist");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20"
        disabled={loading}
        onClick={() => void handleAdd()}
      >
        {loading ? "Adding…" : "Add to Watchlist"}
      </Button>
      {error ? <p className="max-w-[14rem] text-right text-xs text-fuchsia-300">{error}</p> : null}
    </div>
  );
}
