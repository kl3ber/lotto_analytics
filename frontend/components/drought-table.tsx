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

export function DroughtTable({ frequencies }: Props) {
  const sorted = [...frequencies].sort((a, b) => b.current_drought - a.current_drought);
  const top = sorted.slice(0, 10);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pb-2 font-medium">Número</th>
          <th className="pb-2 font-medium">Seca atual</th>
          <th className="pb-2 font-medium">Recorde histórico</th>
          <th className="pb-2 font-medium">Último sorteio</th>
          <th className="pb-2 font-medium">Data</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {top.map((f) => (
          <tr key={f.number}>
            <td className="py-2"><Ball n={f.number} /></td>
            <td className="py-2">
              <span className={`font-mono ${f.current_drought >= f.max_drought * 0.8 ? "text-red-400" : ""}`}>
                {f.current_drought} concursos
              </span>
            </td>
            <td className="py-2 font-mono text-muted-foreground">{f.max_drought} concursos</td>
            <td className="py-2 font-mono text-muted-foreground">#{f.last_seen ?? "—"}</td>
            <td className="py-2 font-mono text-muted-foreground">{f.last_seen_date ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
