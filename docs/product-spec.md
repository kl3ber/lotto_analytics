# Product Spec — Lottery Analytics Platform

## Overview
A quantitative analysis platform for Brazilian lotteries with an initial focus on Mega-Sena.

**Goal:** transform historical draw results into metrics, scores, clusters, and statistical fingerprints — creating an experience similar to a quant terminal or analytical dashboard. Not a betting site. Not a prediction tool.

---

## Target Audience
- data analysts and quantitative enthusiasts
- users studying statistical patterns in lottery draws
- people who want to explore randomness metrics without prediction framing
- premium users looking for a technical analytics tool

---

## Product Logic — Five-Layer Pipeline

The platform is designed around a deliberate analytical progression. A user who follows it from start to finish goes from raw data to statistically-informed number generation:

1. **Indicators** — explore the statistical tools (frequency, uniformity, autocorrelation, etc.) and understand what the historical data looks like under each lens.
2. **Temporal analysis** — apply those indicators over sliding time windows to identify *when* the distribution deviated from the random baseline and whether deviations cluster around specific periods.
3. **Backtest** — test empirically whether any deviation signal from step 2 has ever predicted what happened in subsequent draws. This is the scientific honesty layer — for a fair lottery the expected result is no signal above chance.
4. **Game generator** — use the indicators as filters to generate combinations that match observed patterns, with a real-time probability counter showing how many of the 50M+ combinations satisfy the selected constraints.
5. **ML complement** — use clustering and regime detection to identify which "type" of draw the current period resembles, and use that context to tighten or loosen the generator's constraints automatically.

---

## User Stories

| As a... | I want to... | So that... |
|---------|-------------|------------|
| user | view historical Mega-Sena draw results | I can analyze past patterns |
| user | have results update automatically | I always have fresh data without manual effort |
| analyst | explore statistical indicators (chi-square, bootstrap, FFT, etc.) | I can characterize the draw distribution rigorously |
| analyst | apply date filters to any indicator | I can compare different time periods and detect regime changes |
| power user | see how statistical indicators evolve over rolling time windows | I can identify periods where the distribution shifted |
| power user | run a backtest of frequency-based strategies | I can verify empirically whether any signal is predictive |
| user | generate number combinations constrained by statistical filters | I can play numbers that match observed patterns |
| user | see the probability impact of each filter I apply | I understand the real-odds trade-off of each constraint |
| user | know how coverage bets (7–10 numbers) change my odds | I can make an informed decision about bet size vs cost |
| power user | see cluster and regime labels for draws | I can observe which statistical "type" each period belongs to |
| user | read explanations for metric scores | I understand what each score means without being a statistician |
| product owner | offer a premium tier | advanced analytics features can be monetized separately |

---

## MVP Scope

### Features
- ingest and store complete Mega-Sena historical results
- historical drawing lookup with sortable table
- basic metrics dashboard per drawing:
  - number frequency and delays
  - sum, range, even/odd count, low/high count
  - consecutive numbers
- automatic update for new drawings (scheduled)
- display of estimated next drawing date
- AI textual explanations for at least 3 metric scores

### MVP Acceptance Criteria
- [ ] Complete Mega-Sena history stored with no gaps
- [ ] New drawings ingested automatically without duplicates
- [ ] Basic metrics computed correctly for all historical drawings
- [ ] Dashboard table loads with sortable columns
- [ ] AI explanation available for at least one drawing
- [ ] Historical visualization for at least one metric

---

## Long-Term Vision

### Phase 2 — Analytics and ML
- full advanced metric suite (entropy, Hurst exponent, autocorrelation)
- drawing clustering with KMeans and HDBSCAN
- regime detection and labeling
- anomaly flagging
- cluster and regime timeline visualization

### Phase 3 — Premium Insights
- Monte Carlo simulations
- backtesting of metric-based strategies
- intelligent game generation based on cluster profiles
- advanced AI insights: anomaly explanations, regime narratives
- freemium/premium feature separation
- rich interactive dashboards (heatmaps, similarity views)

### Phase 4 — Expansion
- support for additional Brazilian lotteries (Lotofácil, Quina, etc.)
- unified cross-lottery analytics view

---

## Non-Functional Requirements
- modular, scalable architecture — adding a new lottery should not require redesigning the system
- repeatable pipelines — same input always produces the same metrics
- non-predictive language enforced everywhere — no implied prediction, ever
- premium technical visual experience — quant terminal aesthetic
- decoupled components — analytics engine independently testable without the web server

---

## Out of Scope
- real-time draw streaming
- user accounts / auth (deferred to Phase 3)
- mobile app
- number recommendation framed as prediction
