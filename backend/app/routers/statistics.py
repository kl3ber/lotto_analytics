from collections import Counter
from datetime import date
from typing import Annotated

import numpy as np
from fastapi import APIRouter, Depends, Query
from scipy import stats
from sqlalchemy.orm import Session

from app.database import Drawing, get_db
from app.schemas import (
    AcfPoint,
    AndersonDarlingResponse,
    AutocorrelationResponse,
    BootstrapItem,
    BootstrapResponse,
    GapBucket,
    GapTestResponse,
    HurstResponse,
    LjungBoxResponse,
    MarkovChainResponse,
    MarkovTransitionItem,
    MonteCarloItem,
    MonteCarloResponse,
    NumberDeviation,
    PairBiasItem,
    PairBiasResponse,
    RunsTestResponse,
    SpectralPoint,
    SpectralResponse,
    StatisticsResponse,
    TestResult,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _build_response(draws: list) -> StatisticsResponse:
    total_drawings = len(draws)
    total_picks = total_drawings * 6
    expected_count = total_picks / 60

    counts_map: Counter = Counter()
    for d in draws:
        for n in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            counts_map[n] += 1

    counts = np.array([counts_map.get(n, 0) for n in range(1, 61)], dtype=float)

    chi2_stat, chi2_pval = stats.chisquare(counts, f_exp=[expected_count] * 60)

    std = np.sqrt(total_picks * (1 / 60) * (59 / 60))
    z_scores = (counts - expected_count) / std
    ks_stat, ks_pval = stats.kstest(z_scores, "norm")

    per_number = [
        NumberDeviation(
            number=n,
            observed=int(counts[n - 1]),
            expected=round(expected_count, 2),
            z_score=round(float(z_scores[n - 1]), 3),
        )
        for n in range(1, 61)
    ]

    return StatisticsResponse(
        total_drawings=total_drawings,
        total_picks=total_picks,
        expected_per_number=round(expected_count, 2),
        chi_square=TestResult(
            statistic=round(float(chi2_stat), 4),
            p_value=round(float(chi2_pval), 4),
            degrees_of_freedom=59,
            significant=bool(chi2_pval < 0.05),
        ),
        ks_test=TestResult(
            statistic=round(float(ks_stat), 4),
            p_value=round(float(ks_pval), 4),
            degrees_of_freedom=None,
            significant=bool(ks_pval < 0.05),
        ),
        per_number=per_number,
    )


@router.get("/statistics")
def get_statistics(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> StatisticsResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.all()
    if not draws:
        return StatisticsResponse(
            total_drawings=0,
            total_picks=0,
            expected_per_number=0.0,
            chi_square=TestResult(
                statistic=0.0, p_value=1.0, degrees_of_freedom=59, significant=False
            ),
            ks_test=TestResult(
                statistic=0.0, p_value=1.0, degrees_of_freedom=None, significant=False
            ),
            per_number=[],
        )
    return _build_response(draws)


@router.get("/bootstrap")
def get_bootstrap(
    db: Annotated[Session, Depends(get_db)],
    n_resamples: Annotated[int, Query(ge=100, le=5000)] = 1000,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> BootstrapResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.all()

    if not draws:
        return BootstrapResponse(
            total_drawings=0,
            n_resamples=n_resamples,
            expected_pct=round(100 / 60, 4),
            confidence_level=0.95,
            within_ci_count=0,
            items=[],
        )

    draws_flat = np.array(
        [n for d in draws for n in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6)],
        dtype=np.int8,
    )
    n_total = len(draws_flat)
    expected_pct = round(100 / 60, 4)

    rng = (
        np.random.default_rng()
    )  # NOSONAR — bootstrap requires non-deterministic sampling
    resampled = np.zeros((n_resamples, 60), dtype=np.float32)
    for i in range(n_resamples):
        sample = draws_flat[rng.integers(0, n_total, size=n_total)]
        counts = np.bincount(sample, minlength=61)[1:]
        resampled[i] = counts / n_total * 100

    ci_low = np.percentile(resampled, 2.5, axis=0)
    ci_high = np.percentile(resampled, 97.5, axis=0)

    observed_counts = np.bincount(draws_flat, minlength=61)[1:]
    observed_pct = observed_counts / n_total * 100

    items = [
        BootstrapItem(
            number=n,
            observed_pct=round(float(observed_pct[n - 1]), 4),
            ci_low=round(float(ci_low[n - 1]), 4),
            ci_high=round(float(ci_high[n - 1]), 4),
            expected_within_ci=bool(ci_low[n - 1] <= expected_pct <= ci_high[n - 1]),
        )
        for n in range(1, 61)
    ]

    return BootstrapResponse(
        total_drawings=len(draws),
        n_resamples=n_resamples,
        expected_pct=expected_pct,
        confidence_level=0.95,
        within_ci_count=sum(1 for it in items if it.expected_within_ci),
        items=items,
    )


@router.get("/autocorrelation")
def get_autocorrelation(
    db: Annotated[Session, Depends(get_db)],
    max_lag: Annotated[int, Query(ge=1, le=50)] = 20,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> AutocorrelationResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()

    if len(draws) <= max_lag:
        return AutocorrelationResponse(
            total_drawings=len(draws),
            max_lag=max_lag,
            ci_bound=0.0,
            acf=[],
        )

    binary = np.zeros((len(draws), 60), dtype=np.float32)
    for t, d in enumerate(draws):
        for n in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            binary[t, n - 1] = 1.0

    ci_bound = round(1.96 / np.sqrt(len(draws)), 4)

    acf_points = []
    for lag in range(1, max_lag + 1):
        x = binary[:-lag]
        y = binary[lag:]
        x_mean = x.mean(axis=0)
        y_mean = y.mean(axis=0)
        x_std = x.std(axis=0)
        y_std = y.std(axis=0)
        valid = (x_std > 0) & (y_std > 0)
        cov = ((x - x_mean) * (y - y_mean)).mean(axis=0)
        corr = np.where(valid, cov / (x_std * y_std + 1e-10), 0.0)
        avg_corr = float(corr[valid].mean()) if valid.any() else 0.0
        acf_points.append(AcfPoint(lag=lag, autocorrelation=round(avg_corr, 5)))

    return AutocorrelationResponse(
        total_drawings=len(draws),
        max_lag=max_lag,
        ci_bound=ci_bound,
        acf=acf_points,
    )


@router.get("/monte-carlo")
def get_monte_carlo(
    db: Annotated[Session, Depends(get_db)],
    n_simulations: Annotated[int, Query(ge=100, le=2000)] = 500,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> MonteCarloResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.all()

    if not draws:
        return MonteCarloResponse(
            total_drawings=0,
            n_simulations=n_simulations,
            outside_band_count=0,
            items=[],
        )

    n_total = len(draws) * 6
    p = np.ones(60) / 60

    # Observed frequencies
    counts_map: Counter = Counter()
    for d in draws:
        for n in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            counts_map[n] += 1
    observed = np.array([counts_map.get(n, 0) for n in range(1, 61)], dtype=float)
    observed_pct = observed / n_total * 100

    # Simulate: multinomial approximation — fast and valid for large n_total
    rng = (
        np.random.default_rng()
    )  # NOSONAR — Monte Carlo requires non-deterministic sampling
    sim_counts = rng.multinomial(n_total, p, size=n_simulations).astype(np.float32)
    sim_pct = sim_counts / n_total * 100  # (n_simulations, 60)

    sim_mean = sim_pct.mean(axis=0)
    sim_p5 = np.percentile(sim_pct, 5, axis=0)
    sim_p95 = np.percentile(sim_pct, 95, axis=0)

    items = [
        MonteCarloItem(
            number=n,
            observed_pct=round(float(observed_pct[n - 1]), 4),
            sim_mean=round(float(sim_mean[n - 1]), 4),
            sim_p5=round(float(sim_p5[n - 1]), 4),
            sim_p95=round(float(sim_p95[n - 1]), 4),
            outside_band=bool(
                observed_pct[n - 1] < sim_p5[n - 1]
                or observed_pct[n - 1] > sim_p95[n - 1]
            ),
        )
        for n in range(1, 61)
    ]

    return MonteCarloResponse(
        total_drawings=len(draws),
        n_simulations=n_simulations,
        outside_band_count=sum(1 for it in items if it.outside_band),
        items=items,
    )


def _hurst_rs(series: np.ndarray) -> float | None:
    """Estimate Hurst exponent via R/S analysis on a single time series."""
    n = len(series)
    if n < 20:
        return None
    lags = [int(n / k) for k in [2, 4, 8, 16] if int(n / k) >= 10]
    if len(lags) < 2:
        return None
    rs_values = []
    for lag in lags:
        rs_lag = []
        for start in range(0, n - lag + 1, lag):
            sub = series[start : start + lag].astype(float)
            mean = sub.mean()
            devs = np.cumsum(sub - mean)
            r = devs.max() - devs.min()
            s = sub.std(ddof=1)
            if s > 0:
                rs_lag.append(r / s)
        if rs_lag:
            rs_values.append((np.log(lag), np.log(np.mean(rs_lag))))
    if len(rs_values) < 2:
        return None
    xs = np.array([v[0] for v in rs_values])
    ys = np.array([v[1] for v in rs_values])
    h = float(np.polyfit(xs, ys, 1)[0])
    return round(max(0.0, min(1.0, h)), 4)


@router.get("/hurst")
def get_hurst(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> HurstResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n < 20:
        return HurstResponse(
            total_drawings=n,
            hurst_exponent=0.5,
            interpretation="Dados insuficientes para estimar o expoente de Hurst.",
            min_drawings_warning=True,
        )

    binary = np.zeros((n, 60), dtype=np.float32)
    for t, d in enumerate(draws):
        for num in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            binary[t, num - 1] = 1.0

    h_values = [h for col in range(60) if (h := _hurst_rs(binary[:, col])) is not None]
    h_mean = round(float(np.mean(h_values)), 4) if h_values else 0.5

    if h_mean < 0.45:
        interpretation = "Anti-persistência — números tendem a alternar (H < 0,45)"
    elif h_mean > 0.55:
        interpretation = "Persistência — números tendem a continuar o padrão (H > 0,55)"
    else:
        interpretation = (
            "Sem memória detectável — consistente com sorteio aleatório (H ≈ 0,5)"
        )

    return HurstResponse(
        total_drawings=n,
        hurst_exponent=h_mean,
        interpretation=interpretation,
        min_drawings_warning=n < 500,
    )


@router.get("/runs-test")
def get_runs_test(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> RunsTestResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n < 10:
        return RunsTestResponse(
            total_drawings=n,
            avg_z_statistic=0.0,
            avg_p_value=1.0,
            significant_count=0,
            significant=False,
        )

    binary = np.zeros((n, 60), dtype=np.int8)
    for t, d in enumerate(draws):
        for num in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            binary[t, num - 1] = 1

    z_scores, p_values = [], []
    for col in range(60):
        series = binary[:, col]
        n1, n2 = int(series.sum()), int((1 - series).sum())
        if n1 < 2 or n2 < 2:
            continue
        runs = 1 + int(np.sum(series[1:] != series[:-1]))
        e_r = 2 * n1 * n2 / (n1 + n2) + 1
        var_r = 2 * n1 * n2 * (2 * n1 * n2 - n1 - n2) / ((n1 + n2) ** 2 * (n1 + n2 - 1))
        if var_r <= 0:
            continue
        z = (runs - e_r) / var_r**0.5
        p = float(2 * (1 - stats.norm.cdf(abs(z))))
        z_scores.append(z)
        p_values.append(p)

    if not z_scores:
        return RunsTestResponse(
            total_drawings=n,
            avg_z_statistic=0.0,
            avg_p_value=1.0,
            significant_count=0,
            significant=False,
        )

    avg_z = round(float(np.mean(z_scores)), 4)
    avg_p = round(float(np.mean(p_values)), 4)
    sig_count = int(sum(1 for p in p_values if p < 0.05))

    return RunsTestResponse(
        total_drawings=n,
        avg_z_statistic=avg_z,
        avg_p_value=avg_p,
        significant_count=sig_count,
        significant=sig_count > 3,
    )


@router.get("/gap-distribution")
def get_gap_distribution(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> GapTestResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n < 10:
        return GapTestResponse(
            total_drawings=n,
            expected_gap=10.0,
            avg_observed_gap=0.0,
            chi_square_statistic=0.0,
            p_value=1.0,
            significant=False,
            distribution=[],
        )

    p_appear = 6 / 60
    all_gaps: list[int] = []
    for col in range(60):
        positions = [
            t
            for t, d in enumerate(draws)
            if col + 1 in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6)
        ]
        gaps = [positions[i + 1] - positions[i] for i in range(len(positions) - 1)]
        all_gaps.extend(gaps)

    if not all_gaps:
        return GapTestResponse(
            total_drawings=n,
            expected_gap=10.0,
            avg_observed_gap=0.0,
            chi_square_statistic=0.0,
            p_value=1.0,
            significant=False,
            distribution=[],
        )

    bins = [(1, 5), (6, 10), (11, 15), (16, 20), (21, 30), (31, 50), (51, 9999)]
    labels = ["1–5", "6–10", "11–15", "16–20", "21–30", "31–50", "51+"]
    total_gaps = len(all_gaps)

    observed_counts = []
    expected_counts = []
    for lo, hi in bins:
        obs = sum(1 for g in all_gaps if lo <= g <= hi)
        # geometric CDF: P(lo <= G <= hi) = sum_{k=lo}^{min(hi,n)} (1-p)^(k-1)*p
        hi_actual = min(hi, n)
        exp_p = sum(
            (1 - p_appear) ** (k - 1) * p_appear for k in range(lo, hi_actual + 1)
        )
        observed_counts.append(obs)
        expected_counts.append(exp_p * total_gaps)

    obs_arr = np.array(observed_counts, dtype=float)
    exp_arr = np.array(expected_counts, dtype=float)
    exp_arr = np.where(exp_arr < 0.5, 0.5, exp_arr)
    # Normalize so sums agree (required by scipy chisquare)
    exp_arr = exp_arr / exp_arr.sum() * obs_arr.sum()
    chi2_stat, chi2_p = stats.chisquare(obs_arr, f_exp=exp_arr)

    distribution = [
        GapBucket(
            label=labels[i],
            observed=observed_counts[i],
            expected=round(expected_counts[i], 2),
        )
        for i in range(len(bins))
    ]

    return GapTestResponse(
        total_drawings=n,
        expected_gap=round(1 / p_appear, 1),
        avg_observed_gap=round(float(np.mean(all_gaps)), 2),
        chi_square_statistic=round(float(chi2_stat), 4),
        p_value=round(float(chi2_p), 4),
        significant=bool(chi2_p < 0.05),
        distribution=distribution,
    )


@router.get("/pair-bias")
def get_pair_bias(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> PairBiasResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.all()
    n = len(draws)

    if n < 10:
        return PairBiasResponse(
            total_drawings=n,
            expected_per_pair=0.0,
            chi_square_statistic=0.0,
            p_value=1.0,
            significant=False,
            top_above=[],
            top_below=[],
        )

    pair_counts: Counter = Counter()
    for d in draws:
        nums = sorted([d.n1, d.n2, d.n3, d.n4, d.n5, d.n6])
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                pair_counts[(nums[i], nums[j])] += 1

    # P(pair i,j both drawn) = C(58,4)/C(60,6) = 6*5/(60*59)
    p_pair = 6 * 5 / (60 * 59)
    expected = n * p_pair
    std = (n * p_pair * (1 - p_pair)) ** 0.5

    all_pairs = [(i, j) for i in range(1, 61) for j in range(i + 1, 61)]
    observed_all = np.array([pair_counts.get(p, 0) for p in all_pairs], dtype=float)
    expected_all = np.full(len(all_pairs), expected)

    chi2_stat, chi2_p = stats.chisquare(observed_all, f_exp=expected_all)

    items = [
        PairBiasItem(
            n1=p[0],
            n2=p[1],
            observed=int(pair_counts.get(p, 0)),
            expected=round(expected, 2),
            z_score=round((pair_counts.get(p, 0) - expected) / std, 3)
            if std > 0
            else 0.0,
        )
        for p in all_pairs
    ]
    items_sorted = sorted(items, key=lambda x: x.z_score, reverse=True)

    return PairBiasResponse(
        total_drawings=n,
        expected_per_pair=round(expected, 2),
        chi_square_statistic=round(float(chi2_stat), 4),
        p_value=round(float(chi2_p), 4),
        significant=bool(chi2_p < 0.05),
        top_above=items_sorted[:5],
        top_below=items_sorted[-5:][::-1],
    )


@router.get("/anderson-darling")
def get_anderson_darling(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> AndersonDarlingResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.all()
    n = len(draws)

    if n < 10:
        return AndersonDarlingResponse(
            total_drawings=n,
            statistic=0.0,
            critical_value_5pct=0.0,
            significant=False,
        )

    counts_map: Counter = Counter()
    for d in draws:
        for num in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            counts_map[num] += 1

    total_picks = n * 6
    expected = total_picks / 60
    std = (total_picks * (1 / 60) * (59 / 60)) ** 0.5
    counts = np.array([counts_map.get(i, 0) for i in range(1, 61)], dtype=float)
    z_scores = (counts - expected) / std

    ad_result = stats.anderson(z_scores, dist="norm")
    # critical values are at 15%, 10%, 5%, 2.5%, 1% — index 2 = 5%
    critical_5pct = float(ad_result.critical_values[2])

    return AndersonDarlingResponse(
        total_drawings=n,
        statistic=round(float(ad_result.statistic), 4),
        critical_value_5pct=round(critical_5pct, 4),
        significant=bool(ad_result.statistic > critical_5pct),
    )


@router.get("/ljung-box")
def get_ljung_box(
    db: Annotated[Session, Depends(get_db)],
    max_lag: Annotated[int, Query(ge=1, le=50)] = 20,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> LjungBoxResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n <= max_lag + 5:
        return LjungBoxResponse(
            total_drawings=n,
            max_lag=max_lag,
            statistic=0.0,
            p_value=1.0,
            significant=False,
            significant_count=0,
        )

    binary = np.zeros((n, 60), dtype=np.float32)
    for t, d in enumerate(draws):
        for num in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            binary[t, num - 1] = 1.0

    lb_stats, sig_count = [], 0
    for col in range(60):
        series = binary[:, col]
        var = series.var()
        if var == 0:
            continue
        acf_vals = np.array(
            [
                float(c)
                if not np.isnan(c := np.corrcoef(series[:-k], series[k:])[0, 1])
                else 0.0
                for k in range(1, max_lag + 1)
            ]
        )
        lb = float(n * (n + 2) * np.sum(acf_vals**2 / (n - np.arange(1, max_lag + 1))))
        lb_stats.append(lb)
        p = float(1 - stats.chi2.cdf(lb, df=max_lag))
        if p < 0.05:
            sig_count += 1

    if not lb_stats:
        return LjungBoxResponse(
            total_drawings=n,
            max_lag=max_lag,
            statistic=0.0,
            p_value=1.0,
            significant=False,
            significant_count=0,
        )

    avg_lb = float(np.mean(lb_stats))
    avg_p = float(1 - stats.chi2.cdf(avg_lb, df=max_lag))

    return LjungBoxResponse(
        total_drawings=n,
        max_lag=max_lag,
        statistic=round(avg_lb, 4),
        p_value=round(avg_p, 4),
        significant=sig_count > 3,
        significant_count=sig_count,
    )


@router.get("/markov-chain")
def get_markov_chain(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> MarkovChainResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n < 10:
        return MarkovChainResponse(
            total_drawings=n,
            expected_transition_rate=0.1,
            chi_square_statistic=0.0,
            p_value=1.0,
            significant=False,
            top_above=[],
            top_below=[],
        )

    transition_counts: Counter = Counter()
    for i in range(n - 1):
        nums_t = {
            draws[i].n1,
            draws[i].n2,
            draws[i].n3,
            draws[i].n4,
            draws[i].n5,
            draws[i].n6,
        }
        nums_t1 = {
            draws[i + 1].n1,
            draws[i + 1].n2,
            draws[i + 1].n3,
            draws[i + 1].n4,
            draws[i + 1].n5,
            draws[i + 1].n6,
        }
        for src in nums_t:
            for dst in nums_t1:
                transition_counts[(src, dst)] += 1

    all_pairs = [(i, j) for i in range(1, 61) for j in range(1, 61) if i != j]
    observed_all = np.array(
        [transition_counts.get(p, 0) for p in all_pairs], dtype=float
    )
    expected_per_pair = float(observed_all.sum()) / len(all_pairs)
    expected_all = np.full(len(all_pairs), expected_per_pair)
    obs_std = float(observed_all.std()) if observed_all.std() > 0 else 1.0
    chi2_stat, chi2_p = stats.chisquare(observed_all, f_exp=expected_all)

    items = [
        MarkovTransitionItem(
            from_number=p[0],
            to_number=p[1],
            observed_count=int(transition_counts.get(p, 0)),
            expected_count=round(expected_per_pair, 2),
            z_score=round(
                (transition_counts.get(p, 0) - expected_per_pair) / obs_std, 3
            ),
        )
        for p in all_pairs
    ]
    items_sorted = sorted(items, key=lambda x: x.z_score, reverse=True)

    return MarkovChainResponse(
        total_drawings=n,
        expected_transition_rate=round(6 / 60, 4),
        chi_square_statistic=round(float(chi2_stat), 4),
        p_value=round(float(chi2_p), 4),
        significant=bool(chi2_p < 0.05),
        top_above=items_sorted[:5],
        top_below=items_sorted[-5:][::-1],
    )


@router.get("/spectral")
def get_spectral(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> SpectralResponse:
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    draws = q.order_by(Drawing.drawing_number).all()
    n = len(draws)

    if n < 20:
        return SpectralResponse(
            total_drawings=n,
            dominant_period=0.0,
            noise_floor=0.0,
            spectrum=[],
        )

    binary = np.zeros((n, 60), dtype=np.float32)
    for t, d in enumerate(draws):
        for num in (d.n1, d.n2, d.n3, d.n4, d.n5, d.n6):
            binary[t, num - 1] = 1.0

    # Average power spectrum across all 60 numbers
    fft_len = n
    freqs = np.fft.rfftfreq(fft_len)
    avg_power = np.zeros(len(freqs), dtype=np.float64)
    for col in range(60):
        series = binary[:, col] - binary[:, col].mean()
        power = np.abs(np.fft.rfft(series, n=fft_len)) ** 2
        avg_power += power
    avg_power /= 60

    # Exclude DC component (freq=0)
    freqs = freqs[1:]
    avg_power = avg_power[1:]

    noise_floor = float(np.median(avg_power))
    dominant_idx = int(np.argmax(avg_power))
    dominant_freq = float(freqs[dominant_idx])
    dominant_period = round(1 / dominant_freq, 1) if dominant_freq > 0 else 0.0

    # Sample spectrum: take up to 100 points (evenly spaced up to period=2)
    max_period = min(n // 2, 200)
    valid = (freqs > 0) & (freqs <= 0.5) & (1 / freqs <= max_period)
    f_sel = freqs[valid]
    p_sel = avg_power[valid]

    # Downsample to ~80 points for the chart
    step = max(1, len(f_sel) // 80)
    spectrum = [
        SpectralPoint(
            period=round(float(1 / f_sel[i]), 1),
            power=round(float(p_sel[i]), 4),
        )
        for i in range(0, len(f_sel), step)
    ]
    spectrum.sort(key=lambda x: x.period)

    return SpectralResponse(
        total_drawings=n,
        dominant_period=dominant_period,
        noise_floor=round(noise_floor, 4),
        spectrum=spectrum,
    )
