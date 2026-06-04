# Milestones

## Purpose
Define concrete milestones and checkpoints that can be updated without breaking the overall documentation.

## Milestone 1: Data Foundation
Status: done

- [x] set up repository and basic docs *(2026-05-29)*
- [x] ingest Mega-Sena historical results *(2026-05-29)*
- [x] store results in a stable database structure *(2026-05-29)*
- [x] verify data quality and raw source traceability *(2026-05-29)*

## Milestone 2: Results Dashboard
Status: done

- [x] build FastAPI backend with `GET /drawings` and `GET /drawings/{drawing_number}` endpoints *(2026-05-29)*
- [x] build Next.js frontend with drawings table (TanStack Table + shadcn/ui) *(2026-05-29)*
- [x] table shows drawing number, date, numbers, prize tiers (6/5/4 acertos), roll-over *(2026-05-29)*
- [x] pagination, sorting (draw_date, drawing_number, draw_sum, prize_6, total_collected) working *(2026-05-29)*
- [x] filters: draw number range, date range, roll-over flag *(2026-05-29)*
- [x] detail drawer: per-drawing full detail with prize tiers and financials *(2026-05-30)*
- [x] display toggles: show/hide winners, abbreviate values, total vs per-winner prize *(2026-05-30)*

## Milestone 3: Análises — Números & Prêmios
Status: done

- [x] add `/analises` page with sidebar navigation structure *(2026-05-30)*
- [x] `GET /analytics/frequency` endpoint — number appearance counts with trend, drought, and co-occurrence *(2026-05-30)*
- [x] `GET /analytics/prizes` and `GET /analytics/cooccurrence` endpoints *(2026-05-30)*
- [x] frequency grid: 1–60 heatmap with trend badges, rank toggle, configurable window *(2026-05-30)*
- [x] frequency histogram with average reference line and above/below coloring *(2026-05-30)*
- [x] frequency by decade and by unit side by side *(2026-05-30)*
- [x] frequency ranking top/bottom 10, drought table, co-occurrence table *(2026-05-30)*
- [x] jackpot history area chart with winner markers *(2026-05-30)*
- [x] `/jogo` page scaffold *(2026-05-30)*

---
## Page structure (current state)

```
/analises
  Frequência              (done — M3)
    ├ Números
    └ Co-ocorrências

  Padrões                 (done — M4)
    ├ Soma & Paridade
    ├ Baixos vs Altos
    ├ Amplitude & Espaçamento
    ├ Consecutivos & Repetições
    ├ Primos, Fibonacci, Múltiplos
    ├ Quartis
    └ Paridade da Soma

  Prêmios & Acúmulos      (done — M5)
    ├ Histórico (multi-series log-scale)
    ├ Ciclos de acúmulo
    └ Marcos do jackpot

  Estatísticas            (in progress — M8)
    ├ Chi-quadrado + KS   (done)
    ├ Bootstrap IC 95%    (done)
    ├ Autocorrelação      (done)
    ├ Hurst Exponent      (done)
    ├ Runs Test           (done)
    ├ Intervalos          (done)
    ├ Viés de Pares       (done)
    └ Temporal / Rolling Window + Backtest + Monte Carlo  (pending)

  Machine Learning        (pending — M9)
    ├ Clusters & Regimes
    ├ Anomalias
    └ Séries Temporais

/jogo                     (pending — M11, M13)
/numeros/[numero]         (pending — M15)
```

---

## Milestone 4: Análises — Padrões (/analises > Padrões)
Status: done

- [x] paridade: even/odd distribution per drawing and historical average *(2026-06-02)*
- [x] soma: histogram of draw sums with mean and ±1σ/±2σ reference lines *(2026-06-02)*
- [x] distância entre números: average spacing between the 6 drawn numbers (concentrated vs spread) *(2026-06-02)*
- [x] números baixos vs altos: proportion below/above 30, historically and by period *(2026-06-02)*
- [x] consecutivos: how often consecutive numbers appear together *(2026-06-02)*
- [x] repetições: numbers that repeated from the previous draw *(2026-06-02)*
- [x] números primos: how many primes appear per drawing on average *(2026-06-02)*
- [x] amplitude: range (max − min) distribution with theoretical expected curve *(2026-06-02)*
- [x] fibonacci: count of Fibonacci numbers per drawing *(2026-06-02)*
- [x] múltiplos de 3 e de 5: count per drawing *(2026-06-02)*
- [x] quartis: number pick distribution across Q1–Q4 *(2026-06-02)*
- [x] paridade da soma: % of total sum from even numbers, with mean and ±σ lines *(2026-06-02)*

