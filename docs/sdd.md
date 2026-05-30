# SDD — Lottery Analytics Platform

## 1. Purpose and Scope

Statistical analysis platform for Brazilian lotteries. Initial focus on Mega-Sena, with architecture designed to support additional games.

**Goal:** transform historical draw results into metrics, scores, clusters, and randomness fingerprints. Not prediction — pattern description.

**Scope:**
- automated result ingestion and storage
- feature engineering and fingerprint vectors per drawing
- clustering and regime detection
- AI-generated textual explanations
- interactive analytics dashboard

---

## 2. System Context

### Users
- quantitative analysts and data enthusiasts
- users studying lottery randomness patterns
- premium dashboard viewers
- developers extending the platform

### High-level data flow
```
Caixa CEF (source)
      ↓
Data Collector (ingestion scripts)
      ↓
Raw Store (data/raw/)    →   drawings table
      ↓
Feature Engine (analytics/)
      ↓
drawing_metrics table
      ↓
Clustering / Regime Detection
      ↓
clusters + drawing_clusters tables
      ↓
AI Insights Service
      ↓
drawing_insights table
      ↓
FastAPI (backend/)
      ↓
React Dashboard (frontend/)
```

---

## 3. Architecture

### Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Data Collector | `scripts/ingest_*.py` | fetch, validate, upsert drawings |
| Feature Engine | `analytics/metrics/` | compute base and advanced metrics |
| Clustering Module | `analytics/clustering/` | KMeans, HDBSCAN, anomaly detection |
| Insights Service | `analytics/insights/` | LLM prompt building and generation |
| Web API | `backend/` | FastAPI REST endpoints |
| Frontend | `frontend/` | React + TypeScript dashboard |
| Scheduler | cron / Prefect | trigger ingestion and pipeline runs |

### Key architectural decisions
- The `analytics/` package has no dependency on FastAPI or any web framework — see [ADR-003](decisions/003-analytics-separation.md)
- Backend is Python (FastAPI) — see [ADR-001](decisions/001-fastapi.md)
- SQLite in development, PostgreSQL in production — see [ADR-002](decisions/002-sqlite-to-postgres.md)
- Full Python stack — see [ADR-004](decisions/004-python-stack.md)

---

## 4. Data Model

### `drawings`
| Field | Type | Description |
|-------|------|-------------|
| `drawing_id` | integer PK | internal identifier |
| `drawing_number` | integer UNIQUE | official sequential number |
| `draw_date` | date | date of the drawing |
| `n1`..`n6` | integer | drawn numbers (sorted ascending) |
| `sum` | integer | sum of the six numbers |
| `total_prize` | decimal | total prize amount (BRL) |
| `roll_over` | boolean | whether the jackpot rolled over |
| `next_draw_date` | date | estimated next drawing date |
| `source_metadata` | JSON | raw source provenance |

### `numbers`
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer PK | |
| `drawing_id` | integer FK | reference to drawings |
| `number` | integer | individual drawn number (1–60) |
| `position` | integer | order in the official draw |

### `drawing_metrics`
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer PK | |
| `drawing_id` | integer FK | reference to drawings |
| `feature_name` | string | metric key (e.g. `shannon_entropy`) |
| `value` | decimal | raw computed value |
| `score` | decimal | normalized percentile score (0–100) |
| `category` | string | group: `basic`, `distribution`, `randomness`, `structure` |
| `pipeline_version` | string | version tag of the pipeline that produced this |

### `clusters`
| Field | Type | Description |
|-------|------|-------------|
| `cluster_id` | integer PK | |
| `label` | string | regime name (e.g. `high-entropy dispersed`) |
| `algorithm` | string | e.g. `kmeans_k8`, `hdbscan_min5` |
| `size` | integer | number of drawings in the cluster |
| `centroid` | JSON | centroid feature values |
| `run_date` | date | when this cluster was computed |

### `drawing_clusters`
| Field | Type | Description |
|-------|------|-------------|
| `drawing_id` | integer FK | |
| `cluster_id` | integer FK | |
| `distance_to_centroid` | decimal | |
| `is_anomaly` | boolean | flagged by Isolation Forest |
| `anomaly_score` | decimal | Isolation Forest score |

### `drawing_insights`
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer PK | |
| `drawing_id` | integer FK | |
| `insight_type` | string | `drawing` \| `cluster_summary` \| `metric_explanation` |
| `content` | text | markdown explanation |
| `model` | string | LLM model ID used |
| `prompt_version` | string | hash of the prompt template |
| `generated_at` | datetime | |

---

## 5. Feature Engineering

### Base features (v0.1)
| Feature | Description |
|---------|-------------|
| `sum` | sum of the 6 numbers |
| `even_count` / `odd_count` | even and odd number counts |
| `low_count` / `high_count` | count ≤ 30 and > 30 |
| `consecutive_count` | pairs of consecutive numbers |
| `prime_count` | prime numbers in the draw |
| `fibonacci_count` | Fibonacci numbers in the draw |
| `range` | max minus min |
| `delay_avg` / `delay_max` | average and max gap since last appearance |

