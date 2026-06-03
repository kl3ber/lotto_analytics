"use client";

import { BucketItem } from "@/lib/api";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BaseProps {
  readonly data: BucketItem[];
  readonly title: string;
  readonly description?: string;
  readonly color?: string;
  readonly hideReferenceLine?: boolean;
}

interface DefaultProps extends BaseProps {
  readonly variant?: "default";
}

interface SomaProps extends BaseProps {
  readonly variant: "soma";
  readonly mean: number;
  readonly stdDev: number;
  readonly labelFn?: (value: number) => string;
}

interface BarsProps extends BaseProps {
  readonly variant: "bars";
  readonly labelWidth?: string;
}

type Props = DefaultProps | SomaProps | BarsProps;

function PatternTooltip({
  active,
  payload,
}: {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{ readonly payload: BucketItem }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow">
      <p className="font-medium">{d.label}</p>
      <p className="text-muted-foreground">{d.count} sorteios ({d.percentage}%)</p>
    </div>
  );
}

function bucketLabel(sumValue: number): string {
  const i = Math.floor((sumValue - 21) / 10);
  return `${21 + i * 10}–${30 + i * 10}`;
}

const STD_DEV_LINES = [
  { sigma: 0, label: "μ", strokeWidth: 2, strokeDasharray: undefined, opacity: 1 },
  { sigma: 1, label: "+1σ", strokeWidth: 1.5, strokeDasharray: "5 3", opacity: 0.9 },
  { sigma: -1, label: "−1σ", strokeWidth: 1.5, strokeDasharray: "5 3", opacity: 0.9 },
  { sigma: 2, label: "+2σ", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 },
  { sigma: -2, label: "−2σ", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 },
];

function deltaBarColor(delta: number): string {
  if (delta > 0.3) return "bg-emerald-600";
  if (delta < -0.3) return "bg-blue-700";
  return "bg-muted-foreground/50";
}

function deltaTxtColor(delta: number): string {
  if (delta > 0.3) return "text-emerald-400";
  if (delta < -0.3) return "text-blue-400";
  return "text-muted-foreground";
}

function HorizontalBars({ data, title, description, labelWidth = "w-6" }: Omit<BaseProps, "color"> & { labelWidth?: string }) {
  if (!data?.length) return null;
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title}</p>
      {description && <p className="mb-3 text-xs text-muted-foreground">{description}</p>}
      <div className="space-y-2">
        {data.map((d) => {
          const delta = d.percentage - d.expected_percentage;
          const barColor = deltaBarColor(delta);
          const deltaColor = deltaTxtColor(delta);
          return (
            <div key={d.label} className="group flex items-center gap-2">
              <span className={`${labelWidth} shrink-0 text-right font-mono text-xs text-muted-foreground`}>
                {d.label}
              </span>
              <div className="w-32 shrink-0">
                <div className="h-2.5 overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full rounded transition-all ${barColor}`}
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className="relative font-mono text-xs text-muted-foreground">
                {d.percentage.toFixed(2)}%{" "}
                <span className={deltaColor}>
                  ({delta > 0 ? "+" : ""}{delta.toFixed(2)}%)
                </span>
                <span className="absolute bottom-full left-0 mb-1 hidden whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block">
                  {d.count.toLocaleString("pt-BR")} aparições
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground/60">
        esperado {data[0]?.expected_percentage.toFixed(1)}% por dígito
      </p>
    </div>
  );
}

export function PatternChart(props: Props) {
  if (props.variant === "bars") {
    const { labelWidth, ...rest } = props;
    return <HorizontalBars {...rest} labelWidth={labelWidth} />;
  }

  const { data, title, description, color = "#059669", hideReferenceLine = false } = props;
  if (!data?.length) return null;

  const isSoma = props.variant === "soma";
  const getLabelFor = isSoma ? (props.labelFn ?? bucketLabel) : bucketLabel;

  const avgExpected = isSoma
    ? null
    : data.reduce((s, d) => s + d.expected_percentage, 0) / data.length;

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title}</p>
      {description && <p className="mb-3 text-xs text-muted-foreground">{description}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 16, right: 48, left: 0, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<PatternTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="percentage" radius={[2, 2, 0, 0]} fill={color} isAnimationActive={false} />

          {isSoma &&
            STD_DEV_LINES.map(({ sigma, label, strokeWidth, strokeDasharray, opacity }) => (
              <ReferenceLine
                key={sigma}
                x={getLabelFor(props.mean + sigma * props.stdDev)}
                stroke="#ef4444"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeOpacity={opacity}
                label={{ value: label, position: "top", fontSize: 9, fill: "#ef4444" }}
              />
            ))}

          {!isSoma && !hideReferenceLine && avgExpected !== null && (
            <ReferenceLine
              y={avgExpected}
              stroke="#ef4444"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: `${avgExpected.toFixed(1)}%`, position: "right", fontSize: 9, fill: "#ef4444" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
