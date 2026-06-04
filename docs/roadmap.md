# Roadmap

## Purpose
Keep the project roadmap clear and adaptable while preserving the main delivery logic.

## Vision
Build a platform for statistical lottery analysis with a data-first, explainability-first approach. The roadmap should reflect iterative delivery and support shifting priorities.

## Product Pipeline

The platform is built around a deliberate progression of five layers. Each layer depends on the previous and adds analytical depth:

```
1. INDICATORS (M8)
   Build statistical tools that describe each draw and the full history.
   These become the filters and scoring criteria for everything downstream.
   → chi-square, bootstrap, autocorrelation, Hurst, FFT, Markov, etc.

2. TEMPORAL ANALYSIS (M8 — temporal page)
   Apply those indicators over sliding time windows to find periods where
   the distribution deviated from the expected random baseline.
   Correlate detected deviation periods with what happened in subsequent draws.
   → rolling window, Shannon entropy, changepoint detection

3. BACKTEST (M8 — temporal page)
   Validate the temporal findings: if a deviation was detected in period T,
   did any frequency-based strategy (hot numbers, CI outliers) actually
   predict what happened in draws T+1..T+k?
   This is the honest empirical test — expected result for a fair lottery
   is no predictive signal, but the methodology is scientifically valid.
   → strategy hit rate vs random baseline across all draws

4. GAME GENERATOR + PROBABILITY CALCULATOR (M13)
   Use the active indicators and user-selected filters to generate combinations
   that match observed statistical patterns.
   Show in real time how many of the 50,063,860 possible combinations satisfy
   the selected constraints, and what the implied win probability is.
   Coverage bets (7–10 numbers) are factored into the probability display.
   → constrained generation, rejection sampling, real-time probability counter

5. MACHINE LEARNING COMPLEMENT (M9, feeds into M13)
   Group draws into statistical regimes (clusters) and identify anomalous draws.
   The cluster a draw belongs to informs which indicator thresholds are "normal"
   for that regime — the generator can use regime context to tighten or loosen
   constraints and score generated combinations against the current regime profile.
   → KMeans/HDBSCAN clustering, PCA, Isolation Forest, changepoint, ARIMA
```

**Note on ordering:** M9 (ML) appears before M13 (Generator) in the milestone list for technical reasons (feature vectors must exist before clustering), but conceptually ML is a complement that enhances the generator — not a standalone feature. The generator works without ML; ML makes it richer.

---

## Phases

### Phase 1: Foundation ✓
- ingest Mega-Sena historical data
- implement data model and storage
- build basic analytics pipeline
- launch results dashboard with core lottery metrics
- establish automatic update process (raw JSONs → trusted CSV → SQLite)

### Phase 2: Analytics ✓
- frequency analysis: heatmap, histogram, drought table, co-occurrence
- pattern analysis: 13 draw-level metrics vs theoretical expected distributions
- prize history: multi-series log-scale chart, accumulation cycles, jackpot milestones
- statistical tests: chi-square, KS, bootstrap, autocorrelation, Hurst, runs test, gap distribution, pair bias
- shared UX: date filter with quick presets, sticky section navigation across all analysis pages

### Phase 2.5: Statistical Indicators ✓
- 13 analyses on `/analises/estatisticas`: chi-square, KS, Anderson-Darling, bootstrap, autocorrelation, Ljung-Box, Hurst, runs test, gap distribution, pair bias, Markov chain, spectral analysis (FFT)
- Synthesis card summarizing all 13 tests in real time
- See `docs/features/statistics.md` for full implementation reference

### Phase 3: Temporal & Predictive (in progress)
- rolling window analysis: how statistical indicators evolve over time
- Monte Carlo simulation: compare real distribution against simulated random lotteries per time window
- backtest: test whether frequency-based strategies (hot/cold numbers, CI outliers) show any predictive signal vs random baseline
- Shannon Entropy: temporal counterpart of chi-square — reveals *when* the distribution shifted

### Phase 4: Machine Learning
- feature vectors: fingerprint each drawing (sum, parity, decades, consecutive, primes, spacing)
- KMeans / HDBSCAN clustering: group drawings into regimes
- PCA: 2D/3D cluster visualization
- Isolation Forest + Autoencoder: flag statistically rare or anomalous drawings
- co-occurrence graph: community detection across 60 numbers
- changepoint detection: identify moments where lottery behaviour changed
- ARIMA / Prophet: jackpot value forecasting

### Phase 5: Game Tools
- Meu Jogo: balance score, rarity score, co-occurrence analysis for a submitted combination
- Game Generator: rejection-sampling generator constrained by pattern filters; scoring engine vs historical distributions
- Probability Calculator: real-time count of valid combinations given active constraints (C(60,6) = 50,063,860 baseline); coverage bet calculator for 7–10 number plays

### Phase 6: AI Explanations
- textual insights for individual drawings
- metric score explanations
- cluster/regime narratives
- factual and non-predictive language throughout

### Phase 7: Product & Distribution
- premium UX: heatmaps, timelines, similarity views
- freemium/premium feature boundaries
- deploy to production (PostgreSQL + Railway/Render + Vercel)
- SEO, Open Graph, sitemap
- Google AdSense monetization

### Phase 8: Lottery Expansion
- add Quina, Lotofácil, Dupla Sena, and others
- abstract ingestion and feature pipeline for multiple games
- comparative analytics across lotteries

## Flexibility Guidelines
- prioritize modular doc updates over rewriting everything
- keep roadmap outcome-based, not implementation-locked
- allow shifts in priority between analytics, AI, and product discovery
