"use client";

import { FrequencyItem } from "@/lib/api";

interface Props {
  readonly frequencies: FrequencyItem[];
  readonly showRank?: boolean;
  readonly showTrend?: boolean;
}

export function FrequencyGrid({ frequencies, showRank = false, showTrend = true }: Props) {
  const counts = frequencies.map((f) => f.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  function intensity(count: number): number {
    if (max === min) return 0.5;
    return (count - min) / (max - min);
  }

  const sorted = [...frequencies].sort((a, b) => b.count - a.count);
  const rankByNumber = Object.fromEntries(sorted.map((f, i) => [f.number, i + 1]));
  const byNumber = Object.fromEntries(frequencies.map((f) => [f.number, f]));

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
        const f = byNumber[n];
        if (!f) return null;
        const t = intensity(f.count);
        const bg = `oklch(${0.25 + t * 0.35} ${0.05 + t * 0.18} ${t > 0.5 ? "162" : "220"})`;
        const delta = f.recent_percentage - f.global_percentage;
        const trending = Math.abs(delta) >= 1.5;
        const hot = delta > 0;

        let deltaClass = "text-muted-foreground";
        if (trending && hot) deltaClass = "text-emerald-400";
        else if (trending && !hot) deltaClass = "text-red-400";

        return (
          <div
            key={n}
            className="group relative flex aspect-square flex-col items-center justify-center rounded-lg text-white transition-transform hover:scale-110 cursor-default"
            style={{ background: bg }}
          >
            <span className="text-sm font-bold leading-tight">{n}</span>
            {showRank && (
              <span className="text-[9px] font-medium leading-tight text-red-500">
                #{rankByNumber[n]}
              </span>
            )}
            {showTrend && trending && (
              <span
                className={`absolute right-0.5 top-0.5 rounded-sm px-0.5 text-[8px] font-bold leading-none text-white ${hot ? "bg-emerald-500" : "bg-red-500"}`}
              >
                {hot ? "▲" : "▼"}
              </span>
            )}
            <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              <p className="font-medium">Número {n} — #{rankByNumber[n]}º mais frequente</p>
              <p>Total: {f.count}× ({f.percentage}%)</p>
              <p>Últimos 100 (global): {f.recent_count}× ({f.recent_percentage}%)</p>
              <p>Média histórica: {f.global_percentage}%</p>
              <p className={deltaClass}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}% tendência
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
