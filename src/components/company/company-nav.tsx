"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = (ticker: string) => [
  { href: `/company/${ticker}`, label: "Overview" },
  { href: `/company/${ticker}/technical`, label: "Technical" },
  { href: `/company/${ticker}/financials`, label: "Financials" },
  { href: `/company/${ticker}/filings`, label: "SEC" },
  { href: `/company/${ticker}/news`, label: "News" },
  { href: `/company/${ticker}/research`, label: "Research" },
];

export function CompanyNav({ ticker }: { ticker: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-full border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-sm">
      {tabs(ticker).map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
              active
                ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.1)]"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