## Milestone 5: Análises — Prêmios & Acúmulos (/analises > Prêmios & Acúmulos)
Status: done

- [x] duração dos acúmulos: how many draws each accumulation cycle lasts, distribution and records *(2026-06-02)*
- [x] jackpot milestones: how many times the prize exceeded 50M, 100M, 200M *(2026-06-02)*
- [x] prize value evolution: multi-series log-scale line chart (sena individual, sena total, quina total, quadra total) *(2026-06-02)*

## Milestone 6: Deploy & Infraestrutura
- migrate and validate backend with PostgreSQL
- deploy FastAPI + PostgreSQL to Railway or Render
- deploy Next.js frontend to Vercel
- configure production environment variables (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, CORS)
- populate production database via `seed_db.py`
- configure cron job for incremental ingestion (Tue/Thu/Sat)
- validate full end-to-end pipeline in production

## Milestone 7: Feature Vectors & Classificação
- define a fingerprint vector for each drawing (sum, parity, decades, consecutive, primes, spacing)
- generate derived metrics and scores; store in `drawing_metrics` table
- drawing type classification: cluster-based supervised labelled of drawing "types"
- validate feature consistency

## Milestone 7.5: Refactor — Patterns
Status: deferred — skipped to start M8 earlier; do before M9.
- **Backend**: break `get_patterns` into functions per metric group (sum, distribution, sequences, special sets); move calculation helpers to a separate module (`analytics/patterns.py`)
- **Frontend**: split `PatternChart` into distinct components: `BellChart` (soma/sum-parity variant), `BarChart` (default), `HorizontalBarsChart` (bars variant)
- **Frontend**: extract inline `labelFn` from `padroes/page.tsx` into named utility functions

## Milestone 8: Estatísticas Avançadas (/analises > Estatísticas)
Status: in progress

### Done
- [x] Chi-square + Kolmogorov-Smirnov: uniformity tests with per-number z-score chart *(2026-06-03)*
- [x] Bootstrap: 95% confidence intervals for observed frequencies *(2026-06-03)*
- [x] Autocorrelation: average serial correlation across all 60 number series per lag *(2026-06-03)*
- [x] Hurst Exponent: long-range memory detection via R/S analysis (warns when < 500 draws) *(2026-06-03)*
- [x] Runs Test (Wald-Wolfowitz): randomness of appearance/absence sequences per number *(2026-06-03)*
- [x] Gap Distribution: chi-square test of inter-appearance gaps vs geometric distribution *(2026-06-03)*
- [x] Pair Bias: chi-square on all 1,770 pair co-occurrences; top 5 above/below expected *(2026-06-03)*
- [x] Anderson-Darling: more sensitive alternative to KS test, detects tail deviations *(2026-06-03)*
- [x] Ljung-Box: joint test of serial correlation across all lags simultaneously *(2026-06-03)*
- [x] Markov Chain: transition frequency between consecutive draws for all 3,540 ordered pairs *(2026-06-03)*
- [x] Spectral Analysis (FFT): average power spectrum across all 60 number series to detect periodicity *(2026-06-03)*
- [x] Synthesis card: top-of-page summary showing how many of the 13 analyses detected deviation, with per-test badges updating in real time *(2026-06-03)*

### Pending
- Temporal analysis page (`/analises/temporal`) — rolling window + backtest + Monte Carlo; same chronological iteration infrastructure:
  - **Rolling window:** `GET /analytics/rolling-stats?window=N&step=S` — chi-square p-value, KS p-value, Shannon entropy per sliding window; line chart of how each indicator evolves over time; configurable window size (100, 200, 500); animated progress bar + chart skeleton while loading
  - **Monte Carlo:** per window, simulate N random lotteries and compare real distribution against the simulated band; configurable n_simulations (100–2000); more informative in temporal context than as a static snapshot
  - **Backtest:** for each draw T, use frequency data from 1..T-1 to select "hot" numbers; check hit rate vs random baseline; strategies: most frequent, least frequent, above IC upper bound, below IC lower bound
  - **Changepoint Detection:** identify moments in the draw history where the frequency distribution shifted significantly (e.g., machine change, rule change); use PELT algorithm or binary segmentation on the chi-square rolling statistic; highlight detected changepoints on the rolling window chart
  - **Note:** Shannon Entropy is the temporal counterpart of chi-square — the chi-square section on the statistics page already has a hint pointing users here. The backtest answers whether any of the statistical signals are actually predictive.

