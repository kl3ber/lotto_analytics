"use client";

import { useEffect, useState } from "react";
import { PrizesResponse, fetchPrizes } from "@/lib/api";
import { PrizeChart } from "@/components/prize-chart";
import { AnalysisPageLayout, AnalysisSection } from "@/components/analysis-layout";
import { PatternChart } from "@/components/pattern-chart";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const SECTIONS = [
  { id: "historico", label: "Histórico" },
  { id: "acumulos", label: "Acúmulos" },
  { id: "marcos", label: "Marcos" },
];

function SectionTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export default function PremiosPage() {
  const [data, setData] = useState<PrizesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrizes()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnalysisPageLayout sections={SECTIONS}>
      <div className="max-w-3xl space-y-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Prêmios & Acúmulos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.points.length.toLocaleString("pt-BR")} concursos` : ""}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading && (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            Carregando...
          </div>
        )}

        {!loading && data && (
          <>
            <AnalysisSection id="historico">
              <SectionTitle>Histórico do jackpot</SectionTitle>
              <p className="mb-4 text-xs text-muted-foreground">
                Escala logarítmica — permite ver quadra, quina e sena juntos. Pontos verdes marcam sorteios com ganhador na sena.
              </p>
              <PrizeChart points={data.points} />
            </AnalysisSection>

            <AnalysisSection id="acumulos">
              <SectionTitle>Ciclos de acúmulo</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Um <span className="font-medium text-foreground">ciclo</span> é a sequência de sorteios entre um ganhador e o próximo.
                Começa logo após alguém ganhar o jackpot (prêmio reseta) e termina quando alguém acerta os 6 números novamente.
                Duração 1 significa que alguém ganhou logo no primeiro sorteio após o reset — sem acúmulo.
                Duração 5 significa que houve 4 sorteios acumulando e no 5º alguém ganhou.
              </p>
              <div className="mb-6 grid grid-cols-4 gap-4">
                {[
                  { label: "Total de ciclos", value: data.accumulation.total_cycles.toLocaleString("pt-BR") },
                  { label: "Duração média", value: `${data.accumulation.avg_length} sorteios` },
                  { label: "Menor ciclo", value: `${data.accumulation.min_length} sorteio${data.accumulation.min_length === 1 ? "" : "s"}` },
                  { label: "Maior ciclo", value: `${data.accumulation.max_length} sorteios` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Maior acúmulo da história: </span>
                {data.accumulation.longest.length} sorteios consecutivos sem ganhador —
                encerrado no concurso {data.accumulation.longest.end_drawing} em {data.accumulation.longest.end_date},
                com prêmio de {BRL.format(data.accumulation.longest.final_prize)}
              </div>
              <PatternChart
                data={data.accumulation.distribution}
                title="Quantos ciclos duraram N sorteios?"
                description="Cada barra mostra quantos ciclos terminaram com aquela duração. Ciclos curtos são muito mais comuns — a maioria dos jackpots é vencido antes de acumular muito."
                color="#f59e0b"
                hideReferenceLine
              />
            </AnalysisSection>

            <AnalysisSection id="marcos">
              <SectionTitle>Marcos do jackpot</SectionTitle>
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Recorde individual</p>
                  <p className="text-xl font-bold">{BRL.format(data.record_individual)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">valor recebido por cada ganhador da sena</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Recorde total da sena</p>
                  <p className="text-xl font-bold">{BRL.format(data.record_sena_total)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">soma dos prêmios de todos os ganhadores da sena</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Recorde total distribuído</p>
                  <p className="text-xl font-bold">{BRL.format(data.record_distributed)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">sena + quina + quadra no mesmo sorteio</p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Marco</th>
                    <th className="pb-2 text-right font-medium">Individual</th>
                    <th className="pb-2 text-right font-medium">Total sena</th>
                    <th className="pb-2 text-right font-medium">Total distribuído</th>
                  </tr>
                </thead>
                <tbody>
                  {data.milestones.map((m) => (
                    <tr key={m.threshold_m} className="border-b border-border/50">
                      <td className="py-2 font-medium">R$ {m.threshold_m}M</td>
                      <td className="py-2 text-right">{m.count_individual}×</td>
                      <td className="py-2 text-right">{m.count_sena_total}×</td>
                      <td className="py-2 text-right">{m.count_distributed}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AnalysisSection>
          </>
        )}
      </div>
    </AnalysisPageLayout>
  );
}
