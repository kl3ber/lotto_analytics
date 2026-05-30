# Feature: Data Ingestion

**Milestone:** v0.1
**Status:** done

---

## What it does
Collects Mega-Sena historical results from Caixa Econômica Federal and persists them in a three-layer store: raw JSON artifacts, a trusted CSV snapshot, and a relational database. Supports full historical load, gap filling, and incremental updates.

---

## Data flow

```
Caixa CEF public API
        │
        ▼
ingest_mega_sena.py ──► data/raw/mega_sena_NNNN.json
        │
        ▼
export.py ──► data/trusted/mega_sena.csv
        │
        ▼
seed_db.py ──► drawings table (SQLite / PostgreSQL)
```

For incremental runs, `ingest_mega_sena.py` writes to all three layers in a single call.

---

## Scripts

| Script | Purpose |
|---|---|
| `scripts/ingest_mega_sena.py` | Fetch from API → save raw JSON → append to trusted CSV → upsert DB |
| `scripts/export.py` | Regenerate trusted CSV from existing raw JSONs (offline, no API call) |
| `scripts/seed_db.py` | Bulk-load DB from trusted CSV; use `--truncate` for full reseed |

### ingest_mega_sena.py modes

```bash
python scripts/ingest_mega_sena.py           # incremental: fetches only draws newer than CSV
python scripts/ingest_mega_sena.py --full    # fetches all draws missing from CSV (gap-fill)
python scripts/ingest_mega_sena.py --draw 100  # fetch a specific draw number
```

---

## Database

Table: `drawings`

| Column | Type | Description |
|---|---|---|
| `drawing_number` | Integer | Official sequential draw number (unique) |
| `draw_date` | Date | Date of the drawing |
| `n1`–`n6` | Integer | Six drawn numbers, sorted ascending |
| `draw_sum` | Integer | Sum of the six numbers |
| `total_prize` | Numeric | Jackpot prize in BRL |
| `roll_over` | Boolean | Whether the jackpot rolled over |
| `next_draw_date` | Date | Estimated date of next draw |
| `winners_6` / `prize_6` | Integer / Numeric | Jackpot tier winners and prize |
| `winners_5` / `prize_5` | Integer / Numeric | 5-match tier |
| `winners_4` / `prize_4` | Integer / Numeric | 4-match tier |
| `total_collected` | Numeric | Total ticket revenue for the draw |
| `next_accumulated` | Numeric | Accumulated amount carried to next draw |
| `next_estimated` | Numeric | Estimated next jackpot |
| `special_accumulated` | Numeric | Accumulated for special contest prize pool |
| `milestone_accumulated` | Numeric | Accumulated for final-digit 0/5 prize pool |
| `draw_order` | String | Numbers in draw order (space-separated) |
| `is_special` | Boolean | Whether this was a special contest |
| `milestone_draw_number` | Integer | Associated milestone draw number (final 0/5) |
| `source_metadata` | JSON | Draw location and other raw metadata |

---

## Scheduling (production)
- Cron job running 3×/week: Tuesday, Thursday, Saturday (after 21h BRT)
- Idempotent: re-running on the same day is safe — duplicates are skipped

---

## Acceptance criteria
- [x] `ingest_mega_sena.py --full` fetches all historical draws and inserts them into the DB *(2026-05-29)*
- [x] Re-running does not create duplicates *(2026-05-29)*
- [x] Raw artifact files are saved in `data/raw/` for each draw *(2026-05-29)*
- [x] `export.py` regenerates the trusted CSV from raw JSONs *(2026-05-29)*
- [x] `seed_db.py` seeds the DB from CSV in under 5 seconds *(2026-05-29)*
- [ ] `GET /drawings` returns a paginated list with correct draw dates and numbers
- [ ] `GET /ingest/status` shows the timestamp of the last successful run
- [ ] New drawings appear automatically after the scheduled job runs
