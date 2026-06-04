from datetime import date
from typing import Any

from pydantic import BaseModel


class DrawingBase(BaseModel):
    drawing_number: int
    draw_date: date
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    n6: int
    draw_sum: int
    total_prize: float
    roll_over: bool
    next_draw_date: date | None
    winners_6: int
    prize_6: float
    winners_5: int
    prize_5: float
    winners_4: int
    prize_4: float
    total_collected: float
    next_accumulated: float
    next_estimated: float
    special_accumulated: float
    milestone_accumulated: float
    draw_order: str | None
    is_special: bool
    milestone_draw_number: int | None


class DrawingSummary(BaseModel):
    drawing_number: int
    draw_date: date
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    n6: int
    roll_over: bool
    winners_6: int
    prize_6: float
    winners_5: int
    prize_5: float
    winners_4: int
    prize_4: float

    model_config = {"from_attributes": True}


class DrawingDetail(DrawingBase):
    drawing_id: int
    source_metadata: dict[str, Any] | None

    model_config = {"from_attributes": True}


class DrawingsPage(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[DrawingSummary]


class FrequencyItem(BaseModel):
    number: int
    count: int
    percentage: float
    recent_count: int
    recent_percentage: float
    global_percentage: float
    last_seen: int | None
    last_seen_date: date | None
    current_drought: int
    max_drought: int


class FrequencyResponse(BaseModel):
    total_drawings: int
    recent_window: int
    frequencies: list[FrequencyItem]


class PairItem(BaseModel):
    n1: int
    n2: int
    count: int
    percentage: float


class CooccurrenceResponse(BaseModel):
    total_drawings: int
    top: list[PairItem]
    bottom: list[PairItem]


class BucketItem(BaseModel):
    label: str
    count: int
    percentage: float
    expected_percentage: float


class PrizePoint(BaseModel):
    drawing_number: int
    draw_date: date
    prize_6: float
    winners_6: int
    prize_5: float
    winners_5: int
    prize_4: float
    winners_4: int
    roll_over: bool


class CycleRecord(BaseModel):
    length: int
    final_prize: float
    end_drawing: int
    end_date: date


class AccumulationStats(BaseModel):
    total_cycles: int
    avg_length: float
    max_length: int
    min_length: int
    longest: CycleRecord
    distribution: list[BucketItem]


class JackpotMilestone(BaseModel):
    threshold_m: int
    count_individual: int
    count_sena_total: int
    count_distributed: int


class PrizesResponse(BaseModel):
    points: list[PrizePoint]
    accumulation: AccumulationStats
    milestones: list[JackpotMilestone]
    record_individual: float
    record_sena_total: float
    record_distributed: float


class AndersonDarlingResponse(BaseModel):
    total_drawings: int
    statistic: float
    critical_value_5pct: float
    significant: bool


class LjungBoxResponse(BaseModel):
    total_drawings: int
    max_lag: int
    statistic: float
    p_value: float
    significant: bool
    significant_count: int


class MarkovTransitionItem(BaseModel):
    from_number: int
    to_number: int
    observed_count: int
    expected_count: float
    z_score: float


class MarkovChainResponse(BaseModel):
    total_drawings: int
    expected_transition_rate: float
    chi_square_statistic: float
    p_value: float
    significant: bool
    top_above: list[MarkovTransitionItem]
    top_below: list[MarkovTransitionItem]


class SpectralPoint(BaseModel):
    period: float
    power: float


class SpectralResponse(BaseModel):
    total_drawings: int
    dominant_period: float
    noise_floor: float
    spectrum: list[SpectralPoint]


class RunsTestResponse(BaseModel):
    total_drawings: int
    avg_z_statistic: float
    avg_p_value: float
    significant_count: int
    significant: bool


class GapBucket(BaseModel):
    label: str
    observed: int
    expected: float


class GapTestResponse(BaseModel):
    total_drawings: int
    expected_gap: float
    avg_observed_gap: float
    chi_square_statistic: float
    p_value: float
    significant: bool
    distribution: list[GapBucket]


class PairBiasItem(BaseModel):
    n1: int
    n2: int
    observed: int
    expected: float
    z_score: float


class PairBiasResponse(BaseModel):
    total_drawings: int
    expected_per_pair: float
    chi_square_statistic: float
    p_value: float
    significant: bool
    top_above: list[PairBiasItem]
    top_below: list[PairBiasItem]


class HurstResponse(BaseModel):
    total_drawings: int
    hurst_exponent: float
    interpretation: str
    min_drawings_warning: bool


class MonteCarloItem(BaseModel):
    number: int
    observed_pct: float
    sim_mean: float
    sim_p5: float
    sim_p95: float
    outside_band: bool


class MonteCarloResponse(BaseModel):
    total_drawings: int
    n_simulations: int
    outside_band_count: int
    items: list[MonteCarloItem]


class AcfPoint(BaseModel):
    lag: int
    autocorrelation: float


class AutocorrelationResponse(BaseModel):
    total_drawings: int
    max_lag: int
    ci_bound: float
    acf: list[AcfPoint]


class BootstrapItem(BaseModel):
    number: int
    observed_pct: float
    ci_low: float
    ci_high: float
    expected_within_ci: bool


class BootstrapResponse(BaseModel):
    total_drawings: int
    n_resamples: int
    expected_pct: float
    confidence_level: float
    within_ci_count: int
    items: list[BootstrapItem]


class TestResult(BaseModel):
    statistic: float
    p_value: float
    degrees_of_freedom: int | None
    significant: bool


class NumberDeviation(BaseModel):
    number: int
    observed: int
    expected: float
    z_score: float


class StatisticsResponse(BaseModel):
    total_drawings: int
    total_picks: int
    expected_per_number: float
    chi_square: TestResult
    ks_test: TestResult
    per_number: list[NumberDeviation]


class SimpleStat(BaseModel):
    mean: float
    std_dev: float


class PatternStat(BaseModel):
    mean: float
    std_dev: float
    min: int
    max: int
    most_common: int


class PatternsResponse(BaseModel):
    total_drawings: int
    sum: list[BucketItem]
    parity: list[BucketItem]
    low_high: list[BucketItem]
    spacing: list[BucketItem]
    amplitude: list[BucketItem]
    consecutives: list[BucketItem]
    repeats: list[BucketItem]
    primes: list[BucketItem]
    fibonacci: list[BucketItem]
    mult3: list[BucketItem]
    mult5: list[BucketItem]
    quartiles: list[BucketItem]
    sum_parity: list[BucketItem]
    sum_parity_stat: SimpleStat
    digits: list[BucketItem]
    sum_stat: PatternStat
