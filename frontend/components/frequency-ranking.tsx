"use client";

import { FrequencyItem } from "@/lib/api";

interface Props {
  readonly frequencies: FrequencyItem[];
}

function Ball({ n }: { readonly n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
      {n}
    </span>
  );
}

export function FrequencyRanking({ frequencies }: Props) {
  const sorted = [...frequencies].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 10);
  const bottom = sorted.slice(-10).reverse();

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">
          10 mais frequentes
        </p>
        <div className="space-y-1.5">
          {top.map((f, i) => (
            <div key={f.number} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">{i + 1}</span>
              <Ball n={f.number} />
              <div className="w-36 shrink-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${f.percentage}%` }} />
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{f.count}× ({f.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          10 menos frequentes
        </p>
        <div className="space-y-1.5">
          {bottom.map((f, i) => (
            <div key={f.number} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">{i + 1}</span>
              <Ball n={f.number} />
              <div className="w-36 shrink-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${f.percentage}%` }} />
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{f.count}× ({f.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
