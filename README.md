# Lotto Analytics

A quantitative analysis platform for Brazilian lotteries with an initial focus on Mega-Sena.

Treats lottery draws as randomness data, not prediction targets. The output is metrics, scores, clusters, and fingerprints — not number tips.

---

## Documentation

### Product
- [product-spec.md](docs/product-spec.md) — vision, user stories, MVP scope, acceptance criteria
- [ux-vision.md](docs/ux-vision.md) — interface design principles and metrics presentation

### Design
- [sdd.md](docs/sdd.md) — architecture, data model, feature engineering, ML pipeline, API design
- [structure.md](docs/structure.md) — planned folder layout and module dependency rules

### Planning
- [roadmap.md](docs/roadmap.md) — phases and long-term evolution
- [milestones.md](docs/milestones.md) — committed deliverables by version
- [CHANGELOG.md](CHANGELOG.md) — delivery history

### Operations
- [operational-plan.md](docs/operational-plan.md) — ingestion schedule, monitoring, deployment

### Feature Specs
- [features/ingestion.md](docs/features/ingestion.md) — data collection from Caixa CEF
- [features/metrics.md](docs/features/metrics.md) — base and advanced metric calculation
- [features/dashboard.md](docs/features/dashboard.md) — results table, column manager, KPI cards
- [features/clustering.md](docs/features/clustering.md) — regime detection and anomaly flagging
- [features/ai-insights.md](docs/features/ai-insights.md) — AI-generated drawing explanations

### Architectural Decisions
- [decisions/001-fastapi.md](docs/decisions/001-fastapi.md) — FastAPI over Node.js Express
- [decisions/002-sqlite-to-postgres.md](docs/decisions/002-sqlite-to-postgres.md) — SQLite in dev, PostgreSQL in production
- [decisions/003-analytics-separation.md](docs/decisions/003-analytics-separation.md) — analytics as a separate package
- [decisions/004-python-stack.md](docs/decisions/004-python-stack.md) — Python for the full backend and analytics stack
- [decisions/005-frontend-stack.md](docs/decisions/005-frontend-stack.md) — Next.js + TanStack Table + shadcn/ui

---

## Local setup

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r scripts/requirements.txt
```

Copy `.env.example` to `.env` if you need to override `DATABASE_URL` (defaults to `sqlite:///./lotto.db`).

---

## Ingestion scripts

```
API Caixa
   │
   ▼
ingest_mega_sena.py ──► data/raw/*.json ──► export.py ──► data/trusted/mega_sena.csv
   │                                                               │
   └──────────────────────────────────────────────────────────────┤
                                                                   ▼
                                                              seed_db.py ──► lotto.db
```

| Script | When to run |
|---|---|
| `ingest_mega_sena.py --full` | First-time historical fetch from the Caixa API |
| `ingest_mega_sena.py` | Incremental update — fetches only draws newer than the CSV |
| `export.py` | Regenerate the trusted CSV from existing raw JSONs (e.g. after a schema change) |
| `seed_db.py` | Bulk-load the database from the trusted CSV; use `--truncate` for a full reseed |

In production (PostgreSQL), only `seed_db.py` (once) and `ingest_mega_sena.py` (cron) are needed.
See [ADR-002](docs/decisions/002-sqlite-to-postgres.md) for the full rationale.

---

## How to Use This Repo

**Starting a new feature:** write or review the spec in `docs/features/` before writing any code.

**Making an architectural decision:** create a new ADR in `docs/decisions/` documenting the context, options, and rationale.

**Tracking progress:** check off tasks in `docs/milestones.md` and add entries to `CHANGELOG.md` as features ship.

**AI conventions:** see `CLAUDE.md` for branching rules, commit format, and the pre-commit checklist.
