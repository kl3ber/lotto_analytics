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


@pytest.fixture
def client_large(db_engine):
    """Client with 30 draws — enough to exercise computation paths in statistics endpoints."""
    session_factory = sessionmaker(bind=db_engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    number_sets = [
        (1, 5, 10, 20, 40, 60),
        (2, 6, 11, 21, 41, 59),
        (3, 7, 12, 22, 42, 58),
        (4, 8, 13, 23, 43, 57),
        (5, 9, 14, 24, 44, 56),
        (6, 10, 15, 25, 45, 55),
        (7, 11, 16, 26, 46, 54),
        (8, 12, 17, 27, 47, 53),
        (9, 13, 18, 28, 48, 52),
        (10, 14, 19, 29, 49, 51),
        (1, 15, 20, 30, 50, 60),
        (2, 16, 21, 31, 41, 59),
        (3, 17, 22, 32, 42, 58),
        (4, 18, 23, 33, 43, 57),
        (5, 19, 24, 34, 44, 56),
        (6, 20, 25, 35, 45, 55),
        (7, 21, 26, 36, 46, 54),
        (8, 22, 27, 37, 47, 53),
        (9, 23, 28, 38, 48, 52),
        (10, 24, 29, 39, 49, 51),
        (11, 25, 30, 40, 50, 60),
        (12, 26, 31, 41, 51, 59),
        (13, 27, 32, 42, 52, 58),
        (14, 28, 33, 43, 53, 57),
        (15, 29, 34, 44, 54, 56),
        (16, 30, 35, 45, 55, 60),
        (17, 31, 36, 46, 56, 59),
        (18, 32, 37, 47, 57, 58),
        (19, 33, 38, 48, 58, 60),
        (20, 34, 39, 49, 59, 60),
    ]
    rows = [
        make_drawing(
            drawing_number=i + 1,
            draw_date=date(2020 + i // 12, (i % 12) + 1, 1),
            n1=s[0],
            n2=s[1],
            n3=s[2],
            n4=s[3],
            n5=s[4],
            n6=s[5],
        )
        for i, s in enumerate(number_sets)
    ]
    with db_engine.begin() as conn:
        conn.execute(Drawing.__table__.insert(), rows)

    yield TestClient(app)
    app.dependency_overrides.clear()
