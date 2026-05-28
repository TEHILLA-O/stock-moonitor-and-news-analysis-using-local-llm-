"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { MarketTapeItem, MarketTapeResponse } from "@/lib/types";

const SCROLL_PX_PER_SEC = 48;

function TapeItem({ item }: { item: MarketTapeItem }) {
  const up = item.changePercent > 0;
  const down = item.changePercent < 0;
  const flat = !up && !down;

  return (
    <Link
      href={`/company/${item.ticker}`}
      className="inline-flex shrink-0 items-center gap-2 px-4 text-xs transition-opacity hover:opacity-80"
    >
      <span className="font-semibold tracking-wide text-slate-200">
        {item.ticker}
      </span>
      <span className="text-slate-400">
        {formatCurrency(item.price, { currency: item.currency })}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          up && "text-emerald-400",
          down && "text-rose-400",
          flat && "text-slate-500"
        )}
      >
        <span aria-hidden>{up ? "▲" : down ? "▼" : "·"}</span>
        {formatPercent(item.changePercent)}
      </span>
    </Link>
  );
}

export function MarketTickerBar() {
  const [tape, setTape] = useState<MarketTapeResponse | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/market-tape", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as MarketTapeResponse;
        if (!cancelled) setTape(data);
      } catch {
        /* ignore */
      }
    }

    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !tape?.items.length) return;

    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2;
      if (offsetRef.current >= halfWidthRef.current) {
        offsetRef.current = 0;
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const speed = reducedMotion ? SCROLL_PX_PER_SEC * 0.35 : SCROLL_PX_PER_SEC;

    const step = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (halfWidthRef.current > 0) {
        offsetRef.current += speed * delta;
        if (offsetRef.current >= halfWidthRef.current) {
          offsetRef.current -= halfWidthRef.current;
        }
        track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      track.style.transform = "";
    };
  }, [tape]);

  if (!tape?.items.length) return null;

  const loop = [...tape.items, ...tape.items];

  return (
    <div className="relative z-40 flex h-8 shrink-0 items-stretch overflow-hidden border-b border-white/[0.06] bg-[#060610]/95">
      <div className="flex shrink-0 items-center border-r border-white/[0.06] bg-white/[0.03] px-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">
          {tape.label}
        </span>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex h-full w-max items-center will-change-transform"
        >
          {loop.map((item, i) => (
            <TapeItem key={`${item.ticker}-${i}`} item={item} />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#060610] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#060610] to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