## Milestone 9: ML & Anomalias (/analises > Machine Learning)
- KMeans or HDBSCAN clustering: group drawings into regimes
- PCA: reduce feature vectors to 2D/3D for cluster visualization
- Isolation Forest: identify statistically rare drawings
- Autoencoder: flag drawings that deviate from learned normal pattern
- co-occurrence graph: 60 numbers as nodes, edges as co-occurrences, community detection
- ARIMA / Prophet: model frequency evolution and jackpot value over time
- Changepoint detection: identify moments where lottery behaviour changed
- Jackpot regression: estimate next prize value from accumulation history

## Milestone 10: AI Explanations
- generate textual insights for drawings
- explain score assignments for a subset of metrics
- provide summary narratives for clusters or regimes
- keep language factual and non-predictive

## Milestone 11: Análises — Meu Jogo (/jogo)
- balance score: even/odd, decade distribution, sum within most common range
- rarity score: how many times this exact or similar combination appeared historically
- per-number co-occurrence within the submitted game
- comparison with historical averages

## Milestone 12: Product Layer
- **Navigation & category reorganization:** review all sidebar groups, page names, and URL structure now that all analytical content exists; rename, merge, or split pages as needed; update `layout.tsx`, routes, and any cross-page links — do this pass only after M8–M11 are complete so the full picture is visible before making structural decisions
- **Milestone renumbering:** renumber and reorder all milestones to reflect the actual delivery sequence and product pipeline. Proposed new order (do not apply before temporal page is done):
  - M6 → estatísticas estáticas (current M8 done portion)
  - M7 → análise temporal + backtest (current M8 pending)
  - M8 → deploy & infraestrutura (current M6)
  - M9 → refactor geral — padrões + estatísticas (current M7.5 expanded)
  - M10 → meu jogo (current M11)
  - M11 → game generator + probability calculator (current M13)
  - M12 → ML & anomalias as generator complement (current M9)
  - M13 → AI explanations (current M10)
  - M14 → product layer + UX reorganization (this milestone, renumbered)
  - M15 → per-number profile (current M15)
  - M16 → monetização / AdSense (current M14)
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring

## Milestone 13: Game Generator (/jogo > Gerar)
Generate combinations that match observed statistical patterns from the patterns page.
- backend: constrained generator using rejection sampling — filters combinations by sum range, parity, amplitude, and special sets (primes, fibonacci, multiples)
- backend: scoring engine — rates each combination against the historical distributions (how close is its profile to the observed average)
- auto-relax logic: when constraints are too tight and yield no valid combinations, loosen them incrementally and inform the user
- frontend: configuration panel — user selects which criteria to respect (sum range, min/max parity, etc.)
- frontend: results panel — shows generated combination(s) with their scores per criterion
- wire up to existing pattern stats so score thresholds update automatically with new data

### Probability Calculator (part of the generator page)
Show in real time how many of the 50,063,860 total combinations (C(60,6)) satisfy the selected constraints, and what the implied win probability is.
- **Single-filter counts:** exact combinatorial formulas for parity, primes, fibonacci, multiples, quartiles
- **Combined filters:** Monte Carlo estimate — generate 200k random combinations, count those passing all active filters, report estimated fraction (±0.2% accuracy at 200k samples)
- **Coverage bets (7–10 numbers):** user selects how many numbers to pick (6–10); calculator shows C(n,6)/C(60,6) — e.g., 7 numbers = 7× better odds, 8 = 28×, 9 = 84×, 10 = 210×; also shows the equivalent number of simple bets (C(n,6)) and total cost
- **UI:** live counter that updates as filters are toggled — starts at "1 in 50,063,860" and decreases as constraints narrow the valid space; color-codes the probability improvement vs raw bet cost so user sees there is no free lunch in coverage bets

## Milestone 14: Monetization — Google AdSense
Prerequisites: site live in production (M6), domain configured, organic traffic established.
- add SEO basics: meta tags, Open Graph, sitemap.xml, robots.txt
- ensure Next.js pages are server-side rendered or statically generated for Google indexing
- register domain and configure DNS (if not already done in M6)
- apply for Google AdSense once consistent organic traffic is reached (~100 visits/day)
- place ad units in non-intrusive positions (sidebar, below charts)
- monitor RPM and adjust placement based on performance

## Milestone 15: Per-number Profile Page (/numeros/[numero])
- frequency stats: total appearances, %, first/last seen, current drought, max drought, trend badge
- co-occurrence: top 5 and bottom 5 numbers that most/least appear together
- gap distribution: histogram of droughts between appearances
- history: paginated list of all draws where the number appeared, with links to draw detail
- entry point: clicking a number in the frequency grid navigates to this page
