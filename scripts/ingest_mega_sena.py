"""
Mega-Sena ingestion script.

Fetches results from the official Caixa API and persists them to the database
and to data/trusted/mega_sena.csv (the canonical historical snapshot).

Incremental mode uses the trusted CSV as source of truth — only draws absent
from the CSV are fetched from the API.

Usage:
    python scripts/ingest_mega_sena.py           # fetch only new draws (default)
    python scripts/ingest_mega_sena.py --full    # fetch all draws missing from the CSV
    python scripts/ingest_mega_sena.py --draw 100  # fetch a specific draw number
"""

import argparse
import csv
import json
import logging
import os
import time
from datetime import date, datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Integer,
    JSON,
    Numeric,
    String,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lotto.db")
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
TRUSTED_DIR = Path(__file__).parent.parent / "data" / "trusted"
TRUSTED_CSV = TRUSTED_DIR / "mega_sena.csv"
REQUEST_DELAY = 0.15  # seconds between API calls to avoid rate limiting

CSV_COLUMNS = [
    "drawing_number", "draw_date",
    "n1", "n2", "n3", "n4", "n5", "n6",
    "draw_sum", "total_prize", "roll_over", "next_draw_date",
    "winners_6", "prize_6",
    "winners_5", "prize_5",
    "winners_4", "prize_4",
    "total_collected", "next_accumulated",
    "next_estimated", "special_accumulated", "milestone_accumulated",
    "draw_order", "is_special", "milestone_draw_number",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database model
# NOTE: these models will be moved to backend/app/models/ when the backend
# is built. Scripts will then import from there.
# ---------------------------------------------------------------------------


class Base(DeclarativeBase):
    pass


class Drawing(Base):
    __tablename__ = "drawings"

    drawing_id = Column(Integer, primary_key=True, autoincrement=True)
    drawing_number = Column(Integer, unique=True, nullable=False, index=True)
    draw_date = Column(Date, nullable=False)
    n1 = Column(Integer, nullable=False)
    n2 = Column(Integer, nullable=False)
    n3 = Column(Integer, nullable=False)
    n4 = Column(Integer, nullable=False)
    n5 = Column(Integer, nullable=False)
    n6 = Column(Integer, nullable=False)
    draw_sum = Column(Integer, nullable=False)
    total_prize = Column(Numeric(15, 2))
    roll_over = Column(Boolean, default=False)
    next_draw_date = Column(Date, nullable=True)
    # prize tiers
    winners_6 = Column(Integer, default=0)
    prize_6 = Column(Numeric(15, 2), default=0)
    winners_5 = Column(Integer, default=0)
    prize_5 = Column(Numeric(15, 2), default=0)
    winners_4 = Column(Integer, default=0)
    prize_4 = Column(Numeric(15, 2), default=0)
    # financials
    total_collected = Column(Numeric(15, 2), default=0)
    next_accumulated = Column(Numeric(15, 2), default=0)
    next_estimated = Column(Numeric(15, 2), default=0)
    special_accumulated = Column(Numeric(15, 2), default=0)
    milestone_accumulated = Column(Numeric(15, 2), default=0)
    draw_order = Column(String, nullable=True)
    is_special = Column(Boolean, default=False)
    milestone_draw_number = Column(Integer, nullable=True)
    source_metadata = Column(JSON)


def init_db(engine) -> None:
    Base.metadata.create_all(engine)


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": "lotto-analytics/0.1 (data ingestion; github.com/kl3ber/lotto_analytics)"
}


def fetch_draw(number: int | None = None) -> dict:
    url = f"{BASE_URL}/{number}" if number else BASE_URL
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.json()


def get_latest_draw_number() -> int:
    data = fetch_draw()
    return data["numero"]


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%d/%m/%Y").date()
    except ValueError:
        return None


def _prize_by_faixa(raw: dict, faixa: int) -> tuple[int, float]:
    """Return (numero_ganhadores, valor_premio) for a given faixa."""
    entry = next((f for f in raw.get("listaRateioPremio", []) if f["faixa"] == faixa), None)
    if entry is None:
        return 0, 0.0
    return entry["numeroDeGanhadores"], entry["valorPremio"]


def parse_drawing(raw: dict) -> dict:
    numbers = sorted(int(n) for n in raw["listaDezenas"])
    winners_6, prize_6 = _prize_by_faixa(raw, 1)
    winners_5, prize_5 = _prize_by_faixa(raw, 2)
    winners_4, prize_4 = _prize_by_faixa(raw, 3)

    return {
        "drawing_number": raw["numero"],
        "draw_date": parse_date(raw["dataApuracao"]),
        "n1": numbers[0],
        "n2": numbers[1],
        "n3": numbers[2],
        "n4": numbers[3],
        "n5": numbers[4],
        "n6": numbers[5],
        "draw_sum": sum(numbers),
        "total_prize": raw.get("valorTotalPremioFaixaUm") or 0,
        "roll_over": raw.get("acumulado", False),
        "next_draw_date": parse_date(raw.get("dataProximoConcurso")),
        "winners_6": winners_6,
        "prize_6": prize_6,
        "winners_5": winners_5,
        "prize_5": prize_5,
        "winners_4": winners_4,
        "prize_4": prize_4,
        "total_collected": raw.get("valorArrecadado") or 0,
        "next_accumulated": raw.get("valorAcumuladoProximoConcurso") or 0,
        "next_estimated": raw.get("valorEstimadoProximoConcurso") or 0,
        "special_accumulated": raw.get("valorAcumuladoConcursoEspecial") or 0,
        "milestone_accumulated": raw.get("valorAcumuladoConcurso_0_5") or 0,
        "draw_order": " ".join(str(int(n)) for n in raw.get("dezenasSorteadasOrdemSorteio") or []),
        "is_special": bool(raw.get("indicadorConcursoEspecial", 0)),
        "milestone_draw_number": raw.get("numeroConcursoFinal_0_5") or None,
        "source_metadata": {
            "dezenas_ordem_sorteio": raw.get("dezenasSorteadasOrdemSorteio"),
            "local_sorteio": raw.get("localSorteio"),
        },
    }


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def save_raw(raw: dict, number: int) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"mega_sena_{number:04d}.json"
    path.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")


def already_stored(session: Session, number: int) -> bool:
    return session.query(Drawing.drawing_number).filter_by(drawing_number=number).first() is not None


def upsert_drawing(session: Session, parsed: dict) -> None:
    if not already_stored(session, parsed["drawing_number"]):
        session.add(Drawing(**parsed))
        session.commit()


# ---------------------------------------------------------------------------
# Trusted CSV helpers
# ---------------------------------------------------------------------------


def get_csv_numbers() -> set[int]:
    """Return the set of drawing numbers already present in the trusted CSV."""
    if not TRUSTED_CSV.exists():
        return set()
    with open(TRUSTED_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {int(row["drawing_number"]) for row in reader}


def append_to_csv(parsed: dict) -> None:
    """Append a single parsed drawing to the trusted CSV."""
    TRUSTED_DIR.mkdir(parents=True, exist_ok=True)
    write_header = not TRUSTED_CSV.exists()
    with open(TRUSTED_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        if write_header:
            writer.writeheader()
        writer.writerow(parsed)


# ---------------------------------------------------------------------------
# Ingestion modes
# ---------------------------------------------------------------------------


def fetch_and_persist(session: Session, number: int) -> bool:
    """Fetch one draw, save raw artifact, upsert DB, append CSV. Returns True if inserted."""
    raw = fetch_draw(number)
    save_raw(raw, number)
    parsed = parse_drawing(raw)
    upsert_drawing(session, parsed)
    append_to_csv(parsed)
    return True


def ingest_single(session: Session, number: int) -> None:
    existing = get_csv_numbers()
    if number in existing:
        log.info("draw %d already in CSV, skipping", number)
        return
    log.info("fetching draw %d", number)
    fetch_and_persist(session, number)
    log.info("draw %d inserted", number)


def ingest_update(session: Session) -> None:
    """Fetch only draws newer than the max number in the trusted CSV."""
    latest = get_latest_draw_number()
    existing = get_csv_numbers()
    max_csv = max(existing) if existing else 0
    missing = list(range(max_csv + 1, latest + 1))

    if not missing:
        log.info("CSV is up to date (latest draw: %d)", latest)
        return

    log.info("fetching %d new draw(s): %d → %d", len(missing), missing[0], missing[-1])
    inserted = 0
    for number in missing:
        try:
            fetch_and_persist(session, number)
            inserted += 1
            time.sleep(REQUEST_DELAY)
        except Exception as e:
            log.warning("draw %d — %s, skipping", number, e)

    log.info("done — %d draw(s) inserted", inserted)


def ingest_full(session: Session) -> None:
    """Fetch all draws missing from the trusted CSV (gaps included)."""
    latest = get_latest_draw_number()
    existing = get_csv_numbers()
    missing = sorted(set(range(1, latest + 1)) - existing)

    if not missing:
        log.info("CSV is complete (draws 1–%d)", latest)
        return

    log.info("fetching %d missing draw(s) out of %d total", len(missing), latest)
    inserted = 0
    for number in missing:
        try:
            fetch_and_persist(session, number)
            inserted += 1
            if inserted % 100 == 0:
                log.info("progress: %d/%d inserted", inserted, len(missing))
        except requests.HTTPError as e:
            log.warning("draw %d — HTTP %s, skipping", number, e.response.status_code)
        except Exception as e:
            log.warning("draw %d — %s, skipping", number, e)
        time.sleep(REQUEST_DELAY)

    log.info("done — %d inserted", inserted)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Mega-Sena data ingestion")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--full", action="store_true", help="fetch all historical draws")
    group.add_argument("--draw", type=int, metavar="N", help="fetch a specific draw number")
    args = parser.parse_args()

    engine = create_engine(DATABASE_URL)
    init_db(engine)
    session_factory = sessionmaker(bind=engine)

    with session_factory() as session:
        if args.full:
            ingest_full(session)
        elif args.draw:
            ingest_single(session, args.draw)
        else:
            ingest_update(session)


if __name__ == "__main__":
    main()
