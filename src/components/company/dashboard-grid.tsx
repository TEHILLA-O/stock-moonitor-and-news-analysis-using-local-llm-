"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { DashboardCardData } from "@/lib/data/dashboard-data";
import type { Company } from "@/lib/types";
import { CompanyCard } from "@/components/company/company-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardGrid({
  initialCards,
  companies,
}: {
  initialCards: DashboardCardData[];
  companies: Company[];
}) {
  const [cards, setCards] = useState(initialCards);

  useEffect(() => {
    if (companies.length === 0) return;

    let cancelled = false;

    fetch("/api/dashboard/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { prices?: Array<{ companyId: string; price: number; changePercent: number }> } | null) => {
        if (cancelled || !data?.prices?.length) return;
        const byId = new Map(data.prices.map((p) => [p.companyId, p]));
        setCards((prev) =>
          prev.map((card) => {
            const live = byId.get(card.company.id);
            if (!live) return card;
            return {
              ...card,
              price: live.price,
              changePercent: live.changePercent,
            };
          })
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [companies]);

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-slate-400">No companies yet.</p>
          <Link href="/watchlist" className="mt-4 inline-block">
            <Button>Add your first company</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <CompanyCard
          key={c.company.id}
          company={c.company}
          price={c.price}
          changePercent={c.changePercent}
          latestAnalysis={c.latestAnalysis}
        />
      ))}
    </div>
  );
}
