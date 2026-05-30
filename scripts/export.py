"""
Export all drawings to data/trusted/mega_sena.csv.

Reads from data/raw/ JSON files (canonical source) so all fields including
prize data are included without requiring DB schema changes.

Usage:
    python scripts/export.py
"""

import csv
import json
import logging
import sys
from pathlib import Path

# reuse parse_drawing and CSV_COLUMNS from the ingestion script
sys.path.insert(0, str(Path(__file__).parent))
from ingest_mega_sena import CSV_COLUMNS, parse_drawing  # noqa: E402

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
TRUSTED_DIR = Path(__file__).parent.parent / "data" / "trusted"
CSV_PATH = TRUSTED_DIR / "mega_sena.csv"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def export() -> None:
    raw_files = sorted(RAW_DIR.glob("mega_sena_*.json"))
    if not raw_files:
        log.error(
            "no raw files found in %s — run ingest_mega_sena.py --full first", RAW_DIR
        )
        return

    TRUSTED_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    errors = 0

    for path in raw_files:
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            rows.append(parse_drawing(raw))
        except Exception as e:
            log.warning("skipping %s — %s", path.name, e)
            errors += 1

    rows.sort(key=lambda r: r["drawing_number"])

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    log.info(
        "exported %d drawings → %s%s",
        len(rows),
        CSV_PATH,
        f"  ({errors} skipped)" if errors else "",
    )


if __name__ == "__main__":
    export()
