# Roadmap

## Purpose
Keep the project roadmap clear and adaptable while preserving the main delivery logic.

## Vision
Build a platform for statistical lottery analysis with a data-first, explainability-first approach. The roadmap should reflect iterative delivery and support shifting priorities.

## Phases
### Phase 1: Foundation
- ingest Mega-Sena historical data
- implement data model and storage
- build basic analytics pipeline
- launch a minimal dashboard with core lottery metrics
- establish automatic update process (local dev: raw JSONs → trusted CSV → SQLite)

### Phase 2: Analytics & ML
> **Infrastructure note:** migrate ingestion to PostgreSQL as primary store.
> The local dev pipeline (raw JSONs → CSV → SQLite) stays available as an alternative
> but the production path becomes: one-time historical seed via `seed_db.py` +
> incremental updates via `ingest_mega_sena.py` running on a cron (Tue/Thu/Sat).
> Raw JSON artifacts and `export.py` become optional, dev-only tooling.


- add feature engineering for randomness fingerprints
- implement clustering and regime detection
- add basic AI explanations for metrics
- support exploratory visualization for patterns
- introduce historical similarity comparisons

### Phase 3: Premium Insights
- advanced metrics: entropy, autocorrelation, Hurst
- Monte Carlo simulations and backtesting
- intelligent game generation engines
- richer dashboard components and heatmaps
- premium tier for advanced IA features

### Phase 4: Lottery Expansion
- add support for Quina, Lotofácil, Dupla Sena, and others
- abstract the ingestion and feature pipeline for multiple games
- add comparative analytics across lotteries

## Flexibility Guidelines
- prioritize modular doc updates over rewriting everything
- keep roadmap outcome-based, not implementation-locked
- allow shifts in priority between analytics, AI, and product discovery
