# Milestones

## Purpose
Define concrete milestones and checkpoints that can be updated without breaking the overall documentation.

## Milestone 1: Data Foundation
- set up repository and basic docs
- ingest Mega-Sena historical results
- store results in a stable database structure
- verify data quality and raw source traceability

## Milestone 2: Basic Analytics
- calculate base lottery metrics for each drawing
- build a simple dashboard or report page
- support querying drawings and metrics via API
- implement auto-update for new drawings

## Milestone 3: Feature Vectors
- define a fingerprint vector for each drawing
- generate derived metrics and scores
- store derived metrics in the data model
- validate feature consistency

## Milestone 4: Clusters and Regimes
- implement KMeans or HDBSCAN clustering
- label drawings with regime tags
- add cluster visualizations and summaries
- produce at least one anomaly detection report

## Milestone 5: AI Explanations
- generate textual insights for drawings
- explain score assignments for a subset of metrics
- provide summary narratives for clusters or regimes
- keep language factual and non-predictive

## Milestone 6: Product Layer
- refine dashboard UX toward a premium technical look
- add heatmaps, timelines, and similarity views
- define freemium/premium feature boundaries
- build the operational plan for updates and monitoring
