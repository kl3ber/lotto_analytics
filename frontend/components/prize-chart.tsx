"use client";

import { PrizePoint } from "@/lib/api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRL_SHORT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function fmt(v: number) {
  if (v >= 1_000_000) return `R$ ${BRL_SHORT.format(v / 1_000_000)} M`;
  if (v >= 1_000) return `R$ ${BRL_SHORT.format(v / 1_000)} mil`;
  return `R$ ${BRL_SHORT.format(v)}`;
}

interface Props {
  points: PrizePoint[];
}

export function PrizeChart({ points }: Props) {
  const winners = points.filter((p) => p.winners_6 > 0 && p.prize_6 > 0);

  return (
    <ResponsiveContainer width="100%" height={380}>
      <AreaChart data={points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="prizeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

        <XAxis
          dataKey="draw_date"
          tickFormatter={(v: string) => v.slice(0, 4)}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(points.length / 8)}
        />

        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={80}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as PrizePoint;
            return (
              <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow">
                <p className="font-medium">{p.draw_date}</p>
                <p className="text-emerald-400">{fmt(p.prize_6)}</p>
                {p.winners_6 > 0 && (
                  <p className="text-muted-foreground">{p.winners_6} ganhador{p.winners_6 > 1 ? "es" : ""}</p>
                )}
              </div>
            );
          }}
        />

        <Area
          type="monotone"
          dataKey="prize_6"
          stroke="#059669"
          strokeWidth={1.5}
          fill="url(#prizeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#059669" }}
        />

        {winners.slice(-50).map((p) => (
          <ReferenceDot
            key={p.drawing_number}
            x={p.draw_date}
            y={p.prize_6}
            r={3}
            fill="#ef4444"
            stroke="none"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
