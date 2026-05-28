"use client";

import {
  LayoutDashboard,
  List,
  Settings,
  LineChart,
  Brain,
  BarChart3,
  Newspaper,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  watchlist: List,
  settings: Settings,
  chart: LineChart,
  brain: Brain,
  financials: BarChart3,
  news: Newspaper,
  trend: TrendingUp,
};

export type GlassHeaderIcon = keyof typeof ICONS;

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  icon?: GlassHeaderIcon;
  step?: { current: number; total: number };
  action?: React.ReactNode;
  className?: string;
}

export function GlassHeader({
  title,
  subtitle,
  icon,
  step,
  action,
  className,
}: GlassHeaderProps) {
  const Icon = icon ? ICONS[icon] : null;

  return (
    <div className={cn("glass-strong rounded-2xl p-6 md:p-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-violet-500/15">
              <Icon className="h-6 w-6 text-cyan-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
            {step && (
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: step.total }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i < step.current
                        ? "w-8 bg-gradient-to-r from-cyan-400 to-violet-400"
                        : "w-4 bg-white/10"
                    )}
                  />
                ))}
                <span className="ml-2 text-xs text-slate-500">
                  Step {step.current} of {step.total}
                </span>
              </div>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
