# Project Structure

Planned folder layout. Items marked `✓` are implemented.

```
lotto_analytics/
│
├── analytics/                  # pure analytics logic — no HTTP, no DB access
│   ├── metrics/
│   │   ├── basic.py            # sum, even/odd, range, consecutive, delays
│   │   ├── advanced.py         # entropy, Hurst, autocorrelation, compressibility
│   │   └── scores.py           # percentile normalization → 0–100 scores
│   ├── clustering/
│   │   ├── pipeline.py         # orchestrates full clustering run
│   │   ├── kmeans.py
│   │   ├── hdbscan.py
│   │   ├── anomaly.py          # Isolation Forest
│   │   └── reduction.py        # PCA, UMAP
│   ├── insights/
│   │   ├── prompt_builder.py   # assembles context dict → prompt string
│   │   ├── generator.py        # Claude API call → insight text
│   │   └── templates/
│   │       ├── drawing.txt
│   │       └── cluster.txt
│   ├── tests/
│   │   ├── metrics/
│   │   ├── clustering/
│   │   └── insights/
│   └── pyproject.toml          # makes analytics installable as local package
│
├── backend/                    # FastAPI REST API — thin layer over analytics
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── drawings.py
│   │   │   ├── metrics.py
│   │   │   ├── clusters.py
│   │   │   ├── insights.py
│   │   │   └── ingest.py
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── database.py
│   ├── tests/
│   ├── alembic/                # DB migrations
│   └── requirements.txt        # includes -e ../analytics
│
├── frontend/                   # React + TypeScript dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── DrawingDetailPage.tsx
│   │   ├── components/
│   │   │   ├── DrawingsTable.tsx
│   │   │   ├── ColumnManager.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── DrawingDetailDrawer.tsx
│   │   │   └── charts/
│   │   ├── store/              # Zustand stores
│   │   └── api/                # typed API client (from OpenAPI schema)
│   └── package.json
│
├── scripts/                    # one-off and scheduled operations
│   ├── ingest_mega_sena.py     # fetch → validate → upsert drawings
│   ├── recalculate_metrics.py  # rerun feature pipeline on all drawings
│   └── run_clustering.py       # trigger a full clustering pass
│
├── data/
│   └── raw/                    # raw source artifacts (CSV/JSON snapshots)
│
├── docs/
│   ├── product-spec.md         # vision, user stories, MVP, acceptance criteria
│   ├── sdd.md                  # architecture, data model, feature engineering, ML
│   ├── ux-vision.md            # UX principles and interface design
│   ├── operational-plan.md     # ingestion schedule, monitoring, deployment
│   ├── roadmap.md              # phases and long-term evolution
│   ├── milestones.md           # committed deliverables by version
│   ├── structure.md            # this file
│   ├── features/               # spec per feature (data flow, endpoints, criteria)
│   └── decisions/              # ADRs (architectural decision records)
│
├── CLAUDE.md                   # project conventions for AI-assisted development
├── CHANGELOG.md                # delivery history
└── README.md                   # project index
```

## Module dependency rules

```
analytics/  ←── backend/  ←── (HTTP clients / frontend)
    ↑
scripts/
```

- `analytics/` imports: pandas, numpy, scikit-learn, scipy — nothing else
- `backend/` imports: analytics, FastAPI, SQLAlchemy, Pydantic
- `scripts/` imports: analytics, SQLAlchemy directly (no FastAPI)
- `frontend/` communicates only via the REST API — never imports Python code
