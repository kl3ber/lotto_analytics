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

---

## How to Use This Repo

**Starting a new feature:** write or review the spec in `docs/features/` before writing any code.

**Making an architectural decision:** create a new ADR in `docs/decisions/` documenting the context, options, and rationale.

**Tracking progress:** check off tasks in `docs/milestones.md` and add entries to `CHANGELOG.md` as features ship.

**AI conventions:** see `CLAUDE.md` for branching rules, commit format, and the pre-commit checklist.
