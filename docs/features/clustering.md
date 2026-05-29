# Feature: Clustering and Regime Detection

**Milestone:** v0.2
**Status:** planned

---

## What it does
Groups historical drawings into statistically coherent clusters and labels each drawing with a regime (e.g. high-entropy, dispersed, anomalous). Enables visualization of how the distribution of drawings has shifted over time and which drawings are statistical outliers.

---

## Data flow

```
drawing_metrics table  (feature vectors)
              ↓
analytics/clustering/pipeline.py
  └── normalize features
  └── PCA reduction (optional)
  └── KMeans / HDBSCAN fit
  └── label assignments
  └── regime naming (rule-based + GPT summary)
              ↓
clusters table + drawing_clusters table
              ↓
GET /clusters
GET /drawings/{id}  →  includes cluster_id + regime_label
```

---

## Database
Tables involved: `clusters`, `drawing_clusters`

`clusters` schema:
- `cluster_id`
- `label` — human-readable regime name (e.g. "high-entropy dispersed")
- `size` — number of drawings in the cluster
- `centroid` — JSON blob of centroid feature values
- `algorithm` — e.g. `kmeans_k8` or `hdbscan_min5`
- `run_date`

`drawing_clusters` schema:
- `drawing_id` — FK to drawings
- `cluster_id` — FK to clusters
- `distance_to_centroid` — float
- `is_anomaly` — bool (Isolation Forest flag)
- `anomaly_score` — float

---

## Algorithms

| Algorithm | Use case |
|-----------|----------|
| KMeans (k=6–10) | Primary clustering; stable, interpretable centroids |
| HDBSCAN | Secondary pass to detect natural density clusters and noise points |
| Gaussian Mixture | Soft assignment for drawings near cluster boundaries |
| PCA / UMAP | Dimensionality reduction for 2D/3D visualization |
| Isolation Forest | Anomaly detection; flags drawings with unusual feature vectors |

---

## Backend

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/clusters` | list all clusters with labels and sizes |
| GET | `/clusters/{id}` | cluster detail: centroid, member drawings, regime description |
| GET | `/clusters/{id}/drawings` | paginated drawings in a cluster |
| GET | `/drawings/{id}/cluster` | cluster assignment for a specific drawing |
| POST | `/clusters/run` | trigger a new clustering run (admin) |

---

## Frontend

### Components
| Component | Description |
|-----------|-------------|
| `RegimeTimeline` | timeline chart showing regime changes across history |
| `ClusterScatterPlot` | 2D PCA/UMAP scatter of all drawings colored by cluster |
| `ClusterSummaryCard` | regime label, size, centroid feature bars |
| `AnomalyBadge` | indicator shown on anomalous drawings in the table |

---

## Analytics module

```
analytics/
├── clustering/
│   ├── pipeline.py      # orchestrates full clustering run
│   ├── kmeans.py
│   ├── hdbscan.py
│   ├── anomaly.py       # Isolation Forest
│   └── reduction.py     # PCA, UMAP
└── tests/
    └── clustering/
        └── test_pipeline.py
```

---

## Acceptance criteria
- [ ] Clustering pipeline runs end-to-end without errors on full historical data
- [ ] Each drawing has a cluster assignment in `drawing_clusters`
- [ ] `GET /clusters` returns a list with regime labels and sizes
- [ ] Anomalous drawings are flagged and their `anomaly_score` is stored
- [ ] `ClusterScatterPlot` renders all drawings in 2D space, colored by cluster
- [ ] `RegimeTimeline` shows when the dominant regime changed over time
- [ ] Re-running clustering with the same parameters produces stable assignments
