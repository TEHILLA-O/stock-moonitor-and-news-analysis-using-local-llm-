import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIAnalysis, Company } from "@/lib/types";
import { cn, decisionColor, formatCurrency, resolveListingCurrency } from "@/lib/utils";

interface CompanyCardProps {
  company: Company;
  price?: number;
  changePercent?: number;
  latestAnalysis?: AIAnalysis | null;
}

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info"> = {
  watching: "info",
  researched: "warning",
  bought: "success",
  rejected: "danger",
};

export function CompanyCard({
  company,
  price,
  changePercent = 0,
  latestAnalysis,
}: CompanyCardProps) {
  const positive = changePercent >= 0;
  const currency = resolveListingCurrency(company.exchange, company.country);

  return (
    <Link href={`/company/${company.ticker}`} className="group block">
      <Card className="transition-all duration-300 hover:border-cyan-500/25 hover:shadow-[0_0_32px_rgba(34,211,238,0.08)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gradient">{company.ticker}</span>
                <Badge variant={statusVariant[company.status] ?? "secondary"}>
                  {company.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">{company.name}</p>
              <p className="text-xs text-slate-600">
                {company.exchange} · {company.sector}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-600 transition-all group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-white/[0.06] pt-4">
            {price !== undefined ? (
              <div>
                <p className="text-xl font-semibold text-slate-100">
                  {formatCurrency(price, { currency })}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    positive ? "text-cyan-400" : "text-fuchsia-400"
                  )}
                >
                  {positive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No price data</p>
            )}

            {latestAnalysis && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  AI Score
                </p>
                <p className="text-2xl font-bold text-violet-300">
                  {latestAnalysis.overallScore}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold capitalize",
                    decisionColor(latestAnalysis.decision)
                  )}
                >
                  {latestAnalysis.decision}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