### Advanced features (v0.2)
| Feature | Description |
|---------|-------------|
| `shannon_entropy` | Shannon entropy of the number set |
| `approx_entropy` | regularity measure (ApEn) |
| `autocorrelation_lag1` | autocorrelation of the sorted sequence |
| `hurst_exponent` | Hurst exponent of sums over time |
| `balance_score` | spatial dispersion across 1–60 |
| `compressibility` | approximate Kolmogorov compressibility |
| `fourier_peak` | dominant frequency in number gap spectrum |
| `anti_human_score` | distance from typical human-chosen patterns |
| `rarity_score` | inverse frequency of the specific combination |

### Fingerprint vector
Each drawing is represented as a fixed-length normalized feature vector for clustering and similarity search. Stored in `drawing_metrics` or a matrix format for batch ML operations.

### Pipeline
```
load drawings
     ↓
validate quality and completeness
     ↓
compute base features  →  drawing_metrics (basic)
     ↓
compute advanced features  →  drawing_metrics (advanced)
     ↓
normalize to 0–100 scores (percentile across all drawings)
     ↓
assemble fingerprint vector
```

---

## 6. Clustering and Regime Detection

### Algorithms
| Algorithm | Role |
|-----------|------|
| KMeans (k=6–10) | primary clustering; stable, interpretable centroids |
| HDBSCAN | density-based; detects noise and natural groupings |
| Gaussian Mixture | soft assignment for boundary drawings |
| Isolation Forest | anomaly detection; flags statistical outliers |
| PCA / UMAP | dimensionality reduction for 2D/3D visualization |

### Regime labels
`high-entropy`, `low-entropy`, `clustered`, `dispersed`, `persistent`, `mean-reverting`, `anomalous`, `human-like`, `pseudo-random`, `fractal/cyclic`

### Workflow
1. select feature subset (advanced metrics)
2. normalize feature matrix
3. run KMeans → assign primary cluster
4. run HDBSCAN → detect natural subgroups and noise
5. run Isolation Forest → flag anomalies
6. reduce to 2D with PCA/UMAP for visualization
7. name regimes using centroid feature profiles + LLM summary

### Validation
- compare cluster stability across rolling time windows
- validate feature consistency on newly ingested drawings
- monitor fingerprint distribution drift

---

## 7. AI and Explainability

### Principles
- always describe, never predict
- reference actual numeric values in the explanation
- compare to historical average for context
- avoid betting language: no "lucky", "hot", "due"

### Use cases
- **Drawing insight** — narrative summary of a drawing's metrics vs. historical average
- **Cluster summary** — description of what makes a regime statistically distinctive
- **Metric explanation** — plain-language definition of each feature (static, cached)

### Architecture
```
drawing_metrics + cluster assignment
      ↓
analytics/insights/prompt_builder.py   (structured context dict)
      ↓
Claude API (claude-haiku-4-5 or claude-sonnet-4-6)
      ↓
drawing_insights table
```

---

## 8. API Design

### Core endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/drawings` | paginated drawings with basic metrics |
| GET | `/drawings/{id}` | full drawing detail |
| GET | `/metrics/{drawing_id}` | all features and scores for a drawing |
| GET | `/metrics/summary` | global distribution stats |
| GET | `/clusters` | list of clusters with regime labels |
| GET | `/clusters/{id}/drawings` | drawings in a cluster |
| GET | `/insights/{drawing_id}` | AI explanation for a drawing |
| GET | `/insights/cluster/{id}` | regime narrative |
| POST | `/ingest/trigger` | manually trigger ingestion |
| POST | `/metrics/recalculate` | full pipeline rerun (admin) |
| POST | `/clusters/run` | re-cluster all drawings (admin) |

---

## 9. Interface Requirements

Documented in detail in [ux-vision.md](ux-vision.md). Summary:
- technical, premium tone — quant terminal aesthetic, not a lottery site
- main entry point: configurable drawings table with column manager
- saved views: Basic, Entropy, Cluster, Randomness
- detail drawer per drawing with full metrics and AI insight
- cluster scatter plot (2D PCA/UMAP), regime timeline

### Frontend stack
- Next.js + TypeScript
- TanStack Table v8 (headless, pinned pre-incident version) — see [ADR-005](decisions/005-frontend-stack.md)
- shadcn/ui + Tailwind CSS for components and styling
- Zustand for client state (columns, filters, drawer)
- Recharts or Plotly for charts (added when metric visualizations are needed)
- Types generated from FastAPI's OpenAPI schema

---

## 10. Quality Requirements
- data accuracy: ingestion is idempotent; raw artifacts preserved for traceability
- pipeline reproducibility: same input always produces the same metrics
- non-predictive: no language implying future draw prediction anywhere in the platform
- modularity: `analytics/` package is independently testable without the web server
- scalability: data model supports multiple lotteries from day one
