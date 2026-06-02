"use client";

import { useEffect, useState } from "react";
import { FrequencyGrid } from "@/components/frequency-grid";
import { FrequencyHistogram } from "@/components/frequency-histogram";
import { FrequencyDecades } from "@/components/frequency-decades";
import { FrequencyRanking } from "@/components/frequency-ranking";
import { DroughtTable } from "@/components/drought-table";
import { CooccurrenceTable } from "@/components/cooccurrence-table";
import {
  CooccurrenceResponse,
  FrequencyResponse,
  fetchCooccurrence,
  fetchFrequency,
} from "@/lib/api";

const WINDOW_OPTIONS = [50, 100, 200, 500];

function Toggle({ active, onToggle, label }: { readonly active: boolean; readonly onToggle: () => void; readonly label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${active ? "bg-emerald-700" : "bg-muted-foreground/30"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      {label}
    </label>
  );
}

function SectionTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export default function FrequenciaPage() {
  const [data, setData] = useState<FrequencyResponse | null>(null);
  const [cooc, setCooc] = useState<CooccurrenceResponse | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recentWindow, setRecentWindow] = useState(100);
  const [showRank, setShowRank] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchFrequency(dateFrom || undefined, dateTo || undefined, recentWindow),
      fetchCooccurrence(),
    ])
      .then(([freq, c]) => { setData(freq); setCooc(c); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, recentWindow]);

  const subtitle = data
    ? `${data.total_drawings.toLocaleString("pt-BR")} concursos — tendência baseada nos últimos ${data.recent_window} sorteios`
    : "";

  const legend = (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded" style={{ background: "oklch(0.25 0.05 220)" }} />
        <span>Menos frequente</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded" style={{ background: "oklch(0.60 0.23 162)" }} />
        <span>Mais frequente</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-3 w-3 items-center justify-center rounded-sm bg-emerald-500 text-[7px] font-bold text-white">▲</span>
        <span>Tendência alta</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-3 w-3 items-center justify-center rounded-sm bg-red-500 text-[7px] font-bold text-white">▼</span>
        <span>Tendência baixa</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Frequência dos números</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="sticky top-0 z-10 space-y-2 bg-background py-3 -mx-8 px-8 border-b border-border">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="date-from" className="text-xs text-muted-foreground">De</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-to" className="text-xs text-muted-foreground">Até</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="recent-window" className="text-xs text-muted-foreground">Janela de tendência</label>
            <select
              id="recent-window"
              value={recentWindow}
              onChange={(e) => setRecentWindow(Number(e.target.value))}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {WINDOW_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} sorteios</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-4 self-end">
            <Toggle active={showTrend} onToggle={() => setShowTrend((v) => !v)} label="Tendência" />
            <Toggle active={showRank} onToggle={() => setShowRank((v) => !v)} label="Ranking" />
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpar datas
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <>
          <section>
            <FrequencyGrid frequencies={data.frequencies} showRank={showRank} showTrend={showTrend} />
            {legend}
          </section>

          <section>
            <SectionTitle>Histograma</SectionTitle>
            <FrequencyHistogram frequencies={data.frequencies} />
          </section>

          <section>
            <SectionTitle>Frequência por dezena</SectionTitle>
            <FrequencyDecades frequencies={data.frequencies} />
          </section>

          <section>
            <SectionTitle>Ranking</SectionTitle>
            <FrequencyRanking frequencies={data.frequencies} />
          </section>

          <section>
            <SectionTitle>Maior seca atual</SectionTitle>
            <DroughtTable frequencies={data.frequencies} />
          </section>

          {cooc && (
            <section>
              <SectionTitle>Co-ocorrência de pares</SectionTitle>
              <CooccurrenceTable top={cooc.top} bottom={cooc.bottom} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
