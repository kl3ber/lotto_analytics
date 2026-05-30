# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow the milestones defined in `docs/milestones.md`.

---

## [Unreleased]

### Added
- `ingest_mega_sena.py`: full ingestion pipeline with incremental mode (CSV as source of truth), prize tiers (6/5/4 matches), financials, and 3 draw metadata fields (`draw_order`, `is_special`, `milestone_draw_number`)
- `export.py`: regenerates trusted CSV from raw JSON artifacts (offline, no API call)
- `seed_db.py`: bulk-loads database from trusted CSV; supports `--truncate` for full reseed
- 45-test suite covering parse, CSV helpers, and seed logic
- Local setup instructions and ingestion script reference in README
- ADR-002 updated with per-environment ingestion pipeline strategy

