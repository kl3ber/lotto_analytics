"use client";

import { useEffect, useState } from "react";
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
import { AcfPoint, AndersonDarlingResponse, AutocorrelationResponse, BootstrapItem, BootstrapResponse, GapBucket, GapTestResponse, HurstResponse, LjungBoxResponse, MarkovChainResponse, MarkovTransitionItem, NumberDeviation, PairBiasItem, PairBiasResponse, RunsTestResponse, SpectralPoint, SpectralResponse, StatisticsResponse, fetchAndersonDarling, fetchAutocorrelation, fetchBootstrap, fetchGapDistribution, fetchHurst, fetchLjungBox, fetchMarkovChain, fetchPairBias, fetchRunsTest, fetchSpectral, fetchStatistics } from "@/lib/api";
import { DateFilter } from "@/components/date-filter";
import { AnalysisPageLayout, AnalysisSection } from "@/components/analysis-layout";

// Group 1 — Uniformidade
// Group 2 — Dependência temporal
// Group 3 — Estrutura e padrões
// Group 4 — Espectral
const SECTIONS = [
  { id: "qui-quadrado",     label: "Chi-quadrado" },
  { id: "ks",              label: "Kolmogorov-Smirnov" },
  { id: "anderson-darling", label: "Anderson-Darling" },
  { id: "desvios",         label: "Desvios por número" },
  { id: "bootstrap",       label: "Bootstrap IC 95%" },
  { id: "autocorrelacao",  label: "Autocorrelação" },
  { id: "ljung-box",       label: "Ljung-Box" },
  { id: "hurst",           label: "Hurst Exponent" },
  { id: "runs",            label: "Runs Test" },
  { id: "intervalos",      label: "Intervalos" },
  { id: "viés-pares",      label: "Viés de pares" },
  { id: "markov",          label: "Cadeia de Markov" },
  { id: "espectral",       label: "Análise Espectral" },
];

function SectionTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

function verdict(significant: boolean) {
  return significant
    ? { label: "Desvio significativo", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }
    : { label: "Compatível com aleatoriedade", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
}

function TestCard({
  title,
  description,
  statistic,
  pValue,
  df,
  significant,
}: {
  readonly title: string;
  readonly description: string;
  readonly statistic: number;
  readonly pValue: number;
  readonly df: number | null;
  readonly significant: boolean;
}) {
  const v = verdict(significant);
  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Estatística</p>
          <p className="mt-1 text-lg font-bold font-mono">{statistic.toFixed(3)}</p>
        </div>
        <div className="rounded border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">p-value</p>
          <p className="mt-1 text-lg font-bold font-mono">{pValue.toFixed(4)}</p>
        </div>
        {df !== null && (
          <div className="rounded border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Graus de liberdade</p>
            <p className="mt-1 text-lg font-bold font-mono">{df}</p>
          </div>
        )}
      </div>
      <div className={`rounded border px-3 py-2 text-xs font-medium ${v.bg} ${v.color}`}>
        {v.label} {significant ? "(p < 0,05)" : "(p ≥ 0,05)"}
      </div>
    </div>
  );
}

function DesviosTooltip({
  active,
  payload,
}: {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{ readonly payload: NumberDeviation }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow space-y-1">
      <p className="font-medium">Número {d.number}</p>
      <p className="text-muted-foreground">Observado: {d.observed}</p>
      <p className="text-muted-foreground">Esperado: {d.expected.toFixed(1)}</p>
      <p className={Math.abs(d.z_score) > 2 ? "text-red-400 font-medium" : "text-muted-foreground"}>
        z-score: {d.z_score > 0 ? "+" : ""}{d.z_score.toFixed(3)}
      </p>
    </div>
  );
}

function barFill(z: number) {
  if (z > 2 || z < -2) return "#ef4444";
  if (z > 0) return "#059669";
  return "#3b82f6";
}

