# Feature: Data Ingestion

**Milestone:** v0.1
**Status:** planned

---

## What it does
Collects Mega-Sena historical results from Caixa Econômica Federal and persists them in the database. Runs on a schedule to detect and store new drawings automatically. All raw source files are preserved for traceability.

---

## Data flow

```
Caixa CEF website / public API
              ↓
Ingestion script (scripts/ingest_mega_sena.py)
              ↓
Validation & deduplication (idempotent)
              ↓
Raw artifact saved to data/raw/
              ↓
drawings table (SQLite / PostgreSQL)
              ↓
Feature engineering trigger
```

---

## Database
Tables involved: `drawings`, `numbers`

Key constraint: `UNIQUE (drawing_number)` on `drawings`
Key index: `(draw_date DESC)` on `drawings`

Fields stored per drawing:
- `drawing_number` — official sequential number
- `draw_date` — date of the drawing
- `n1..n6` — the six drawn numbers (sorted)
- `sum` — sum of the six numbers
- `total_prize` — accumulated prize in BRL
- `roll_over` — whether the jackpot rolled over
- `next_draw_date` — estimated date of the next drawing

---

## Backend

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/drawings` | paginated list of drawings (date range, limit, offset) |
| GET | `/drawings/{id}` | single drawing detail |
| POST | `/ingest/trigger` | manually trigger an ingestion run |
| GET | `/ingest/status` | last ingestion timestamp and row count |

---

## Ingestion script

```
scripts/
└── ingest_mega_sena.py   # fetch → validate → upsert
```

- Fetches from the official Caixa endpoint (CSV or API)
- Compares drawing numbers already in the database to avoid duplicates
- Saves the raw response to `data/raw/mega_sena_YYYYMMDD.json`
- Logs ingestion results: rows fetched, rows inserted, rows skipped

---

## Scheduling
- Cron job or Prefect flow running 3×/week (Wed, Sat, after 21h BRT)
- Idempotent: running multiple times on the same day is safe

---

## Acceptance criteria
- [ ] Run the script and see Mega-Sena historical results inserted into the database
- [ ] Re-run the script — no duplicates are created
- [ ] A raw artifact file is saved in `data/raw/` for each run
- [ ] `GET /drawings` returns a paginated list with correct draw dates and numbers
- [ ] `GET /ingest/status` shows the timestamp of the last successful run
- [ ] New drawings appear automatically after the scheduled job runs
