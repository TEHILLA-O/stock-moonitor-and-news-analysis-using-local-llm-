"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";import type { Company } from "@/lib/types";
import { CompanyForm } from "@/components/watchlist/company-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassHeader } from "@/components/layout/glass-header";

export function WatchlistClient({
  initialCompanies,
}: {
  initialCompanies: Company[];
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  async function refresh() {
    const res = await fetch("/api/companies", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Company[];
    setCompanies(data);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this company and all related data?")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    await refresh();
  }
  return (
    <div className="space-y-8">
      <GlassHeader
        title="Watchlist"
        subtitle="Manage companies you are researching"
        icon="watchlist"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(!showForm);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        }
      />

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Company" : "Add Company"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              initial={editing ?? undefined}
              onSuccess={refresh}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {companies.length} {companies.length === 1 ? "company" : "companies"}
        </p>
      </div>

      <div className="space-y-3">
        {companies.length === 0 && !showForm && !editing ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">No companies on your watchlist yet.</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add your first company
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {companies.map((company) => (          <Card key={company.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <Link
                  href={`/company/${company.ticker}`}
                  className="text-lg font-bold text-cyan-400 hover:underline"
                >
                  {company.ticker}
                </Link>
                <div>
                  <p className="font-medium text-slate-200">{company.name}</p>
                  <p className="text-xs text-slate-500">
                    {company.exchange} · {company.sector} · {company.country}
                  </p>
                </div>
                <Badge variant="secondary">{company.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(company);
                    setShowForm(false);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(company.id)}
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