function AcfTooltip({ active, payload }: {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{ readonly payload: AcfPoint & { ci_bound: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const significant = Math.abs(d.autocorrelation) > d.ci_bound;
  return (
    <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow space-y-1">
      <p className="font-medium">Lag {d.lag}</p>
      <p className="text-muted-foreground">Autocorrelação: {d.autocorrelation > 0 ? "+" : ""}{d.autocorrelation.toFixed(4)}</p>
      <p className={significant ? "text-red-400 font-medium" : "text-emerald-400"}>
        {significant ? "Significativa (além do IC 95%)" : "Dentro do IC 95%"}
      </p>
    </div>
  );
}

function AcfBar(props: { readonly x?: number; readonly y?: number; readonly width?: number; readonly height?: number; readonly payload?: AcfPoint & { ci_bound: number } }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const significant = Math.abs(payload.autocorrelation) > payload.ci_bound;
  const color = significant ? "#ef4444" : "#3b82f6";
  const isNeg = payload.autocorrelation < 0;
  return <rect x={x} y={isNeg ? y + height : y} width={width} height={Math.abs(height)} fill={color} rx={2} />;
}

function BootstrapTooltip({ active, payload }: {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{ readonly payload: BootstrapItem }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-border bg-background px-3 py-2 text-xs shadow space-y-1">
      <p className="font-medium">Número {d.number}</p>
      <p className="text-muted-foreground">Observado: {d.observed_pct.toFixed(3)}%</p>
      <p className="text-muted-foreground">IC 95%: [{d.ci_low.toFixed(3)}%, {d.ci_high.toFixed(3)}%]</p>
      <p className={d.expected_within_ci ? "text-emerald-400" : "text-red-400"}>
        10% esperado {d.expected_within_ci ? "dentro" : "fora"} do IC
      </p>
    </div>
  );
}

function BootstrapBar(props: { readonly x?: number; readonly y?: number; readonly width?: number; readonly height?: number; readonly payload?: BootstrapItem }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const color = payload.expected_within_ci ? "#059669" : "#ef4444";
  return <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={color} rx={2} />;
}

function ZBar(props: { readonly x?: number; readonly y?: number; readonly width?: number; readonly height?: number; readonly payload?: NumberDeviation }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const color = barFill(payload.z_score);
  const isNeg = payload.z_score < 0;
  return <rect x={x} y={isNeg ? y + height : y} width={width} height={Math.abs(height)} fill={color} rx={2} />;
}

export default function EstatisticasPage() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [acf, setAcf] = useState<AutocorrelationResponse | null>(null);
  const [hurst, setHurst] = useState<HurstResponse | null>(null);
  const [ad, setAd] = useState<AndersonDarlingResponse | null>(null);
  const [ljung, setLjung] = useState<LjungBoxResponse | null>(null);
  const [markov, setMarkov] = useState<MarkovChainResponse | null>(null);
  const [spectral, setSpectral] = useState<SpectralResponse | null>(null);
  const [runs, setRuns] = useState<RunsTestResponse | null>(null);
  const [gaps, setGaps] = useState<GapTestResponse | null>(null);
  const [pairs, setPairs] = useState<PairBiasResponse | null>(null);
  const [hurstLoading, setHurstLoading] = useState(true);
  const [adLoading, setAdLoading] = useState(true);
  const [ljungLoading, setLjungLoading] = useState(true);
  const [markovLoading, setMarkovLoading] = useState(true);
  const [spectralLoading, setSpectralLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(true);
  const [gapsLoading, setGapsLoading] = useState(true);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [bsLoading, setBsLoading] = useState(true);
  const [acfLoading, setAcfLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setBsLoading(true);
    setAcfLoading(true);
    setHurstLoading(true);
    setAdLoading(true);
    setLjungLoading(true);
    setMarkovLoading(true);
    setSpectralLoading(true);
    setRunsLoading(true);
    setGapsLoading(true);
    setPairsLoading(true);
    setError(null);
    const df = dateFrom || undefined;
    const dt = dateTo || undefined;
    fetchStatistics(df, dt)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
    fetchBootstrap(1000, df, dt)
      .then(setBootstrap)
      .catch(() => setBootstrap(null))
      .finally(() => setBsLoading(false));
    fetchAutocorrelation(20, df, dt)
      .then(setAcf)
      .catch(() => setAcf(null))
      .finally(() => setAcfLoading(false));
    fetchHurst(df, dt)
      .then(setHurst)
      .catch(() => setHurst(null))
      .finally(() => setHurstLoading(false));
    fetchAndersonDarling(df, dt)
      .then(setAd)
      .catch(() => setAd(null))
      .finally(() => setAdLoading(false));
    fetchLjungBox(20, df, dt)
      .then(setLjung)
      .catch(() => setLjung(null))
      .finally(() => setLjungLoading(false));
    fetchMarkovChain(df, dt)
      .then(setMarkov)
      .catch(() => setMarkov(null))
      .finally(() => setMarkovLoading(false));
    fetchSpectral(df, dt)
      .then(setSpectral)
      .catch(() => setSpectral(null))
      .finally(() => setSpectralLoading(false));
    fetchRunsTest(df, dt)
      .then(setRuns)
      .catch(() => setRuns(null))
      .finally(() => setRunsLoading(false));
    fetchGapDistribution(df, dt)
      .then(setGaps)
      .catch(() => setGaps(null))
      .finally(() => setGapsLoading(false));
    fetchPairBias(df, dt)
      .then(setPairs)
      .catch(() => setPairs(null))
      .finally(() => setPairsLoading(false));
  }, [dateFrom, dateTo]);

  return (
    <AnalysisPageLayout sections={SECTIONS}>
      <div className="max-w-3xl space-y-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Estatísticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.total_drawings.toLocaleString("pt-BR")} concursos · ${data.total_picks.toLocaleString("pt-BR")} números sorteados · esperado ${data.expected_per_number.toFixed(1)} por número`
              : ""}
          </p>
        </div>

        <div className="sticky top-0 z-10 -mx-8 border-b border-border bg-background px-8 py-3">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading && (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            Carregando...
          </div>
        )}

        {!loading && data && (() => {
          const tests: { label: string; significant: boolean | null }[] = [
            { label: "Chi-quadrado",      significant: data.chi_square.significant },
            { label: "KS",               significant: data.ks_test.significant },
            { label: "Anderson-Darling", significant: ad ? ad.significant : null },
            { label: "Desvios",          significant: data.per_number.filter(n => Math.abs(n.z_score) > 2).length > 3 },
            { label: "Bootstrap",        significant: bootstrap ? (60 - bootstrap.within_ci_count) > 3 : null },
            { label: "Autocorrelação",   significant: acf ? acf.acf.some(p => Math.abs(p.autocorrelation) > acf.ci_bound) : null },
            { label: "Ljung-Box",        significant: ljung ? ljung.significant : null },
            { label: "Hurst",            significant: hurst ? (hurst.hurst_exponent < 0.45 || hurst.hurst_exponent > 0.55) : null },
            { label: "Runs Test",        significant: runs ? runs.significant : null },
            { label: "Intervalos",       significant: gaps ? gaps.significant : null },
            { label: "Viés de Pares",    significant: pairs ? pairs.significant : null },
            { label: "Markov",           significant: markov ? markov.significant : null },
            { label: "Espectral",        significant: spectral ? spectral.spectrum.some(p => p.power > spectral.noise_floor * 3) : null },
          ];
          const resolved = tests.filter(t => t.significant !== null);
          const sigCount = resolved.filter(t => t.significant).length;
          const total = resolved.length;
          const verdictColor = sigCount === 0 ? "text-emerald-400" : sigCount <= 2 ? "text-amber-400" : "text-red-400";
          const borderColor = sigCount === 0 ? "border-emerald-500/30 bg-emerald-500/5" : sigCount <= 2 ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5";
          return (
          <>
            <div className={`rounded-lg border px-5 py-4 ${borderColor}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Resumo das análises</p>
                <p className={`text-sm font-bold ${verdictColor}`}>
                  {sigCount} de {total} com desvio detectado
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tests.map(t => (
                  <span key={t.label} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                    t.significant === null ? "text-muted-foreground bg-muted/40" :
                    t.significant ? "text-red-400 bg-red-500/10" : "text-emerald-400 bg-emerald-500/10"
                  }`}>
                    <span>{t.significant === null ? "·" : t.significant ? "!" : "✓"}</span>
                    {t.label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground/60">
                {sigCount === 0
                  ? "Todas as análises são consistentes com distribuição aleatória uniforme."
                  : sigCount <= 2
                  ? "Poucos desvios — esperado por acaso em uma bateria de testes. Verifique os detalhes."
                  : "Múltiplos desvios detectados — vale investigar os testes marcados individualmente."}
              </p>
            </div>

            <AnalysisSection id="qui-quadrado">
              <SectionTitle>Teste Chi-quadrado</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Testa se os 60 números aparecem com frequências iguais ao longo de todos os sorteios.
                A hipótese nula é que cada número tem probabilidade exata de 6/60 = 10% de ser sorteado.
                p ≥ 0,05 indica que não há evidência estatística de desequilíbrio.
              </p>
              <div className="mb-5 rounded border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Quer ver como esse indicador evolui ao longo do tempo? A página de{" "}
                <span className="font-medium text-foreground">Análise Temporal</span> (em breve) mostrará
                chi-quadrado, Shannon Entropy e outros indicadores em janelas deslizantes — ideal para
                identificar períodos com comportamento estatístico diferente do normal.
              </div>
              <TestCard
                title="Chi-quadrado de Pearson"
                description="Compara a frequência observada de cada número contra a frequência esperada sob distribuição uniforme."
                statistic={data.chi_square.statistic}
                pValue={data.chi_square.p_value}
                df={data.chi_square.degrees_of_freedom}
                significant={data.chi_square.significant}
              />
            </AnalysisSection>

            <AnalysisSection id="ks">
              <SectionTitle>Teste de Kolmogorov-Smirnov</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Compara a distribuição empírica dos z-scores de frequência contra a distribuição normal padrão.
                Se os desvios forem normalmente distribuídos em torno de zero, os sorteios são consistentes com aleatoriedade.
              </p>
              <TestCard
                title="Kolmogorov-Smirnov (z-scores vs normal)"
                description="Testa se os desvios padronizados das frequências observadas seguem uma distribuição normal."
                statistic={data.ks_test.statistic}
                pValue={data.ks_test.p_value}
                df={data.ks_test.degrees_of_freedom}
                significant={data.ks_test.significant}
              />
            </AnalysisSection>

            <AnalysisSection id="anderson-darling">
              <SectionTitle>Teste de Anderson-Darling</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Alternativa mais sensível ao KS nas caudas da distribuição. Testa se os z-scores de frequência seguem distribuição normal.
                Detecta desvios que o KS às vezes perde, especialmente em números extremamente acima ou abaixo do esperado.
              </p>
              {adLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!adLoading && ad && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">Estatística A²</p>
                    <p className="mt-1 text-2xl font-bold font-mono">{ad.statistic.toFixed(3)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">Valor crítico (5%)</p>
                    <p className="mt-1 text-2xl font-bold font-mono">{ad.critical_value_5pct.toFixed(3)}</p>
                  </div>
                  <div className={`rounded-lg border p-4 flex items-center justify-center ${ad.significant ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                    <p className={`text-sm font-medium text-center ${ad.significant ? "text-red-400" : "text-emerald-400"}`}>
                      {ad.significant ? "A² > crítico — desvio significativo" : "A² ≤ crítico — compatível com aleatoriedade"}
                    </p>
                  </div>
                </div>
              )}
            </AnalysisSection>

            <AnalysisSection id="desvios">
              <SectionTitle>Desvios por número</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Z-score de cada número: quantos desvios padrão sua frequência observada está acima ou abaixo da esperada.
                Números em <span className="text-red-400 font-medium">vermelho</span> estão além de ±2σ — estatisticamente incomuns, mas esperado que alguns apareçam por acaso.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data.per_number} margin={{ top: 16, right: 16, left: 0, bottom: 0 }} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<DesviosTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: "+2σ", position: "right", fontSize: 9, fill: "#ef4444" }} />
                  <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: "−2σ", position: "right", fontSize: 9, fill: "#ef4444" }} />
                  <Bar dataKey="z_score" isAnimationActive={false} fill="#059669" label={false} shape={<ZBar />} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs text-muted-foreground/60">Verde = acima do esperado · Azul = abaixo do esperado · Vermelho = além de ±2σ</p>
            </AnalysisSection>

            <AnalysisSection id="bootstrap">
              <SectionTitle>Bootstrap — Intervalo de Confiança 95%</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Para cada número, 1.000 reamostras com reposição estimam o intervalo de confiança de 95% da sua frequência real.
                Barras <span className="text-red-400 font-medium">vermelhas</span> indicam números cujo IC não inclui 10% (esperado) — estatisticamente suspeitos.
              </p>
              {bsLoading && <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">Calculando bootstrap...</div>}
              {!bsLoading && bootstrap && (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Dentro do IC</p>
                      <p className="mt-1 text-lg font-bold text-emerald-400">{bootstrap.within_ci_count} / 60</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Fora do IC</p>
                      <p className="mt-1 text-lg font-bold text-red-400">{60 - bootstrap.within_ci_count} / 60</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Reamostras</p>
                      <p className="mt-1 text-lg font-bold">{bootstrap.n_resamples.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={bootstrap.items} margin={{ top: 8, right: 48, left: 0, bottom: 0 }} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis tickFormatter={(v: number) => `${v.toFixed(1)}%`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip content={<BootstrapTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <ReferenceLine y={bootstrap.expected_pct} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.6}
                        label={{ value: "10%", position: "right", fontSize: 9, fill: "#ef4444" }} />
                      <Bar dataKey="observed_pct" isAnimationActive={false} fill="#059669" label={false} shape={<BootstrapBar />} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="mt-3 text-xs text-muted-foreground/60">Verde = 10% dentro do IC · Vermelho = 10% fora do IC · Linha tracejada = 10% esperado</p>
                </>
              )}
            </AnalysisSection>

            <AnalysisSection id="autocorrelacao">
              <SectionTitle>Autocorrelação</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Para cada lag k, mede a correlação média entre a presença de cada número no sorteio t e no sorteio t+k.
                Em uma loteria justa, todas as barras devem estar próximas de zero.
                Barras <span className="text-red-400 font-medium">vermelhas</span> estão além do intervalo de confiança 95% (±{acf ? acf.ci_bound.toFixed(3) : "…"}) e indicam dependência temporal.
              </p>
              {acfLoading && <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">Calculando autocorrelação...</div>}
              {!acfLoading && acf?.acf.length === 0 && (
                <p className="text-sm text-muted-foreground">Sorteios insuficientes para o lag selecionado.</p>
              )}
              {!acfLoading && acf && acf.acf.length > 0 && (() => {
                const chartData = acf.acf.map((p) => ({ ...p, ci_bound: acf.ci_bound }));
                const significant = acf.acf.filter((p) => Math.abs(p.autocorrelation) > acf.ci_bound).length;
                return (
                  <>
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Lags analisados</p>
                        <p className="mt-1 text-lg font-bold">{acf.max_lag}</p>
                      </div>
                      <div className="rounded-lg border border-border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Lags significativos</p>
                        <p className={`mt-1 text-lg font-bold ${significant > 0 ? "text-red-400" : "text-emerald-400"}`}>{significant}</p>
                      </div>
                      <div className="rounded-lg border border-border p-3 text-center">
                        <p className="text-xs text-muted-foreground">IC 95% (±)</p>
                        <p className="mt-1 text-lg font-bold font-mono">{acf.ci_bound.toFixed(3)}</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={chartData} margin={{ top: 8, right: 48, left: 0, bottom: 16 }} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="lag" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} label={{ value: "lag (sorteios)", position: "insideBottom", offset: -10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => v.toFixed(2)} />
                        <Tooltip content={<AcfTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                        <ReferenceLine y={acf.ci_bound} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: "+IC", position: "right", fontSize: 9, fill: "#ef4444" }} />
                        <ReferenceLine y={-acf.ci_bound} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: "−IC", position: "right", fontSize: 9, fill: "#ef4444" }} />
                        <Bar dataKey="autocorrelation" isAnimationActive={false} fill="#3b82f6" label={false} shape={<AcfBar />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="mt-3 text-xs text-muted-foreground/60">Azul = dentro do IC · Vermelho = dependência significativa · Linhas tracejadas = ±IC 95%</p>
                  </>
                );
              })()}
            </AnalysisSection>

            <AnalysisSection id="ljung-box">
              <SectionTitle>Teste de Ljung-Box</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Versão mais rigorosa da autocorrelação: testa todos os lags simultaneamente com um único p-value.
                Enquanto a autocorrelação avalia cada lag individualmente, o Ljung-Box responde "existe qualquer dependência serial nos primeiros {ljung?.max_lag ?? 20} lags?"
              </p>
              {ljungLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!ljungLoading && ljung && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Estatística Q (média dos 60 números)</p>
                      <p className="mt-1 text-2xl font-bold font-mono">{ljung.statistic.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">p-value</p>
                      <p className="mt-1 text-lg font-bold font-mono">{ljung.p_value.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Números com dependência serial (p {"<"} 0,05)</p>
                      <p className={`mt-1 text-lg font-bold ${ljung.significant_count > 3 ? "text-red-400" : "text-emerald-400"}`}>
                        {ljung.significant_count} / 60
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-lg border p-4 flex items-center justify-center ${ljung.significant ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                    <p className={`text-sm font-medium text-center ${ljung.significant ? "text-red-400" : "text-emerald-400"}`}>
                      {ljung.significant
                        ? "Dependência serial detectada em múltiplos números"
                        : "Sem dependência serial significativa — consistente com aleatoriedade"}
                    </p>
                  </div>
                </div>
              )}
            </AnalysisSection>

            <AnalysisSection id="hurst">
              <SectionTitle>Hurst Exponent</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Mede se há <span className="font-medium text-foreground">memória de longo prazo</span> nos sorteios usando o método R/S (Rescaled Range).
                H ≈ 0,5 = aleatório puro · H {">"} 0,55 = persistência (padrões se repetem) · H {"<"} 0,45 = anti-persistência (alternância).
              </p>
              {hurstLoading && <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!hurstLoading && hurst && (
                <>
                  {hurst.min_drawings_warning && (
                    <div className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                      Estimativa menos confiável com menos de 500 sorteios ({hurst.total_drawings} no período selecionado).
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-5">
                      <p className="text-xs text-muted-foreground">Expoente de Hurst (H)</p>
                      <p className={`mt-2 text-4xl font-bold font-mono ${
                        hurst.hurst_exponent > 0.55 ? "text-red-400"
                        : hurst.hurst_exponent < 0.45 ? "text-blue-400"
                        : "text-emerald-400"
                      }`}>
                        {hurst.hurst_exponent.toFixed(3)}
                      </p>
                      <div className="mt-3 h-2 w-full rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-emerald-600 transition-all"
                          style={{ width: `${hurst.hurst_exponent * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>0 — anti-persist.</span>
                        <span>0,5 — aleatório</span>
                        <span>persist. — 1</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-5 flex flex-col justify-center">
                      <p className="text-xs text-muted-foreground mb-2">Interpretação</p>
                      <p className="text-sm font-medium">{hurst.interpretation}</p>
                    </div>
                  </div>
                </>
              )}
            </AnalysisSection>

            <AnalysisSection id="runs">
              <SectionTitle>Runs Test (Wald-Wolfowitz)</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Testa se as sequências de aparições e ausências de cada número formam "corridas" aleatórias.
                Corridas demais ou de menos sugerem padrão não-aleatório. Resultado médio dos 60 números.
              </p>
              {runsLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!runsLoading && runs && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Z médio (60 números)</p>
                      <p className="mt-1 text-2xl font-bold font-mono">{runs.avg_z_statistic > 0 ? "+" : ""}{runs.avg_z_statistic.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">p-value médio</p>
                      <p className="mt-1 text-lg font-bold font-mono">{runs.avg_p_value.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Números com p {"<"} 0,05</p>
                      <p className={`mt-1 text-lg font-bold ${runs.significant_count > 3 ? "text-red-400" : "text-emerald-400"}`}>
                        {runs.significant_count} / 60
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-lg border p-4 flex items-center justify-center ${runs.significant ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                    <p className={`text-sm font-medium text-center ${runs.significant ? "text-red-400" : "text-emerald-400"}`}>
                      {runs.significant
                        ? "Padrão detectado — corridas não-aleatórias em múltiplos números"
                        : "Consistente com aleatoriedade — corridas dentro do esperado"}
                    </p>
                  </div>
                </div>
              )}
            </AnalysisSection>

            <AnalysisSection id="intervalos">
              <SectionTitle>Distribuição de Intervalos</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Testa se os intervalos entre aparições de cada número seguem a distribuição geométrica esperada (p = 10%).
                Intervalo médio esperado: 10 sorteios. Desvios sugerem padrões de retorno não-aleatórios.
              </p>
              {gapsLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!gapsLoading && gaps && (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Intervalo médio observado</p>
                      <p className="mt-1 text-lg font-bold">{gaps.avg_observed_gap.toFixed(1)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Intervalo esperado</p>
                      <p className="mt-1 text-lg font-bold">{gaps.expected_gap.toFixed(1)}</p>
                    </div>
                    <div className={`rounded-lg border p-3 text-center ${gaps.significant ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                      <p className="text-xs text-muted-foreground">p-value (χ²)</p>
                      <p className={`mt-1 text-lg font-bold ${gaps.significant ? "text-red-400" : "text-emerald-400"}`}>{gaps.p_value.toFixed(4)}</p>
                    </div>
                  </div>
                  {gaps.distribution.length > 0 && (
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={gaps.distribution} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} />
                        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: number, name: string) => [v.toFixed(1), name === "observed" ? "Observado" : "Esperado"]} />
                        <Bar dataKey="observed" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} name="observed" />
                        <Bar dataKey="expected" fill="#ef444460" radius={[2, 2, 0, 0]} isAnimationActive={false} name="expected" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground/60">Azul = observado · Vermelho translúcido = esperado geométrico</p>
                </>
              )}
            </AnalysisSection>

            <AnalysisSection id="viés-pares">
              <SectionTitle>Viés de Pares</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Chi-quadrado sobre as 1.770 combinações de pares possíveis. Cada par é esperado em ~{pairs ? pairs.expected_per_pair.toFixed(1) : "…"} sorteios.
                Os 5 pares que mais aparecem juntos e os 5 que menos aparecem são listados abaixo.
              </p>
              {pairsLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!pairsLoading && pairs && (
                <>
                  <div className={`mb-4 rounded border px-3 py-2 text-xs font-medium ${pairs.significant ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"}`}>
                    χ² = {pairs.chi_square_statistic.toFixed(1)} · p = {pairs.p_value.toFixed(4)} · {pairs.significant ? "Desvio significativo nos pares" : "Distribuição de pares compatível com aleatoriedade"}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {[{ label: "Pares mais frequentes", items: pairs.top_above, color: "text-emerald-400" },
                      { label: "Pares menos frequentes", items: pairs.top_below, color: "text-blue-400" }].map(({ label, items, color }) => (
                      <div key={label}>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                              <th className="pb-1 font-medium">Par</th>
                              <th className="pb-1 text-right font-medium">Obs.</th>
                              <th className="pb-1 text-right font-medium">Esp.</th>
                              <th className="pb-1 text-right font-medium">Z</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(items as PairBiasItem[]).map((it) => (
                              <tr key={`${it.n1}-${it.n2}`} className="border-b border-border/40">
                                <td className="py-1 font-mono">{it.n1}–{it.n2}</td>
                                <td className="py-1 text-right">{it.observed}</td>
                                <td className="py-1 text-right text-muted-foreground">{it.expected.toFixed(1)}</td>
                                <td className={`py-1 text-right font-mono ${color}`}>{it.z_score > 0 ? "+" : ""}{it.z_score.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AnalysisSection>

            <AnalysisSection id="markov">
              <SectionTitle>Cadeia de Markov</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Testa se saber quais números saíram no sorteio T ajuda a prever quais saem em T+1.
                Diferente do Viés de Pares (que olha o mesmo sorteio), a cadeia de Markov olha a transição entre sorteios consecutivos.
                Taxa esperada: ~10% — cada número deve aparecer no sorteio seguinte independente de ter aparecido antes.
              </p>
              {markovLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!markovLoading && markov && (
                <>
                  <div className={`mb-4 rounded border px-3 py-2 text-xs font-medium ${markov.significant ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"}`}>
                    χ² = {markov.chi_square_statistic.toFixed(1)} · p = {markov.p_value.toFixed(4)} · taxa esperada = {(markov.expected_transition_rate * 100).toFixed(1)}% ·{" "}
                    {markov.significant ? "Dependência entre sorteios consecutivos detectada" : "Sem dependência entre sorteios consecutivos"}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {[{ label: "Transições mais frequentes", items: markov.top_above, color: "text-emerald-400" },
                      { label: "Transições menos frequentes", items: markov.top_below, color: "text-blue-400" }].map(({ label, items, color }) => (
                      <div key={label}>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                              <th className="pb-1 font-medium">De → Para</th>
                              <th className="pb-1 text-right font-medium">Obs.</th>
                              <th className="pb-1 text-right font-medium">Esp.</th>
                              <th className="pb-1 text-right font-medium">Z</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(items as MarkovTransitionItem[]).map((it) => (
                              <tr key={`${it.from_number}-${it.to_number}`} className="border-b border-border/40">
                                <td className="py-1 font-mono">{it.from_number} → {it.to_number}</td>
                                <td className="py-1 text-right">{it.observed_count}</td>
                                <td className="py-1 text-right text-muted-foreground">{it.expected_count.toFixed(1)}</td>
                                <td className={`py-1 text-right font-mono ${color}`}>{it.z_score > 0 ? "+" : ""}{it.z_score.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AnalysisSection>

            <AnalysisSection id="espectral">
              <SectionTitle>Análise Espectral (FFT)</SectionTitle>
              <p className="mb-5 text-xs text-muted-foreground">
                Aplica a Transformada de Fourier nas séries temporais de aparição de cada número para detectar ciclos periódicos.
                O eixo X mostra o período em sorteios (ex: 50 = ciclo a cada 50 sorteios).
                Em sorteios aleatórios o espectro deve ser plano (ruído branco) — picos acima do patamar de ruído sugerem periodicidade.
              </p>
              {spectralLoading && <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">Calculando...</div>}
              {!spectralLoading && spectral && spectral.spectrum.length === 0 && (
                <p className="text-sm text-muted-foreground">Sorteios insuficientes para análise espectral.</p>
              )}
              {!spectralLoading && spectral && spectral.spectrum.length > 0 && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Período dominante</p>
                      <p className="mt-1 text-lg font-bold">{spectral.dominant_period.toFixed(1)} sorteios</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Patamar de ruído (mediana)</p>
                      <p className="mt-1 text-lg font-bold font-mono">{spectral.noise_floor.toFixed(4)}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={spectral.spectrum} margin={{ top: 8, right: 16, left: 0, bottom: 16 }} barSize={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false}
                        label={{ value: "período (sorteios)", position: "insideBottom", offset: -10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v: number) => v.toFixed(0)} interval={Math.floor(spectral.spectrum.length / 8)} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip formatter={(v: number) => [v.toFixed(4), "Potência"]} labelFormatter={(v: number) => `Período: ${Number(v).toFixed(1)} sorteios`} cursor={{ fill: "hsl(var(--muted))" }} />
                      <ReferenceLine y={spectral.noise_floor} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.6}
                        label={{ value: "ruído", position: "right", fontSize: 9, fill: "#ef4444" }} />
                      <Bar dataKey="power" fill="#6366f1" isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-muted-foreground/60">Barras = potência por período · Linha vermelha = patamar de ruído (mediana) · Picos acima da linha = possível periodicidade</p>
                </>
              )}
            </AnalysisSection>

          </>
          );
        })()}
      </div>
    </AnalysisPageLayout>
  );
}
