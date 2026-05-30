# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow the milestones defined in `docs/milestones.md`.

---

## [Unreleased]

## [0.1.0] - 2026-05-30

### Added
- `ingest_mega_sena.py`: full ingestion pipeline with incremental mode (CSV as source of truth), prize tiers (6/5/4 matches), financials, and 3 draw metadata fields (`draw_order`, `is_special`, `milestone_draw_number`)
- `export.py`: regenerates trusted CSV from raw JSON artifacts (offline, no API call)
- `seed_db.py`: bulk-loads database from trusted CSV; supports `--truncate` for full reseed
- 45-test suite covering parse, CSV helpers, and seed logic
- Local setup instructions and ingestion script reference in README
- ADR-002 updated with per-environment ingestion pipeline strategy
- FastAPI backend: `GET /drawings` (pagination, sorting, 5 filter params) and `GET /drawings/{drawing_number}` endpoints
- `GET /health` endpoint for liveness checks
- 20-test suite for all backend endpoints (pagination, sort, filters, 404)
- Next.js frontend with `DrawingsTable` (TanStack Table v8), `DrawingDrawer`, and `FilterBar` components
- `FilterBar`: draw number range, date range, and roll-over filters with clear button
- `DrawingDrawer`: slide-in detail panel showing numbers, prize tiers, financials, and draw order
- Prize columns for 6, 5 and 4 acertos with winner count badges
- Display toggles: show/hide winners, abbreviate values (M / mil), total vs per-winner prize view
- Prize sort uses `prize_6` (per-winner jackpot) instead of `total_prize` (0 for accumulated draws)

