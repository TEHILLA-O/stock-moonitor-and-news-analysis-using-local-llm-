"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import {
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TechnicalRow } from "@/lib/technical/indicators";
import { cn } from "@/lib/utils";

type CandleShapeProps = {
  x?: number;
  width?: number;
  payload?: TechnicalRow;
  background?: {
    x?: number | null;
    y?: number | null;
    width?: number | null;
    height?: number | null;
  };
  yDomain: [number, number];
};

const RANGE_PRESETS = [
  { id: "1m", label: "1M", bars: 21 },
  { id: "3m", label: "3M", bars: 63 },
  { id: "6m", label: "6M", bars: 126 },
  { id: "1y", label: "1Y", bars: 252 },
  { id: "all", label: "All", bars: Infinity },
] as const;

const MIN_VISIBLE_BARS = 12;

function clampRange(
  startIndex: number,
  endIndex: number,
  total: number
): { startIndex: number; endIndex: number } {
  if (total <= 0) return { startIndex: 0, endIndex: 0 };
  let start = Math.max(0, Math.min(startIndex, total - 1));
  let end = Math.max(start, Math.min(endIndex, total - 1));
  if (end - start + 1 < MIN_VISIBLE_BARS) {
    end = Math.min(total - 1, start + MIN_VISIBLE_BARS - 1);
    start = Math.max(0, end - MIN_VISIBLE_BARS + 1);
  }
  return { startIndex: start, endIndex: end };
}

function rangeForBars(total: number, bars: number): { startIndex: number; endIndex: number } {
  if (total <= 0) return { startIndex: 0, endIndex: 0 };
  if (!Number.isFinite(bars) || bars >= total) {
    return { startIndex: 0, endIndex: total - 1 };
  }
  return clampRange(total - bars, total - 1, total);
}

/** Draw OHLC candle using the chart's price axis (not per-candle scale). */
function CandleShape({
  x = 0,
  width = 0,
  payload,
  background,
  yDomain,
}: CandleShapeProps) {
  const plotTop = background?.y ?? 0;
  const plotHeight = background?.height ?? 0;
  if (!payload || !background || width <= 0 || plotHeight <= 0) {
    return null;
  }

  const [yMin, yMax] = yDomain;
  const range = yMax - yMin || 1;

  const scaleY = (value: number) =>
    plotTop + plotHeight * (1 - (value - yMin) / range);

  const openY = scaleY(payload.open);
  const closeY = scaleY(payload.price);
  const highY = scaleY(payload.high);
  const lowY = scaleY(payload.low);
  const bodyTop = Math.min(openY, closeY);
  const bodyH = Math.max(Math.abs(closeY - openY), 1.5);
  const bullish = payload.price >= payload.open;
  const color = bullish ? "#22d3ee" : "#e879f9";
  const cx = x + width / 2;
  const bodyW = Math.max(Math.min(width * 0.7, 12), 2);

  return (
    <g>
      <line
        x1={cx}
        x2={cx}
        y1={highY}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={cx - bodyW / 2}
        y={bodyTop}
        width={bodyW}
        height={bodyH}
        fill={color}
        fillOpacity={0.92}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

export interface CandlestickChartProps {
  data: TechnicalRow[];
  /** Show range presets, zoom buttons, and drag brush. */
  enableZoom?: boolean;
  /** Bars visible when zoom is enabled (default 90 ≈ ~4 months). */
  initialVisibleBars?: number;
}

export function CandlestickChart({
  data,
  enableZoom = false,
  initialVisibleBars = 90,
}: CandlestickChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ts: new Date(d.date).getTime(),
      })),
    [data]
  );

  const [range, setRange] = useState(() =>
    enableZoom
      ? rangeForBars(chartData.length, initialVisibleBars)
      : { startIndex: 0, endIndex: Math.max(0, chartData.length - 1) }
  );

  const [activePreset, setActivePreset] = useState<string>("6m");

  useEffect(() => {
    if (!enableZoom) {
      setRange({ startIndex: 0, endIndex: Math.max(0, chartData.length - 1) });
      return;
    }
    setRange(rangeForBars(chartData.length, initialVisibleBars));
    setActivePreset("6m");
  }, [chartData.length, enableZoom, initialVisibleBars]);

  const visibleData = useMemo(
    () => chartData.slice(range.startIndex, range.endIndex + 1),
    [chartData, range]
  );

  const yMin = useMemo(() => {
    const source = enableZoom ? visibleData : chartData;
    if (source.length === 0) return 0;
    return Math.min(...source.map((d) => d.low)) * 0.995;
  }, [chartData, visibleData, enableZoom]);

  const yMax = useMemo(() => {
    const source = enableZoom ? visibleData : chartData;
    if (source.length === 0) return 100;
    return Math.max(...source.map((d) => d.high)) * 1.005;
  }, [chartData, visibleData, enableZoom]);

  const yDomain = useMemo((): [number, number] => [yMin, yMax], [yMin, yMax]);

  const plotData = enableZoom ? visibleData : chartData;

  const barSize = useMemo(
    () => Math.min(14, Math.max(3, Math.floor(480 / plotData.length))),
    [plotData.length]
  );

  const renderCandle = (props: unknown) => (
    <CandleShape {...(props as Omit<CandleShapeProps, "yDomain">)} yDomain={yDomain} />
  );

  const applyPreset = useCallback(
    (preset: (typeof RANGE_PRESETS)[number]) => {
      setActivePreset(preset.id);
      setRange(rangeForBars(chartData.length, preset.bars));
    },
    [chartData.length]
  );

  const zoomIn = useCallback(() => {
    setActivePreset("");
    setRange((prev) => {
      const len = prev.endIndex - prev.startIndex + 1;
      const nextLen = Math.max(MIN_VISIBLE_BARS, Math.floor(len * 0.7));
      return clampRange(prev.endIndex - nextLen + 1, prev.endIndex, chartData.length);
    });
  }, [chartData.length]);

  const zoomOut = useCallback(() => {
    setActivePreset("");
    setRange((prev) => {
      const len = prev.endIndex - prev.startIndex + 1;
      const nextLen = Math.min(chartData.length, Math.ceil(len / 0.7));
      return clampRange(prev.endIndex - nextLen + 1, prev.endIndex, chartData.length);
    });
  }, [chartData.length]);

  const onBrushChange = useCallback(
    (brush: { startIndex?: number; endIndex?: number }) => {
      if (brush.startIndex == null || brush.endIndex == null) return;
      setActivePreset("");
      setRange(
        clampRange(brush.startIndex, brush.endIndex, chartData.length)
      );
    },
    [chartData.length]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[380px] items-center justify-center text-sm text-slate-500">
        No OHLC data
      </div>
    );
  }

  const rangeLabel =
    visibleData.length > 0
      ? `${new Date(visibleData[0].date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} – ${new Date(visibleData[visibleData.length - 1].date).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        )}`
      : "";

  return (
    <div className="space-y-3">
      {enableZoom && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Range</span>
          {RANGE_PRESETS.filter(
            (p) => p.bars === Infinity || p.bars <= chartData.length
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                activePreset === preset.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              {preset.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={zoomIn}
              title="Zoom in"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-cyan-300"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              title="Zoom out"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-cyan-300"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={380} minWidth={0}>
        <ComposedChart
          data={plotData}
          margin={{ top: 8, right: 48, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(ts) =>
              new Date(ts).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            minTickGap={enableZoom ? 32 : 48}
          />
          <YAxis
            yAxisId="price"
            domain={yDomain}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            width={52}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fill: "#475569", fontSize: 10 }}
            tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}M`}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelFormatter={(ts) =>
              new Date(Number(ts)).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            }
            formatter={(value, name) => {
              const n = Number(value ?? 0);
              if (name === "volume") return [n.toLocaleString(), "Volume"];
              if (name === "price") return [n.toFixed(2), "Close"];
              if (typeof name === "string" && name.startsWith("sma")) {
                return [n.toFixed(2), name.toUpperCase()];
              }
              return [n.toFixed(2), String(name)];
            }}
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            maxBarSize={barSize}
            fill="rgba(34,211,238,0.12)"
            isAnimationActive={false}
          />
          <Bar
            yAxisId="price"
            dataKey="price"
            fill="transparent"
            stroke="transparent"
            shape={renderCandle}
            background={{ fill: "transparent" }}
            maxBarSize={barSize}
            isAnimationActive={false}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma20"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma50"
            stroke="#f59e0b"
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma200"
            stroke="#f472b6"
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {enableZoom && chartData.length > MIN_VISIBLE_BARS && (
        <>
          <ResponsiveContainer width="100%" height={52} minWidth={0}>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 48, left: 52, bottom: 4 }}
            >
              <XAxis dataKey="ts" type="number" scale="time" hide />
              <YAxis yAxisId="price" hide domain={["auto", "auto"]} />
              <Bar
                yAxisId="price"
                dataKey="price"
                fill="rgba(34,211,238,0.25)"
                isAnimationActive={false}
                maxBarSize={2}
              />
              <Brush
                dataKey="ts"
                height={28}
                stroke="#22d3ee"
                fill="rgba(34,211,238,0.12)"
                travellerWidth={10}
                startIndex={range.startIndex}
                endIndex={range.endIndex}
                onChange={onBrushChange}
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
          {rangeLabel ? (
            <p className="text-center text-xs text-slate-500">{rangeLabel}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
