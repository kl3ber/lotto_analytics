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

## Milestone 4: Análises — Padrões
- paridade: even/odd distribution per drawing and historical average
- dezenas: distribution across ranges 1-10, 11-20, 21-30, 31-40, 41-50, 51-60
- soma: histogram of draw sums across all drawings
- consecutivos: how often consecutive numbers appear together
- repetições: numbers that repeated from the previous draw
- `/numeros/[number]` — per-number profile page aggregating all available analyses (frequency, timeline, co-occurrence, trends)

## Milestone 5: Deploy & Infraestrutura
- migrate and validate backend with PostgreSQL
- deploy FastAPI + PostgreSQL to Railway or Render
- deploy Next.js frontend to Vercel
- configure production environment variables (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, CORS)
- populate production database via `seed_db.py`
- configure cron job for incremental ingestion (Tue/Thu/Sat)
- validate full end-to-end pipeline in production

## Milestone 6: Feature Vectors
- define a fingerprint vector for each drawing
- generate derived metrics and scores
- store derived metrics in the data model
- validate feature consistency

## Milestone 7: Clusters and Regimes
- implement KMeans or HDBSCAN clustering
- label drawings with regime tags
- add cluster visualizations and summaries
- produce at least one anomaly detection report

## Milestone 8: AI Explanations
- generate textual insights for drawings
- explain score assignments for a subset of metrics
- provide summary narratives for clusters or regimes
- keep language factual and non-predictive

## Milestone 9: Product Layer
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring
