# Feature Spec — Statistical Indicators

**Status:** in progress — static indicators done; temporal page pending

Reference document for the 13 statistical analyses on `/analises/estatisticas`.
Use this as the source of truth when implementing the temporal page (`/analises/temporal`).

---

## Architecture

All endpoints live in `backend/app/routers/statistics.py`.
All accept optional `date_from` / `date_to` query params (ISO date strings).
All use `scipy` + `numpy` for computation.

The binary matrix pattern — `binary[t, n-1] = 1 if number n appeared in draw t` — is the shared input for most time-series analyses (autocorrelation, Ljung-Box, Hurst, Runs, FFT).

---

## Group 1 — Uniformidade

### Chi-square (`GET /analytics/statistics`)
**Measures:** whether the 60 numbers appear with equal frequency across all draws.
**Method:** `scipy.stats.chisquare(observed_counts, f_exp=[expected]*60)` with df=59.
**Key output:** `chi_square.statistic`, `chi_square.p_value`, `chi_square.significant` (p < 0.05).
**Temporal:** plot rolling chi-square p-value over time — reveals *when* the distribution shifted, not just *whether*.
**Note:** Shannon Entropy is the temporal complement — same question, different metric, better suited for time windows.

### Kolmogorov-Smirnov (`GET /analytics/statistics`)
**Measures:** whether the z-scores of 60 number frequencies follow a standard normal distribution.
**Method:** `scipy.stats.kstest(z_scores, "norm")`.
**Key output:** `ks_test.statistic`, `ks_test.p_value`, `ks_test.significant`.
**Temporal:** less useful than chi-square for rolling windows (same question, less intuitive).

### Anderson-Darling (`GET /analytics/anderson-darling`)
**Measures:** same as KS but more sensitive in the tails.
**Method:** `scipy.stats.anderson(z_scores, dist="norm")`. Significant if `statistic > critical_values[2]` (5% level).
**Key output:** `statistic`, `critical_value_5pct`, `significant`.
**Temporal:** can replace or complement KS in rolling windows.

### Desvios por número (part of `GET /analytics/statistics`)
**Measures:** per-number z-score — how many standard deviations each number's frequency is from the expected.
**Method:** `z = (count - expected) / sqrt(total_picks * (1/60) * (59/60))`.
**Key output:** `per_number[].z_score`. Significant threshold: |z| > 2.
**Temporal:** could show a heatmap of z-scores per number over time windows.

### Bootstrap (`GET /analytics/bootstrap`)
**Measures:** 95% confidence interval for each number's frequency via resampling.
**Method:** 1,000 bootstrap resamples with replacement; `np.percentile(resampled, [2.5, 97.5])`. Uses `np.random.default_rng()` (intentionally unseeded).
**Key output:** `items[].ci_low`, `items[].ci_high`, `items[].expected_within_ci`, `within_ci_count`.
**Params:** `n_resamples` (100–5000, default 1000).
**Temporal:** CI width per window — narrower = more data = more confident. Can show whether expected (10%) stays inside CI over time.

---

## Group 2 — Dependência temporal

### Autocorrelação (`GET /analytics/autocorrelation`)
**Measures:** for each lag k (1 to max_lag), the average correlation between number presence at draw t and draw t+k, across all 60 binary series.
**Method:** vectorized Pearson correlation per lag per column, then average over valid columns.
**Key output:** `acf[].lag`, `acf[].autocorrelation`, `ci_bound` (= 1.96/√n).
**Params:** `max_lag` (1–50, default 20).
**Temporal:** plot ACF at lag=1 or lag=2 over rolling windows — detects if short-term serial dependence appears in specific periods.

### Ljung-Box (`GET /analytics/ljung-box`)
**Measures:** joint test of serial correlation across all lags simultaneously. More rigorous than per-lag autocorrelation.
**Method:** `LB = n(n+2) * Σ r_k² / (n-k)` for k=1..max_lag, compared against χ²(max_lag).
**Key output:** `statistic`, `p_value`, `significant`, `significant_count` (how many of 60 numbers have significant LB).
**Params:** `max_lag` (1–50, default 20).
**Temporal:** rolling LB p-value — drops when serial dependence appears in a window.
**Note:** NaN guard applied to `np.corrcoef` for low-variance series.

### Hurst Exponent (`GET /analytics/hurst`)
**Measures:** long-range memory in the binary series of each number. H ≈ 0.5 = random, H > 0.55 = persistence, H < 0.45 = anti-persistence.
**Method:** R/S analysis with lags at n/2, n/4, n/8, n/16; slope of log(R/S) vs log(lag) via `np.polyfit`.
**Key output:** `hurst_exponent` (mean across 60 numbers), `interpretation`, `min_drawings_warning` (true when n < 500).
**Temporal:** rolling Hurst — should stay near 0.5 for a fair lottery; deviations signal regime changes.
**Warning:** unreliable with fewer than ~500 draws per window.

### Runs Test (`GET /analytics/runs-test`)
**Measures:** whether sequences of consecutive appearances/absences of each number are random (Wald-Wolfowitz test).
**Method:** counts runs R, computes E[R] and Var[R] analytically, derives Z = (R - E[R]) / √Var[R], p-value from N(0,1). Averaged across 60 numbers.
**Key output:** `avg_z_statistic`, `avg_p_value`, `significant_count`, `significant` (significant_count > 3).
**Temporal:** rolling significant_count — how many numbers show non-random run structure in each window.

---

## Group 3 — Estrutura e padrões

### Gap Distribution (`GET /analytics/gap-distribution`)
**Measures:** whether the gaps between appearances of each number follow a geometric distribution (p=0.1, expected gap=10).
**Method:** collects all inter-appearance gaps for all 60 numbers; bins into 7 buckets (1–5, 6–10, ..., 51+); `scipy.stats.chisquare` against geometric CDF.
**Key output:** `avg_observed_gap`, `expected_gap` (10.0), `chi_square_statistic`, `p_value`, `significant`, `distribution[]`.
**Temporal:** rolling avg_observed_gap — should hover near 10; deviations indicate clustering of appearances.

### Viés de Pares (`GET /analytics/pair-bias`)
**Measures:** whether any pair of numbers within the same draw appears together more or less than expected.
**Method:** counts all C(6,2)=15 pairs per draw across 1,770 possible pairs; `chisquare` against uniform expected. Z-score per pair: (obs - expected) / std.
**Key output:** `expected_per_pair`, `chi_square_statistic`, `p_value`, `significant`, `top_above[]`, `top_below[]`.
**Temporal:** rolling chi-square on pairs — can detect if specific pairs become more common in certain periods.

### Cadeia de Markov (`GET /analytics/markov-chain`)
**Measures:** whether transitions between numbers in consecutive draws are uniformly distributed.
**Method:** counts all 6×6=36 ordered (src, dst) transitions per consecutive draw pair across 3,540 possible pairs. Tests uniformity (not absolute frequency) using sample mean as expected.
**Key output:** `expected_transition_rate` (~0.1), `chi_square_statistic`, `p_value`, `significant`, `top_above[]`, `top_below[]`.
**⚠️ Methodological note:** the global chi-square may be inflated because the 36 transitions within each draw pair are correlated (same source draw). The per-pair z-scores are more reliable than the global p-value. A significant result here should be verified against the individual z-scores — true signal requires multiple pairs with |z| > 3–4.
**Temporal:** the top transition pairs are more informative for rolling windows than the global test.

---

## Group 4 — Espectral

### Análise Espectral (`GET /analytics/spectral`)
**Measures:** whether any frequency (period) dominates in the time series of each number's appearances, suggesting cyclic behaviour.
**Method:** `np.fft.rfft` on each of the 60 binary series (demeaned); average power spectrum across all numbers; noise floor = median power.
**Key output:** `dominant_period` (in draws), `noise_floor`, `spectrum[]` (~80 sampled points with `period` and `power`).
**Temporal:** the rolling spectral analysis would detect if a period becomes dominant in a specific window — the most natural use of this metric.
**Significance heuristic (frontend):** `power > noise_floor * 3` for at least one point.

---

## Synthesis card (frontend only)

Computed entirely on the frontend from the 13 loaded states.
Shows per-test significance badges (✓ ok / ! desvio / · loading) and a global count.
Color thresholds: 0 significant = green, 1–2 = amber, 3+ = red.
Updates in real time as each endpoint finishes loading.

---

## Temporal page — implementation notes

The temporal page (`/analises/temporal`) will use a single endpoint `GET /analytics/rolling-stats?window=N&step=S` that iterates through draws chronologically and computes a subset of these indicators per window:

| Indicator | Rolling version |
|---|---|
| Chi-square | p-value per window → line chart |
| Shannon Entropy | entropy per window → line chart (replaces KS/AD in temporal context) |
| Autocorrelation lag-1 | average r₁ per window → line chart |
| Hurst | H per window (skip if window < 500) |
| Monte Carlo band | simulate N random lotteries per window; show if real distribution is inside/outside the band |

Backtest and changepoint detection also live on this page — see milestone M8 pending section.
