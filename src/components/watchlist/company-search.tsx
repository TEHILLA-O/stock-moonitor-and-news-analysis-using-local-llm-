"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { CompanyDirectoryEntry } from "@/lib/data/company-directory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompanySearchProps {
  onSelect: (entry: CompanyDirectoryEntry) => void;
  disabled?: boolean;
}

export function CompanySearch({ onSelect, disabled }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyDirectoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/companies/search?q=${encodeURIComponent(q)}&limit=12`
      );
      const data = await res.json();
      const list = (data.results ?? []) as CompanyDirectoryEntry[];
      setResults(list);
      setOpen(list.length > 0);
      setHighlight(0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void search(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(entry: CompanyDirectoryEntry) {
    onSelect(entry);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor="company-search">Search company directory</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          id="company-search"
          type="search"
          autoComplete="off"
          disabled={disabled}
          placeholder="Search ticker or name (e.g. AAPL, Tesla, Dangote)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className="pl-9"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            …
          </span>
        )}

        {open && results.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-white/10 bg-slate-950 py-1 shadow-xl"
          >
            {results.map((entry, i) => (
              <li key={`${entry.ticker}-${entry.exchange}`} role="option">
                <button
                  type="button"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(entry)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors",
                    i === highlight
                      ? "bg-cyan-500/10 text-cyan-100"
                      : "text-slate-300 hover:bg-white/5"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-cyan-400">{entry.ticker}</span>
                    <span className="truncate text-sm">{entry.name}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {entry.exchange} · {entry.sector} · {entry.country}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Pick a company to auto-fill ticker, exchange, sector, and country.
      </p>
    </div>
  );
}
