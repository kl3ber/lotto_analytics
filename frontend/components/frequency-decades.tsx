"use client";

import { FrequencyItem } from "@/lib/api";

interface Props {
  readonly frequencies: FrequencyItem[];
}

interface Group {
  label: string;
  numbers: number[];
}

const DECADES: Group[] = [
  { label: "1 – 10",  numbers: [1,2,3,4,5,6,7,8,9,10] },
  { label: "11 – 20", numbers: [11,12,13,14,15,16,17,18,19,20] },
  { label: "21 – 30", numbers: [21,22,23,24,25,26,27,28,29,30] },
  { label: "31 – 40", numbers: [31,32,33,34,35,36,37,38,39,40] },
  { label: "41 – 50", numbers: [41,42,43,44,45,46,47,48,49,50] },
  { label: "51 – 60", numbers: [51,52,53,54,55,56,57,58,59,60] },
];

const UNITS: Group[] = Array.from({ length: 10 }, (_, i) => {
  const digit = i === 9 ? 0 : i + 1;
  const numbers = digit === 0
    ? [10, 20, 30, 40, 50, 60]
    : [digit, digit + 10, digit + 20, digit + 30, digit + 40, digit + 50];
  return { label: `…${digit}`, numbers };
});

function GroupChart({
  groups,
  frequencies,
  expectedPct,
  title,
}: {
  readonly groups: Group[];
  readonly frequencies: FrequencyItem[];
  readonly expectedPct: number;
  readonly title: string;
}) {
  const countMap = Object.fromEntries(frequencies.map((f) => [f.number, f.count]));
  const totalPicks = frequencies.reduce((s, f) => s + f.count, 0);

  const rows = groups.map((g) => {
    const count = g.numbers.reduce((s, n) => s + (countMap[n] ?? 0), 0);
    const pct = totalPicks > 0 ? (count / totalPicks) * 100 : 0;
    const delta = pct - expectedPct;
    let barColor = "bg-muted-foreground/50";
    if (delta > 0.5) barColor = "bg-emerald-600";
    else if (delta < -0.5) barColor = "bg-blue-700";
    let deltaColor = "";
    if (delta > 0.5) deltaColor = "text-emerald-400";
    else if (delta < -0.5) deltaColor = "text-blue-400";
    return { label: g.label, count, pct, delta, barColor, deltaColor };
  });

  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <div className="flex-1">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="group flex items-center gap-2">
            <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {r.label}
            </span>
            <div className="w-16 shrink-0">
              <div className="h-2.5 overflow-hidden rounded bg-muted">
                <div
                  className={`h-full rounded transition-all ${r.barColor}`}
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="relative font-mono text-xs text-muted-foreground">
              {r.pct.toFixed(1)}%{" "}
              <span className={r.deltaColor}>
                ({r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}%)
              </span>
              <span className="absolute bottom-full left-0 mb-1 hidden whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block">
                {r.count.toLocaleString("pt-BR")} aparições
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground/60">
        esperado {expectedPct.toFixed(1)}% por grupo
      </p>
    </div>
  );
}

export function FrequencyDecades({ frequencies }: Props) {
  return (
    <div className="flex gap-8">
      <GroupChart
        groups={DECADES}
        frequencies={frequencies}
        expectedPct={(100 * 10) / 60}
        title="Por dezena (linha)"
      />
      <div className="w-px shrink-0 bg-border" />
      <GroupChart
        groups={UNITS}
        frequencies={frequencies}
        expectedPct={(100 * 6) / 60}
        title="Por unidade (coluna)"
      />
    </div>
  );
}
