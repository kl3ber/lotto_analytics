import sys
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))

from ingest_mega_sena import Base, Drawing  # noqa: E402
from app.main import app  # noqa: E402
from app.database import get_db  # noqa: E402


def make_drawing(**kwargs) -> dict:
    defaults = {
        "drawing_number": 1,
        "draw_date": date(2026, 1, 1),
        "n1": 1,
        "n2": 5,
        "n3": 10,
        "n4": 20,
        "n5": 40,
        "n6": 60,
        "draw_sum": 136,
        "total_prize": 0.0,
        "roll_over": True,
        "winners_6": 0,
        "prize_6": 0.0,
        "winners_5": 10,
        "prize_5": 1234.56,
        "winners_4": 500,
        "prize_4": 78.90,
        "total_collected": 1_000_000.0,
        "next_accumulated": 2_000_000.0,
        "next_estimated": 3_000_000.0,
        "special_accumulated": 500_000.0,
        "milestone_accumulated": 400_000.0,
        "draw_order": "60 1 40 5 20 10",
        "is_special": False,
        "milestone_draw_number": None,
    }
    return {**defaults, **kwargs}


@pytest.fixture
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def client(db_engine):
    session_factory = sessionmaker(bind=db_engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with db_engine.begin() as conn:
        conn.execute(
            Drawing.__table__.insert(),
            [
                make_drawing(
                    drawing_number=1,
                    draw_date=date(2020, 1, 1),
                    roll_over=True,
                    draw_sum=100,
                ),
                make_drawing(
                    drawing_number=2,
                    draw_date=date(2021, 6, 15),
                    roll_over=False,
                    winners_6=1,
                    prize_6=5_000_000.0,
                    draw_sum=150,
                ),
                make_drawing(
                    drawing_number=3,
                    draw_date=date(2022, 12, 31),
                    roll_over=False,
                    winners_6=2,
                    prize_6=10_000_000.0,
                    draw_sum=200,
                ),
            ],
        )

    yield TestClient(app)
    app.dependency_overrides.clear()
