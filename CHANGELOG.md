# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow the milestones defined in `docs/milestones.md`.

---

## [Unreleased]

### Added
- `GET /analytics/frequency` — number appearance counts with recent-window trend (▲▼), drought stats, and global baseline; filterable by date range
- `GET /analytics/prizes` — full prize history ordered by date for jackpot timeline chart
- `GET /analytics/cooccurrence` — most and least frequent number pairs across all drawings
- 18-test suite for all analytics endpoints
- `/analises` page with sidebar navigation (Números, Prêmios, Padrões)
- Frequency grid: 1–60 heatmap with trend badges, rank toggle, and configurable trend window (50/100/200/500)
- Frequency histogram: bar chart colored by above/below average, with red reference line
- Frequency by decade and by unit side by side with delta vs expected distribution
- Frequency ranking: top/bottom 10 with mini progress bars
- Drought table: top 10 numbers in longest current drought with historical max and last seen date
- Co-occurrence table: most and least frequent pairs with rank
- `/analises/premios`: jackpot history area chart with winner markers
- Sticky filter bar with bottom border separator
- Global navbar with Concursos, Análises, Meu jogo (em breve)
- `GET /analytics/patterns` — 13 draw-level pattern metrics with observed vs theoretical expected distributions
- `/analises/padroes`: patterns page with per-section navigation; charts for sum (bell curve + σ lines), parity, low/high split, spacing, amplitude, consecutives, repeats, primes, fibonacci, multiples of 3 and 5, quartiles, and sum parity
- Shared `AnalysisPageLayout` component with sticky section navigation (used by frequency and patterns pages)
- `PatternChart` component with three variants: default (horizontal reference line), soma (vertical ±σ lines), and bars (horizontal bar rows with delta colouring)
- Accumulation cycle analysis in `/analises/premios`: cycle duration distribution, records, and longest-cycle details
- Jackpot milestones table: counts of draws where individual prize, sena total, and full distributed prize exceeded R$ 50M / 100M / 200M
- Multi-series log-scale prize chart: sena individual, sena total, quina total, and quadra total as scatter points

### Changed
- `GET /analytics/prizes` extended: accumulation stats, milestones, record prizes, and prize-tier fields (prize_5/winners_5/prize_4/winners_4) added to each point
- Prize history chart rewritten as a multi-series log-scale scatter chart replacing the previous area chart

### Performance
- Pattern expected distributions (sum, amplitude, all hypergeometric variants) precomputed at import time — zero recalculation per request

### Tests
- 19 new tests for `GET /analytics/patterns` and `GET /analytics/prizes` extended fields (57 total)

## [0.1.0] - 2026-05-30

### Added
- `ingest_mega_sena.py`: full ingestion pipeline with incremental mode (CSV as source of truth), prize tiers (6/5/4 matches), financials, and 3 draw metadata fields (`draw_order`, `is_special`, `milestone_draw_number`)
- `export.py`: regenerates trusted CSV from raw JSON artifacts (offline, no API call)
- `seed_db.py`: bulk-loads database from trusted CSV; supports `--truncate` for full reseed
- 45-test suite covering parse, CSV helpers, and seed logic
- Local setup instructions and ingestion script reference in README
- ADR-002 updated with per-environment ingestion pipeline strategy
- FastAPI backend: `GET /drawings` (pagination, sorting, 5 filter params) and `GET /drawings/{drawing_number}` endpoints
- `GET /health` endpoint for liveness checks
- 20-test suite for all backend endpoints (pagination, sort, filters, 404)
- Next.js frontend with `DrawingsTable` (TanStack Table v8), `DrawingDrawer`, and `FilterBar` components
- `FilterBar`: draw number range, date range, and roll-over filters with clear button
- `DrawingDrawer`: slide-in detail panel showing numbers, prize tiers, financials, and draw order
- Prize columns for 6, 5 and 4 acertos with winner count badges
- Display toggles: show/hide winners, abbreviate values (M / mil), total vs per-winner prize view
- Prize sort uses `prize_6` (per-winner jackpot) instead of `total_prize` (0 for accumulated draws)

