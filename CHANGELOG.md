# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow the milestones defined in `docs/milestones.md`.

---

## [Unreleased]

### Added — Statistics page (`/analises/estatisticas`) — M8 in progress
- `GET /analytics/statistics` — chi-square and Kolmogorov-Smirnov uniformity tests with per-number z-score chart; supports `date_from`/`date_to` filters
- `GET /analytics/bootstrap` — 95% confidence intervals via 1,000 bootstrap resamples; per-number IC with inside/outside band coloring; supports date filter
- `GET /analytics/autocorrelation` — average serial correlation across all 60 binary number series per lag (1–20); ±1.96/√n confidence band; supports date filter
- `GET /analytics/hurst` — Hurst exponent via R/S analysis; warns when fewer than 500 draws in window; supports date filter
- `GET /analytics/runs-test` — Wald-Wolfowitz runs test averaged across all 60 number series; reports significant count; supports date filter
- `GET /analytics/gap-distribution` — chi-square test of inter-appearance gaps vs geometric distribution (p=0.1); 7-bucket histogram; supports date filter
- `GET /analytics/pair-bias` — chi-square on all 1,770 pair co-occurrences; top 5 pairs above/below expected with z-scores; supports date filter
- `GET /analytics/anderson-darling` — Anderson-Darling test on z-scores vs normal; more sensitive than KS in the tails; supports date filter
- `GET /analytics/ljung-box` — Ljung-Box joint serial correlation test across all lags simultaneously; supports date filter
- `GET /analytics/markov-chain` — transition frequency between consecutive draws for all 3,540 ordered pairs; top 5 above/below expected; supports date filter
- `GET /analytics/spectral` — average FFT power spectrum across all 60 number series; dominant period and noise floor; supports date filter
- `scipy>=1.13.0` and `numpy>=1.26.0` added to `backend/requirements.txt`
- Statistics page with 13 analysis sections organized in 4 groups (Uniformidade, Dependência temporal, Estrutura e padrões, Espectral)
- Synthesis card at top of statistics page: real-time summary of how many analyses detected deviation, with per-test badges (✓ / ! / loading)
- `DateFilter` shared component with preset buttons (Ano atual, 12m, 24m, 36m, 48m) — applied to Frequência, Padrões, and Estatísticas pages
- 83 backend tests for all statistics endpoints

### Added — Prêmios & Acúmulos (`/analises/premios`) — M5
- `GET /analytics/prizes` extended: accumulation cycle stats, jackpot milestones, record prizes, and prize-tier fields added
- Accumulation cycle section: duration distribution chart, KPI cards, longest cycle detail
- Jackpot milestones table: counts of draws where individual prize, sena total, and distributed prize (sena+quina+quadra) exceeded R$ 50M / 100M / 200M
- Multi-series log-scale prize scatter chart: sena individual, sena total, quina total, quadra total with winner count in tooltip
- `AnalysisPageLayout` with sticky section navigation applied to Prêmios page

### Added — Padrões (`/analises/padroes`) — M4
- `GET /analytics/patterns` — 13 draw-level pattern metrics with observed vs hypergeometric expected distributions; supports `date_from`/`date_to` filters
- Patterns page: soma (bell curve + ±1σ/±2σ lines), paridade, baixo/alto, espaçamento, amplitude, consecutivos, repetições, primos, fibonacci, múltiplos de 3 e 5, quartis, paridade da soma
- `PatternChart` component with three variants: default (horizontal reference line), soma (vertical σ lines), bars (horizontal rows with delta coloring)
- `AnalysisPageLayout` / `AnalysisSection` shared components with IntersectionObserver-based active section tracking

### Added — Frequência (`/analises/frequencia`) — M3
- `GET /analytics/frequency` — number appearance counts with recent-window trend, drought stats, and global baseline; filterable by date range
- `GET /analytics/prizes` — full prize history for jackpot timeline chart
- `GET /analytics/cooccurrence` — most and least frequent number pairs
- Frequency grid: 1–60 heatmap with trend badges, rank toggle, configurable window (50/100/200/500)
- Frequency histogram, by-decade and by-unit distribution, top/bottom 10 ranking, drought table, co-occurrence table

### Changed
- `GET /analytics/prizes` extended with accumulation stats, milestones, record prizes, and prize-tier fields (prize_5/winners_5/prize_4/winners_4) per point
- Prize history chart rewritten as multi-series log-scale scatter replacing previous area chart
- Sidebar navigation updated: Estatísticas group now has live "Uniformidade" link; Temporal link marked "em breve"
- Chi-square section hints user toward the future temporal/rolling window page for Shannon Entropy

### Performance
- Pattern expected distributions (sum, amplitude, all hypergeometric variants) precomputed at module import time — zero recalculation per request

### Tests
- 66 tests in `backend/tests/test_statistics.py` covering all 7 statistics endpoints with date filter, empty DB, and field structure assertions
- CI enforces 80% coverage floor (`--cov-fail-under=80`)

---

## [0.3.0] - 2026-06-02

### Added
- `GET /analytics/patterns` — 12 draw-level pattern metrics (sum, parity, low/high, spacing, amplitude, consecutives, repeats, primes, fibonacci, mult3, mult5, quartiles, sum_parity)
- Patterns analysis page (`/analises/padroes`) with 12 sections and date filter
- PatternChart component with three rendering variants (default, soma/bell-curve, horizontal bars)
- Shared AnalysisPageLayout with sticky section navigation and IntersectionObserver active tracking
- Accumulation cycles section on prizes page: cycle distribution chart, KPI cards, longest cycle detail
- Jackpot milestones table: R$ 50M / 100M / 200M crossing counts for individual, sena total, and distributed prize
- Multi-series prize chart: sena individual, sena total, quina total, quadra total as log-scale scatter
- `pytest-cov` coverage gate at 80% in CI

### Changed
- `GET /analytics/prizes` extended with accumulation stats, milestones, and prize-tier fields
- Prize chart rewritten from area to multi-series log-scale scatter

### Tests
- 57 backend tests across drawings, analytics, and patterns endpoints

---

## [0.1.0] - 2026-05-30

### Added
- `ingest_mega_sena.py`: full ingestion pipeline with incremental mode, prize tiers (6/5/4 matches), financials, and 3 draw metadata fields
- `export.py`: regenerates trusted CSV from raw JSON artifacts
- `seed_db.py`: bulk-loads database from trusted CSV; supports `--truncate` for full reseed
- 45-test suite covering parse, CSV helpers, and seed logic
- FastAPI backend: `GET /drawings` (pagination, sorting, 5 filter params) and `GET /drawings/{drawing_number}`
- `GET /health` endpoint
- 20-test suite for all backend endpoints
- Next.js frontend with DrawingsTable (TanStack Table v8), DrawingDrawer, FilterBar components
- Display toggles: show/hide winners, abbreviate values, total vs per-winner prize view
