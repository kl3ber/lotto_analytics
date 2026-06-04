const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface DrawingSummary {
  drawing_number: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  roll_over: boolean;
  winners_6: number;
  prize_6: number;
  winners_5: number;
  prize_5: number;
  winners_4: number;
  prize_4: number;
}

export interface DrawingDetail extends DrawingSummary {
  drawing_id: number;
  next_draw_date: string | null;
  winners_5: number;
  prize_5: number;
  winners_4: number;
  prize_4: number;
  total_collected: number;
  next_accumulated: number;
  next_estimated: number;
  special_accumulated: number;
  milestone_accumulated: number;
  draw_order: string | null;
  is_special: boolean;
  milestone_draw_number: number | null;
  source_metadata: Record<string, unknown> | null;
}

export interface DrawingsPage {
  total: number;
  page: number;
  page_size: number;
  results: DrawingSummary[];
}

export type SortField =
  | "draw_date"
  | "drawing_number"
  | "draw_sum"
  | "prize_6"
  | "total_collected";

export interface DrawingFilters {
  dateFrom?: string;
  dateTo?: string;
  drawingFrom?: number;
  drawingTo?: number;
  rollOver?: boolean;
}

export async function fetchDrawings(
  page: number,
  pageSize: number,
  sort: SortField,
  order: "asc" | "desc",
  filters: DrawingFilters = {}
): Promise<DrawingsPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort,
    order,
  });

  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.drawingFrom != null) params.set("drawing_from", String(filters.drawingFrom));
  if (filters.drawingTo != null) params.set("drawing_to", String(filters.drawingTo));
  if (filters.rollOver != null) params.set("roll_over", String(filters.rollOver));

  const res = await fetch(`${API_BASE}/drawings?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchDrawing(drawingNumber: number): Promise<DrawingDetail> {
  const res = await fetch(`${API_BASE}/drawings/${drawingNumber}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface FrequencyItem {
  number: number;
  count: number;
  percentage: number;
  recent_count: number;
  recent_percentage: number;
  global_percentage: number;
  last_seen: number | null;
  last_seen_date: string | null;
  current_drought: number;
  max_drought: number;
}

export interface FrequencyResponse {
  total_drawings: number;
  recent_window: number;
  frequencies: FrequencyItem[];
}

export interface PrizePoint {
  drawing_number: number;
  draw_date: string;
  prize_6: number;
  winners_6: number;
  prize_5: number;
  winners_5: number;
  prize_4: number;
  winners_4: number;
  roll_over: boolean;
}

export interface CycleRecord {
  length: number;
  final_prize: number;
  end_drawing: number;
  end_date: string;
}

export interface AccumulationStats {
  total_cycles: number;
  avg_length: number;
  max_length: number;
  min_length: number;
  longest: CycleRecord;
  distribution: BucketItem[];
}

export interface JackpotMilestone {
  threshold_m: number;
  count_individual: number;
  count_sena_total: number;
  count_distributed: number;
}

export interface PrizesResponse {
  points: PrizePoint[];
  accumulation: AccumulationStats;
  milestones: JackpotMilestone[];
  record_individual: number;
  record_sena_total: number;
  record_distributed: number;
}

export async function fetchFrequency(
  dateFrom?: string,
  dateTo?: string,
  recent = 100
): Promise<FrequencyResponse> {
  const params = new URLSearchParams({ recent: String(recent) });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/frequency?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface PairItem {
  n1: number;
  n2: number;
  count: number;
  percentage: number;
}

export interface CooccurrenceResponse {
  total_drawings: number;
  top: PairItem[];
  bottom: PairItem[];
}

export interface BucketItem {
  label: string;
  count: number;
  percentage: number;
  expected_percentage: number;
}

export interface PatternStat {
  mean: number;
  std_dev: number;
  min: number;
  max: number;
  most_common: number;
}

export interface PatternsResponse {
  total_drawings: number;
  sum: BucketItem[];
  parity: BucketItem[];
  low_high: BucketItem[];
  spacing: BucketItem[];
  amplitude: BucketItem[];
  consecutives: BucketItem[];
  repeats: BucketItem[];
  primes: BucketItem[];
  fibonacci: BucketItem[];
  mult3: BucketItem[];
  mult5: BucketItem[];
  quartiles: BucketItem[];
  sum_parity: BucketItem[];
  sum_parity_stat: { mean: number; std_dev: number };
  digits: BucketItem[];
  sum_stat: PatternStat;
}

export async function fetchPatterns(dateFrom?: string, dateTo?: string): Promise<PatternsResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/patterns?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface TestResult {
  statistic: number;
  p_value: number;
  degrees_of_freedom: number | null;
  significant: boolean;
}

export interface NumberDeviation {
  number: number;
  observed: number;
  expected: number;
  z_score: number;
}

export interface StatisticsResponse {
  total_drawings: number;
  total_picks: number;
  expected_per_number: number;
  chi_square: TestResult;
  ks_test: TestResult;
  per_number: NumberDeviation[];
}

export interface BootstrapItem {
  number: number;
  observed_pct: number;
  ci_low: number;
  ci_high: number;
  expected_within_ci: boolean;
}

export interface BootstrapResponse {
  total_drawings: number;
  n_resamples: number;
  expected_pct: number;
  confidence_level: number;
  within_ci_count: number;
  items: BootstrapItem[];
}

export interface AndersonDarlingResponse {
  total_drawings: number;
  statistic: number;
  critical_value_5pct: number;
  significant: boolean;
}

export interface LjungBoxResponse {
  total_drawings: number;
  max_lag: number;
  statistic: number;
  p_value: number;
  significant: boolean;
  significant_count: number;
}

export interface MarkovTransitionItem {
  from_number: number;
  to_number: number;
  observed_count: number;
  expected_count: number;
  z_score: number;
}

export interface MarkovChainResponse {
  total_drawings: number;
  expected_transition_rate: number;
  chi_square_statistic: number;
  p_value: number;
  significant: boolean;
  top_above: MarkovTransitionItem[];
  top_below: MarkovTransitionItem[];
}

export interface SpectralPoint {
  period: number;
  power: number;
}

export interface SpectralResponse {
  total_drawings: number;
  dominant_period: number;
  noise_floor: number;
  spectrum: SpectralPoint[];
}

export async function fetchAndersonDarling(dateFrom?: string, dateTo?: string): Promise<AndersonDarlingResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/anderson-darling?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchLjungBox(maxLag = 20, dateFrom?: string, dateTo?: string): Promise<LjungBoxResponse> {
  const params = new URLSearchParams({ max_lag: String(maxLag) });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/ljung-box?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchMarkovChain(dateFrom?: string, dateTo?: string): Promise<MarkovChainResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/markov-chain?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchSpectral(dateFrom?: string, dateTo?: string): Promise<SpectralResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/spectral?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface RunsTestResponse {
  total_drawings: number;
  avg_z_statistic: number;
  avg_p_value: number;
  significant_count: number;
  significant: boolean;
}

export interface GapBucket {
  label: string;
  observed: number;
  expected: number;
}

export interface GapTestResponse {
  total_drawings: number;
  expected_gap: number;
  avg_observed_gap: number;
  chi_square_statistic: number;
  p_value: number;
  significant: boolean;
  distribution: GapBucket[];
}

export interface PairBiasItem {
  n1: number;
  n2: number;
  observed: number;
  expected: number;
  z_score: number;
}

export interface PairBiasResponse {
  total_drawings: number;
  expected_per_pair: number;
  chi_square_statistic: number;
  p_value: number;
  significant: boolean;
  top_above: PairBiasItem[];
  top_below: PairBiasItem[];
}

export async function fetchRunsTest(dateFrom?: string, dateTo?: string): Promise<RunsTestResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/runs-test?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchGapDistribution(dateFrom?: string, dateTo?: string): Promise<GapTestResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/gap-distribution?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPairBias(dateFrom?: string, dateTo?: string): Promise<PairBiasResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/pair-bias?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface HurstResponse {
  total_drawings: number;
  hurst_exponent: number;
  interpretation: string;
  min_drawings_warning: boolean;
}

export async function fetchHurst(dateFrom?: string, dateTo?: string): Promise<HurstResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/hurst?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface MonteCarloItem {
  number: number;
  observed_pct: number;
  sim_mean: number;
  sim_p5: number;
  sim_p95: number;
  outside_band: boolean;
}

export interface MonteCarloResponse {
  total_drawings: number;
  n_simulations: number;
  outside_band_count: number;
  items: MonteCarloItem[];
}

export async function fetchMonteCarlo(nSimulations = 500, dateFrom?: string, dateTo?: string): Promise<MonteCarloResponse> {
  const params = new URLSearchParams({ n_simulations: String(nSimulations) });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/monte-carlo?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface AcfPoint {
  lag: number;
  autocorrelation: number;
}

export interface AutocorrelationResponse {
  total_drawings: number;
  max_lag: number;
  ci_bound: number;
  acf: AcfPoint[];
}

export async function fetchAutocorrelation(maxLag = 20, dateFrom?: string, dateTo?: string): Promise<AutocorrelationResponse> {
  const params = new URLSearchParams({ max_lag: String(maxLag) });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/autocorrelation?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchBootstrap(nResamples = 1000, dateFrom?: string, dateTo?: string): Promise<BootstrapResponse> {
  const params = new URLSearchParams({ n_resamples: String(nResamples) });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/bootstrap?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchStatistics(dateFrom?: string, dateTo?: string): Promise<StatisticsResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${API_BASE}/analytics/statistics?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchCooccurrence(topN = 10): Promise<CooccurrenceResponse> {
  const res = await fetch(`${API_BASE}/analytics/cooccurrence?top_n=${topN}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPrizes(): Promise<PrizesResponse> {
  const res = await fetch(`${API_BASE}/analytics/prizes`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
