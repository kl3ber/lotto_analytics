"use client";

import { FrequencyItem } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  readonly frequencies: FrequencyItem[];
}

interface BarData {
  number: number;
  above: number | null;
  below: number | null;
}

function HistogramTooltip({ active, payload }: { readonly active?: boolean; readonly payload?: ReadonlyArray<{ readonly payload: BarData; readonly value: number }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const count = d.above ?? d.below ?? 0;
  return (
    <div className="rounded border border-border bg-background px-2 py-1.5 text-xs shadow">
      <p className="font-medium">Número {d.number}</p>
      <p className="text-muted-foreground">{count} aparições</p>
    </div>
  );
}

export function FrequencyHistogram({ frequencies }: Props) {
  const avg = Math.round(frequencies.reduce((s, f) => s + f.count, 0) / frequencies.length);

  const data: BarData[] = frequencies.map((f) => ({
    number: f.number,
    above: f.count > avg ? f.count : null,
    below: f.count <= avg ? f.count : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 72, left: 0, bottom: 0 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="number"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval={9}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<HistogramTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <ReferenceLine
          y={avg}
          stroke="#ef4444"
          strokeDasharray="4 2"
          strokeWidth={1.5}
          label={{ value: `média ${avg}`, fontSize: 10, fill: "#ef4444", position: "right" }}
        />
        <Bar dataKey="above" stackId="a" fill="#059669" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="below" stackId="a" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
