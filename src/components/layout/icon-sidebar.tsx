"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Newspaper,
  Settings,
  TrendingUp,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/watchlist", label: "Watchlist", icon: List },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function IconSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: left icon rail */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-[72px] flex-col items-center border-r border-white/[0.08] bg-[#0a0a12]/80 py-6 backdrop-blur-xl lg:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 transition-all hover:border-violet-500/40 hover:shadow-[0_0_24px_rgba(34,211,238,0.15)]"
          aria-label="Home"
        >
          <TrendingUp className="h-5 w-5 text-cyan-400" />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                  active
                    ? "bg-gradient-to-br from-cyan-500/25 to-violet-500/25 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                )}
              >
                <item.icon className="h-5 w-5" />
                {active && (
                  <span className="absolute -right-px top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan-400 to-violet-400" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-slate-600">
          <LineChart className="h-4 w-4" />
        </div>
      </aside>

      {/* Mobile: bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] bg-[#0a0a12]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[10px] font-medium transition-colors",
                active ? "text-cyan-400" : "text-slate-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
