# Milestones

## Purpose
Define concrete milestones and checkpoints that can be updated without breaking the overall documentation.

## Milestone 1: Data Foundation
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
## Page structure (target)

```
/analises
  Frequência
    ├ Números        (done - M3)
    └ Prêmios        (done - M3)
  Padrões
    ├ Paridade       (M4)
    ├ Soma           (M4)
    ├ Distribuição   (M4)
    └ Consecutivos & Repetições (M4)
  Estatísticas
    ├ Aleatoriedade  (M6)
    ├ Entropia       (M6)
    └ Memória        (M6)
  Machine Learning
    ├ Clusters & Regimes (M7)
    ├ Anomalias      (M7)
    └ Séries Temporais (M7)
  Prêmios & Acúmulos
    ├ Histórico      (done - M3)
    └ Ciclos         (M5)

/numeros/[numero]    (M4)
/jogo                (M8)
```

---

## Milestone 4: Análises — Padrões (/analises > Padrões)
- paridade: even/odd distribution per drawing and historical average
- soma: histogram of draw sums across all drawings
- distância entre números: average spacing between the 6 drawn numbers (concentrated vs spread)
- números baixos vs altos: proportion below/above 30, historically and by period
- consecutivos: how often consecutive numbers appear together
- repetições: numbers that repeated from the previous draw
- números primos: how many primes appear per drawing on average

## Milestone 5: Análises — Prêmios & Acúmulos (/analises > Prêmios & Acúmulos)
- `/numeros/[number]` — per-number profile page (frequency, timeline, co-occurrence, trends)
- duração dos acúmulos: how many draws each accumulation cycle lasts, distribution and records
- jackpot milestones: how many times the prize exceeded 50M, 100M, 200M
- prize value evolution: area chart with milestone markers

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
- drawing type classification: cluster-based supervised labelling of drawing "types"
- validate feature consistency

## Milestone 8: Estatísticas Avançadas (/analises > Estatísticas)
- Monte Carlo simulation: compare real distribution vs expected
- Chi-square + Kolmogorov-Smirnov tests: verify uniformity
- Shannon Entropy + Approximate Entropy (ApEn): unpredictability over time windows
- Hurst Exponent + Autocorrelation: memory and trend detection
- Bootstrap: confidence intervals for observed frequencies

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
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring
