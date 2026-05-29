"""
Mega-Sena ingestion script.

Fetches results from the official Caixa API and persists them to the database.
Raw JSON responses are saved to data/raw/ for traceability.

Usage:
    python scripts/ingest_mega_sena.py           # fetch only new draws
    python scripts/ingest_mega_sena.py --full    # fetch all historical draws (1 to latest)
    python scripts/ingest_mega_sena.py --draw 100  # fetch a specific draw number
"""

import argparse
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
    func,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lotto.db")
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
REQUEST_DELAY = 0.15  # seconds between API calls to avoid rate limiting

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


def parse_drawing(raw: dict) -> dict:
    numbers = sorted(int(n) for n in raw["listaDezenas"])

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
        "source_metadata": {
            "dezenas_ordem_sorteio": raw.get("dezenasSorteadasOrdemSorteio"),
            "local_sorteio": raw.get("localSorteio"),
            "valor_arrecadado": raw.get("valorArrecadado"),
            "valor_acumulado_proximo": raw.get("valorAcumuladoProximoConcurso"),
        },
    }


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def save_raw(raw: dict, number: int) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"mega_sena_{number:04d}.json"
    path.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")


def get_max_stored_number(session: Session) -> int:
    result = session.query(func.max(Drawing.drawing_number)).scalar()
    return result or 0


def already_stored(session: Session, number: int) -> bool:
    return session.query(Drawing.drawing_number).filter_by(drawing_number=number).first() is not None


def upsert_drawing(session: Session, parsed: dict) -> bool:
    if already_stored(session, parsed["drawing_number"]):
        return False
    session.add(Drawing(**parsed))
    session.commit()
    return True


# ---------------------------------------------------------------------------
# Ingestion modes
# ---------------------------------------------------------------------------


def ingest_single(session: Session, number: int) -> None:
    if already_stored(session, number):
        log.info("draw %d already in database, skipping", number)
        return

    log.info("fetching draw %d", number)
    raw = fetch_draw(number)
    save_raw(raw, number)
    parsed = parse_drawing(raw)
    upsert_drawing(session, parsed)
    log.info("draw %d inserted (%s)", number, parsed["draw_date"])


def ingest_update(session: Session) -> None:
    latest = get_latest_draw_number()
    stored = get_max_stored_number(session)
    missing = list(range(stored + 1, latest + 1))

    if not missing:
        log.info("database is up to date (latest draw: %d)", latest)
        return

    log.info("fetching %d new draw(s): %d → %d", len(missing), missing[0], missing[-1])
    inserted = 0
    for number in missing:
        ingest_single(session, number)
        inserted += 1
        time.sleep(REQUEST_DELAY)

    log.info("done — %d draw(s) inserted", inserted)


def ingest_full(session: Session) -> None:
    latest = get_latest_draw_number()
    log.info("full ingestion: draws 1 → %d", latest)

    inserted = 0
    skipped = 0
    for number in range(1, latest + 1):
        if already_stored(session, number):
            skipped += 1
            continue
        try:
            raw = fetch_draw(number)
            save_raw(raw, number)
            parsed = parse_drawing(raw)
            upsert_drawing(session, parsed)
            inserted += 1
            if inserted % 100 == 0:
                log.info("progress: %d/%d inserted", inserted, latest)
        except requests.HTTPError as e:
            log.warning("draw %d — HTTP %s, skipping", number, e.response.status_code)
        except Exception as e:
            log.warning("draw %d — unexpected error: %s, skipping", number, e)
        time.sleep(REQUEST_DELAY)

    log.info("done — %d inserted, %d already existed", inserted, skipped)


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
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        if args.full:
            ingest_full(session)
        elif args.draw:
            ingest_single(session, args.draw)
        else:
            ingest_update(session)


if __name__ == "__main__":
    main()
