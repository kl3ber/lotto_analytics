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

## Milestone 3: Deploy & Infraestrutura
- migrate and validate backend with PostgreSQL
- deploy FastAPI + PostgreSQL to Railway or Render
- deploy Next.js frontend to Vercel
- configure production environment variables (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, CORS)
- populate production database via `seed_db.py`
- configure cron job for incremental ingestion (Tue/Thu/Sat)
- validate full end-to-end pipeline in production

## Milestone 4: Analytics & Métricas
- calculate base lottery metrics for each drawing (sum, even/odd, consecutive, etc.)
- store metrics in `drawing_metrics` table
- expose metrics via API (`GET /metrics/{drawing_id}`, `GET /metrics/summary`)
- add metric columns to dashboard table (Entropy, Randomness views)
- implement auto-update pipeline for new drawings

## Milestone 5: Feature Vectors
- define a fingerprint vector for each drawing
- generate derived metrics and scores
- store derived metrics in the data model
- validate feature consistency

## Milestone 6: Clusters and Regimes
- implement KMeans or HDBSCAN clustering
- label drawings with regime tags
- add cluster visualizations and summaries
- produce at least one anomaly detection report

## Milestone 7: AI Explanations
- generate textual insights for drawings
- explain score assignments for a subset of metrics
- provide summary narratives for clusters or regimes
- keep language factual and non-predictive

## Milestone 8: Product Layer
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring
