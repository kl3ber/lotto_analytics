"use client";

import { PairItem } from "@/lib/api";

interface Props {
  readonly top: PairItem[];
  readonly bottom: PairItem[];
}

function Ball({ n }: { readonly n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
      {n}
    </span>
  );
}

function PairRow({ pair, highlight, rank }: { readonly pair: PairItem; readonly highlight: boolean; readonly rank: number }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-2 font-mono text-xs text-muted-foreground/50 text-right w-5">{rank}</td>
      <td className="py-2">
        <div className="flex items-center gap-1">
          <Ball n={pair.n1} />
          <span className="text-xs text-muted-foreground">+</span>
          <Ball n={pair.n2} />
        </div>
      </td>
      <td className="py-2 font-mono text-sm">
        <span className={highlight ? "text-emerald-400" : "text-muted-foreground"}>
          {pair.count}×
        </span>
      </td>
      <td className="py-2 font-mono text-xs text-muted-foreground">{pair.percentage}%</td>
    </tr>
  );
}

export function CooccurrenceTable({ top, bottom }: Props) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">
          Pares mais frequentes
        </p>
        <table className="w-full">
          <tbody>
            {top.map((p, i) => (
              <PairRow key={`${p.n1}-${p.n2}`} pair={p} highlight rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Pares menos frequentes
        </p>
        <table className="w-full">
          <tbody>
            {bottom.map((p, i) => (
              <PairRow key={`${p.n1}-${p.n2}`} pair={p} highlight={false} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
