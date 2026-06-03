"use client";

import { PrizePoint } from "@/lib/api";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const BRL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function fmt(v: number) {
  if (v >= 1_000_000_000) return `R$ ${BRL.format(v / 1_000_000_000)} bi`;
  if (v >= 1_000_000) return `R$ ${BRL.format(v / 1_000_000)} M`;
  return `R$ ${BRL.format(v / 1_000)} mil`;
}

interface ChartPoint {
  draw_date: string;
  drawing_number: number;
  sena_individual: number | null;
  sena_total: number | null;
  quina_total: number | null;
  quadra_total: number | null;
  winners_6: number;
  winners_5: number;
  winners_4: number;
}

interface Props {
  readonly points: PrizePoint[];
}

function PrizeTooltip({ active, payload, label }: {
  readonly active?: boolean;
  readonly label?: string;
  readonly payload?: ReadonlyArray<{ readonly name: string; readonly value: number | null; readonly color: string; readonly payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const series = payload.filter((s) => s.value != null && s.value > 0);
  if (!series.length) return null;

  return (
    <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow space-y-1">
      <p className="font-medium">{label} — concurso {p.drawing_number}</p>
      {p.sena_total != null && (
        <div>
          <p style={{ color: "#059669" }}>Sena total: {fmt(p.sena_total)}</p>
          <p style={{ color: "#34d399" }}>Sena individual: {fmt(p.sena_individual ?? 0)}</p>
          <p className="text-muted-foreground">{p.winners_6} ganhador{p.winners_6 !== 1 ? "es" : ""}</p>
        </div>
      )}
      {p.quina_total != null && (
        <div>
          <p style={{ color: "#3b82f6" }}>Quina total: {fmt(p.quina_total)}</p>
          <p className="text-muted-foreground">{p.winners_5.toLocaleString("pt-BR")} ganhadores</p>
        </div>
      )}
      {p.quadra_total != null && (
        <div>
          <p style={{ color: "#8b5cf6" }}>Quadra total: {fmt(p.quadra_total)}</p>
          <p className="text-muted-foreground">{p.winners_4.toLocaleString("pt-BR")} ganhadores</p>
        </div>
      )}
    </div>
  );
}

const DOT = (color: string, r = 3) => ({ r, fill: color, strokeWidth: 0 });
const ACTIVE_DOT = (color: string) => ({ r: 5, fill: color, strokeWidth: 0 });

export function PrizeChart({ points }: Props) {
  const data: ChartPoint[] = points.map((p) => ({
    draw_date: p.draw_date,
    drawing_number: p.drawing_number,
    sena_individual: p.winners_6 > 0 ? p.prize_6 : null,
    sena_total: p.winners_6 > 0 ? p.prize_6 * p.winners_6 : null,
    quina_total: p.prize_5 * p.winners_5 || null,
    quadra_total: p.prize_4 * p.winners_4 || null,
    winners_6: p.winners_6,
    winners_5: p.winners_5,
    winners_4: p.winners_4,
  }));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data} margin={{ top: 10, right: 72, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

        <XAxis
          dataKey="draw_date"
          tickFormatter={(v: string) => v.slice(0, 4)}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 8)}
        />

        <YAxis
          scale="log"
          domain={["auto", "auto"]}
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={80}
          allowDataOverflow
        />

        <Tooltip content={<PrizeTooltip />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />

        <Line name="Quadra total" dataKey="quadra_total" stroke="#8b5cf6" strokeWidth={0} dot={DOT("#8b5cf6", 2)} activeDot={ACTIVE_DOT("#8b5cf6")} isAnimationActive={false} connectNulls={false} />
        <Line name="Quina total"  dataKey="quina_total"  stroke="#3b82f6" strokeWidth={0} dot={DOT("#3b82f6", 2)} activeDot={ACTIVE_DOT("#3b82f6")} isAnimationActive={false} connectNulls={false} />
        <Line name="Sena total"      dataKey="sena_total"      stroke="#059669" strokeWidth={0} dot={DOT("#059669", 4)} activeDot={ACTIVE_DOT("#059669")} isAnimationActive={false} connectNulls={false} />
        <Line name="Sena individual" dataKey="sena_individual" stroke="#34d399" strokeWidth={0} dot={DOT("#34d399", 3)} activeDot={ACTIVE_DOT("#34d399")} isAnimationActive={false} connectNulls={false} />

        {[
          { value: 50_000_000, label: "50M" },
          { value: 100_000_000, label: "100M" },
          { value: 200_000_000, label: "200M" },
        ].map(({ value, label }) => (
          <ReferenceLine
            key={label}
            y={value}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 3"
            strokeOpacity={0.4}
            label={{ value: label, position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
