"use client";

import { useEffect, useState } from "react";
import { PatternChart } from "@/components/pattern-chart";
import { AnalysisPageLayout, AnalysisSection } from "@/components/analysis-layout";
import { PatternsResponse, fetchPatterns } from "@/lib/api";

const SECTIONS = [
  { id: "soma", label: "Soma" },
  { id: "paridade", label: "Paridade" },
  { id: "baixo-alto", label: "Baixos vs Altos" },
  { id: "espacamento", label: "Espaçamento" },
  { id: "amplitude", label: "Amplitude" },
  { id: "consecutivos", label: "Consecutivos" },
  { id: "repeticoes", label: "Repetições" },
  { id: "primos", label: "Números primos" },
  { id: "fibonacci", label: "Fibonacci" },
  { id: "multiplos", label: "Múltiplos" },
  { id: "quartis", label: "Quartis" },
  { id: "paridade-soma", label: "Paridade da soma" },
];

const PRIMES_IN_RANGE = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];

function SectionTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export default function PadroesPage() {
  const [data, setData] = useState<PatternsResponse | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPatterns(dateFrom || undefined, dateTo || undefined)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  return (
    <AnalysisPageLayout sections={SECTIONS}>
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Padrões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total_drawings.toLocaleString("pt-BR")} concursos` : ""}
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-8 border-b border-border bg-background px-8 py-3">
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
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="self-end text-xs text-muted-foreground underline hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && (
        <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <>
          <AnalysisSection id="soma">
            <SectionTitle>Soma</SectionTitle>
            <div className="mb-6 grid grid-cols-4 gap-4">
              {[
                { label: "Média", value: data.sum_stat.mean },
                { label: "Mínimo", value: data.sum_stat.min },
                { label: "Máximo", value: data.sum_stat.max },
                { label: "Mais comum", value: data.sum_stat.most_common },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-bold">{s.value}</p>
                </div>
              ))}
            </div>
            <PatternChart
              variant="soma"
              data={data.sum}
              mean={data.sum_stat.mean}
              stdDev={data.sum_stat.std_dev}
              title="Distribuição da soma dos 6 números"
              description="Faixas de 10. Linhas vermelhas: média (μ) e desvios padrão (±1σ, ±2σ)."
            />
          </AnalysisSection>

          <AnalysisSection id="paridade">
            <SectionTitle>Paridade</SectionTitle>
            <PatternChart
              data={data.parity}
              title="Quantidade de números pares por sorteio"
              description="A linha vermelha marca a distribuição esperada em sorteios puramente aleatórios."
            />
          </AnalysisSection>

          <AnalysisSection id="baixo-alto">
            <SectionTitle>Baixos vs Altos</SectionTitle>
            <PatternChart
              data={data.low_high}
              title="Números baixos vs altos"
              description="Quantos dos 6 números são baixos (1–30) vs altos (31–60)."
            />
          </AnalysisSection>

          <AnalysisSection id="espacamento">
            <SectionTitle>Espaçamento</SectionTitle>
            <PatternChart
              data={data.spacing}
              title="Distância média entre números"
              description="Espaçamento médio entre os 6 números ordenados. Baixo = concentrado, alto = espalhado."
              color="#8b5cf6"
            />
          </AnalysisSection>

          <AnalysisSection id="amplitude">
            <SectionTitle>Amplitude</SectionTitle>
            <PatternChart
              data={data.amplitude}
              title="Amplitude do sorteio (máximo − mínimo)"
              description="Faixas de 5. Amplitude pequena = números concentrados; grande = espalhados pelo intervalo 1–60."
              color="#f97316"
            />
          </AnalysisSection>

          <AnalysisSection id="consecutivos">
            <SectionTitle>Consecutivos</SectionTitle>
            <PatternChart
              data={data.consecutives}
              title="Pares consecutivos por sorteio"
              description="Quantos pares de números consecutivos (ex: 14 e 15) aparecem no mesmo sorteio."
              color="#f59e0b"
            />
          </AnalysisSection>

          <AnalysisSection id="repeticoes">
            <SectionTitle>Repetições</SectionTitle>
            <PatternChart
              data={data.repeats}
              title="Repetições do sorteio anterior"
              description="Quantos números do sorteio atual também estavam no sorteio imediatamente anterior."
              color="#ec4899"
            />
          </AnalysisSection>

          <AnalysisSection id="primos">
            <SectionTitle>Números primos</SectionTitle>
            <p className="mb-4 text-xs text-muted-foreground">
              Primos no intervalo 1–60: {PRIMES_IN_RANGE.join(", ")} — {PRIMES_IN_RANGE.length} de 60 ({((PRIMES_IN_RANGE.length / 60) * 100).toFixed(1)}%)
            </p>
            <PatternChart
              data={data.primes}
              title="Quantidade de primos por sorteio"
              description="Dos 6 números sorteados, quantos são primos?"
              color="#06b6d4"
            />
          </AnalysisSection>

          <AnalysisSection id="fibonacci">
            <SectionTitle>Fibonacci</SectionTitle>
            <p className="mb-4 text-xs text-muted-foreground">
              Fibonacci no intervalo 1–60: 1, 2, 3, 5, 8, 13, 21, 34, 55 — 9 de 60 (15%)
            </p>
            <PatternChart
              data={data.fibonacci}
              title="Quantidade de números Fibonacci por sorteio"
              description="Dos 6 números sorteados, quantos pertencem à sequência de Fibonacci?"
              color="#10b981"
            />
          </AnalysisSection>

          <AnalysisSection id="multiplos">
            <SectionTitle>Múltiplos</SectionTitle>
            <div className="space-y-8">
              <PatternChart
                data={data.mult3}
                title="Múltiplos de 3 por sorteio"
                description="20 de 60 números são múltiplos de 3 (3, 6, 9, ..., 60)."
                color="#6366f1"
              />
              <PatternChart
                data={data.mult5}
                title="Múltiplos de 5 por sorteio"
                description="12 de 60 números são múltiplos de 5 (5, 10, 15, ..., 60)."
                color="#f43f5e"
              />
            </div>
          </AnalysisSection>

          <AnalysisSection id="quartis">
            <SectionTitle>Quartis</SectionTitle>
            <PatternChart
              variant="bars"
              labelWidth="w-24"
              data={data.quartiles}
              title="Distribuição por quartil (1–15, 16–30, 31–45, 46–60)"
              description="Percentual de todos os números sorteados que caíram em cada quartil. Esperado: 25% cada."
            />
          </AnalysisSection>

          <AnalysisSection id="paridade-soma">
            <SectionTitle>Paridade da soma</SectionTitle>
            <PatternChart
              variant="soma"
              data={data.sum_parity}
              mean={data.sum_parity_stat.mean}
              stdDev={data.sum_parity_stat.std_dev}
              labelFn={(v) => `${Math.floor(Math.max(0, Math.min(v, 99)) / 5) * 5}–${Math.floor(Math.max(0, Math.min(v, 99)) / 5) * 5 + 4}%`}
              title="% da soma total vinda de números pares"
              description="Linhas vermelhas: média (μ) e desvios padrão (±1σ, ±2σ). 50% = pares e ímpares contribuem igual para a soma."
              color="#0ea5e9"
            />
          </AnalysisSection>

        </>
      )}
    </div>
    </AnalysisPageLayout>
  );
}
