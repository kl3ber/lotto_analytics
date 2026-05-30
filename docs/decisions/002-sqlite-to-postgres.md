# ADR-002 — SQLite for development, PostgreSQL for production

**Date:** 2026-05-29
**Status:** accepted

---

## Context
The platform stores drawings, per-drawing metric vectors, cluster assignments, and AI insights. The dataset is bounded (Mega-Sena has ~2,600 historical drawings; growing by ~2/week). The question is whether to start with SQLite, PostgreSQL, or a specialized analytical store.

## Options considered

| | SQLite | PostgreSQL | DuckDB |
|---|---|---|---|
| Setup complexity | Zero (file-based) | Requires server process | Minimal |
| Concurrent writes | Single writer only | Full MVCC | Analytical, single writer |
| JSON/array support | Basic | Rich (JSONB, arrays) | Rich |
| Production-ready | Limited | Yes | Read-heavy only |
| Migration path | SQLAlchemy abstracts it | Native | Different dialect |
| Analytics queries | Adequate for this scale | Yes | Excellent |

## Decision
**SQLite in development, PostgreSQL in production.**

The dataset is small enough that SQLite handles it with no performance issues. Using it in development eliminates the need to run a database server locally and simplifies onboarding. SQLAlchemy abstracts the dialect, so switching to PostgreSQL for production is a configuration change, not a code rewrite. DuckDB was considered for its analytics capabilities but is not production-battle-tested for write-heavy ingestion workloads.

## Consequences
- SQLAlchemy models must avoid SQLite-specific syntax (no `RETURNING` in writes for SQLite < 3.35)
- `DATABASE_URL` environment variable controls which engine is used: `sqlite:///./lotto.db` vs `postgresql://...`
- Migrations are managed with Alembic and work on both dialects
- If the dataset ever grows beyond ~10M rows (e.g. all Brazilian lotteries combined), this decision should be revisited

## Ingestion pipeline per environment

**Local dev (Phase 1):** three-script pipeline — `ingest_mega_sena.py` fetches from the Caixa API and persists raw JSONs + trusted CSV + SQLite. `export.py` regenerates the CSV from raw JSONs. `seed_db.py` bulk-loads the DB from CSV. All three remain available as dev tooling indefinitely.

**Production (Phase 2+):** simplified to two steps — `seed_db.py` for the one-time historical load, then `ingest_mega_sena.py` (no flags) on a cron job (Tue/Thu/Sat, Mega-Sena draw days) for incremental updates. Raw JSONs and `export.py` become optional; the database is the source of truth.
