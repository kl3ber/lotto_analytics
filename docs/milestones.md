# Milestones

## Purpose
Define concrete milestones and checkpoints that can be updated without breaking the overall documentation.

## Milestone 1: Data Foundation
- [x] set up repository and basic docs *(2026-05-29)*
- [x] ingest Mega-Sena historical results *(2026-05-29)*
- [x] store results in a stable database structure *(2026-05-29)*
- [x] verify data quality and raw source traceability *(2026-05-29)*

## Milestone 2: Results Dashboard (release 1 close)
- build FastAPI backend with `GET /drawings` and `GET /drawings/{id}` endpoints
- build Next.js frontend with drawings table (TanStack Table + shadcn/ui)
- table shows drawing number, date, numbers, sum, prize, roll-over
- pagination, sorting and basic column toggling working
- deploy end-to-end (frontend → API → database)

## Milestone 3: Analytics & Metrics (release 2)
- calculate base lottery metrics for each drawing (sum, even/odd, consecutive, etc.)
- store metrics in `drawing_metrics` table
- expose metrics via API (`GET /metrics/{drawing_id}`, `GET /metrics/summary`)
- add metric columns to dashboard table (Entropy, Randomness views)
- implement auto-update pipeline for new drawings

## Milestone 4: Feature Vectors
- define a fingerprint vector for each drawing
- generate derived metrics and scores
- store derived metrics in the data model
- validate feature consistency

## Milestone 5: Clusters and Regimes
- implement KMeans or HDBSCAN clustering
- label drawings with regime tags
- add cluster visualizations and summaries
- produce at least one anomaly detection report

## Milestone 6: AI Explanations
- generate textual insights for drawings
- explain score assignments for a subset of metrics
- provide summary narratives for clusters or regimes
- keep language factual and non-predictive

## Milestone 7: Product Layer
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring
