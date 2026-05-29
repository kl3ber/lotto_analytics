# ADR-003 — Analytics engine separated from the backend

**Date:** 2026-05-29
**Status:** accepted

---

## Context
The platform has a substantial body of analytical logic: metrics calculation, feature engineering, clustering, anomaly detection, and AI insight generation. This logic could live directly inside the FastAPI backend or in a separate Python package.

## Options considered

**Option A — Logic inside the backend**
```
backend/app/services/metrics.py
backend/app/services/clustering.py
backend/app/services/insights.py
```
Simple to start. All code in one place. Logic is coupled to FastAPI request context.

**Option B — Separate `analytics/` package**
```
analytics/
├── metrics/
├── clustering/
├── features/
├── insights/
└── tests/
```
Backend imports analytics as a local package:
```python
from analytics.metrics.basic import compute_basic_metrics
from analytics.clustering.pipeline import run_clustering
```

## Decision
**Option B — separate `analytics/` package.**

The analytical logic has no dependency on HTTP, databases, or web frameworks. Keeping it separate means:
- It can be run directly from scripts (`python scripts/recalculate_metrics.py`) without starting the web server
- It is tested in isolation with pytest, with no need to mock HTTP context
- The backend becomes a thin API layer that calls the engine and exposes results via endpoints
- The ML pipeline can be iterated and re-run independently of the API

## Consequences
- `analytics/pyproject.toml` makes it installable as a local package
- `backend/requirements.txt` references it with `-e ../analytics`
- The analytics package has no knowledge of FastAPI, SQLAlchemy, or any web concern
- Scripts in `scripts/` can use the analytics package directly for one-off processing
