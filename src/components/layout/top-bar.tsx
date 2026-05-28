"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, History, ChevronRight, Home } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HistoryDrawer } from "./history-drawer";
import { cn } from "@/lib/utils";

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [
    { label: "Home", href: "/dashboard" },
  ];

  if (segments[0] === "watchlist") {
    crumbs.push({ label: "Watchlist", href: "/watchlist" });
  } else if (segments[0] === "news") {
    crumbs.push({ label: "News", href: "/news" });
  } else if (segments[0] === "settings") {
    crumbs.push({ label: "Settings", href: "/settings" });
  } else if (segments[0] === "company" && segments[1]) {
    crumbs.push({ label: "Companies", href: "/watchlist" });
    crumbs.push({ label: segments[1].toUpperCase(), href: `/company/${segments[1]}` });
    if (segments[2]) {
      const labels: Record<string, string> = {
        technical: "Technical",
        financials: "Financials",
        news: "News",
        research: "Research",
      };
      crumbs.push({
        label: labels[segments[2]] ?? segments[2],
        href: pathname,
      });
    }
  } else if (segments[0] === "dashboard") {
    crumbs[0] = { label: "Dashboard", href: "/dashboard" };
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm sm:flex">
      <Link
        href="/dashboard"
        className="text-slate-500 transition-colors hover:text-cyan-400"
      >
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <Link
            href={crumb.href}
            className={cn(
              "font-medium transition-colors hover:text-cyan-400",
              i === crumbs.length - 2 ? "text-slate-200" : "text-slate-500"
            )}
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker) router.push(`/company/${ticker}`);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a12]/70 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-4 px-4 lg:pl-[88px] lg:pr-6">
          <Breadcrumbs />
          <form onSubmit={handleSearch} className="relative ml-auto max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search ticker…"
              className="h-9 rounded-full pl-9 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => setHistoryOpen(true)}
            aria-label="Analysis history"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <HistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
