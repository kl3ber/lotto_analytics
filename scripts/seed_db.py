"""
Seed the database from data/trusted/mega_sena.csv.

Use this instead of ingest_mega_sena.py --full for new deployments.
Reads the trusted CSV and bulk-inserts all rows — typically completes in
under 2 seconds vs ~7 minutes for a full API fetch.

Safe to run multiple times: skips drawing numbers already in the database.
Use --truncate to drop and reload from scratch (faster for full reseeds).

Usage:
    python scripts/seed_db.py
    python scripts/seed_db.py --truncate
"""

import argparse
import csv
import logging
import os
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

# reuse the model and init_db from the ingestion script
import sys  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent))
from ingest_mega_sena import Drawing, init_db  # noqa: E402

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lotto.db")
TRUSTED_CSV = Path(__file__).parent.parent / "data" / "trusted" / "mega_sena.csv"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def parse_row(row: dict) -> dict:
    def to_date(val: str) -> date | None:
        return date.fromisoformat(val) if val else None

    def to_int(val: str) -> int:
        return int(val) if val else 0

    def to_float(val: str) -> float:
        return float(val) if val else 0.0

    def to_bool(val: str) -> bool:
        return val.strip().lower() == "true"

    return {
        "drawing_number": to_int(row["drawing_number"]),
        "draw_date": to_date(row["draw_date"]),
        "n1": to_int(row["n1"]),
        "n2": to_int(row["n2"]),
        "n3": to_int(row["n3"]),
        "n4": to_int(row["n4"]),
        "n5": to_int(row["n5"]),
        "n6": to_int(row["n6"]),
        "draw_sum": to_int(row["draw_sum"]),
        "total_prize": to_float(row["total_prize"]),
        "roll_over": to_bool(row["roll_over"]),
        "next_draw_date": to_date(row["next_draw_date"]),
        "winners_6": to_int(row["winners_6"]),
        "prize_6": to_float(row["prize_6"]),
        "winners_5": to_int(row["winners_5"]),
        "prize_5": to_float(row["prize_5"]),
        "winners_4": to_int(row["winners_4"]),
        "prize_4": to_float(row["prize_4"]),
        "total_collected": to_float(row["total_collected"]),
        "next_accumulated": to_float(row["next_accumulated"]),
        "next_estimated": to_float(row["next_estimated"]),
        "special_accumulated": to_float(row["special_accumulated"]),
        "milestone_accumulated": to_float(row["milestone_accumulated"]),
        "draw_order": row.get("draw_order") or None,
        "is_special": to_bool(row.get("is_special", "False")),
        "milestone_draw_number": to_int(row["milestone_draw_number"])
        if row.get("milestone_draw_number")
        else None,
    }


def load_csv() -> list[dict]:
    if not TRUSTED_CSV.exists():
        log.error("trusted CSV not found: %s", TRUSTED_CSV)
        log.error("run 'python scripts/export.py' first")
        raise SystemExit(1)
    with open(TRUSTED_CSV, newline="", encoding="utf-8") as f:
        return [parse_row(row) for row in csv.DictReader(f)]


def seed(truncate: bool = False, engine=None) -> None:
    if engine is None:
        engine = create_engine(DATABASE_URL)
    init_db(engine)

    rows = load_csv()

    if truncate:
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM drawings"))
        log.info("table truncated")

    with engine.begin() as conn:
        existing = {
            r[0] for r in conn.execute(text("SELECT drawing_number FROM drawings"))
        }

    new_rows = [r for r in rows if r["drawing_number"] not in existing]

    if not new_rows:
        log.info("database already up to date (%d drawings)", len(rows))
        return

    with engine.begin() as conn:
        conn.execute(Drawing.__table__.insert(), new_rows)

    log.info("inserted %d drawings (%d already existed)", len(new_rows), len(existing))


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed database from trusted CSV")
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="delete all existing rows before inserting (full reseed)",
    )
    args = parser.parse_args()
    seed(truncate=args.truncate)


if __name__ == "__main__":
    main()
