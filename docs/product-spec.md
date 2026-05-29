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

## User Stories

| As a... | I want to... | So that... |
|---------|-------------|------------|
| user | view historical Mega-Sena draw results | I can analyze past patterns |
| user | have results update automatically | I always have fresh data without manual effort |
| analyst | see base metrics (sum, entropy, even/odd) per drawing | I can compare drawings quantitatively |
| power user | see cluster and regime labels | I can observe statistical groupings over time |
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
