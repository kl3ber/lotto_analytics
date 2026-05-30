"""Tests for seed_db: parse_row and seed()."""

import csv
from datetime import date

import pytest
from sqlalchemy import create_engine, text

from ingest_mega_sena import Base, CSV_COLUMNS
from seed_db import parse_row, seed


@pytest.fixture
def in_memory_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def trusted_csv(tmp_path):
    """Write a small trusted CSV with 3 sample rows."""
    csv_path = tmp_path / "mega_sena.csv"

    def make_row(n: int) -> dict:
        return {
            "drawing_number": str(n),
            "draw_date": "2026-01-01",
            "n1": "1", "n2": "2", "n3": "3", "n4": "4", "n5": "5", "n6": "6",
            "draw_sum": "21",
            "total_prize": "0.0",
            "roll_over": "False",
            "next_draw_date": "2026-01-04",
            "winners_6": "0", "prize_6": "0.0",
            "winners_5": "10", "prize_5": "1234.56",
            "winners_4": "500", "prize_4": "78.90",
            "total_collected": "1000000.0",
            "next_accumulated": "2000000.0",
            "next_estimated": "3000000.0",
            "special_accumulated": "500000.0",
            "milestone_accumulated": "400000.0",
            "draw_order": "1 2 3 4 5 6",
            "is_special": "False",
            "milestone_draw_number": "",
        }

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for i in [1, 2, 3]:
            writer.writerow(make_row(i))

    return csv_path


class TestParseRow:
    def test_integers(self, sample_csv_row):
        result = parse_row(sample_csv_row)
        assert result["drawing_number"] == 3011
        assert result["winners_5"] == 16
        assert result["draw_sum"] == 170

    def test_floats(self, sample_csv_row):
        result = parse_row(sample_csv_row)
        assert abs(result["prize_5"] - 54125.58) < 0.01
        assert abs(result["total_collected"] - 21732324.0) < 0.01

    def test_bool_true(self, sample_csv_row):
        sample_csv_row["roll_over"] = "True"
        assert parse_row(sample_csv_row)["roll_over"] is True

    def test_bool_false(self, sample_csv_row):
        sample_csv_row["roll_over"] = "False"
        assert parse_row(sample_csv_row)["roll_over"] is False

    def test_date_parsing(self, sample_csv_row):
        result = parse_row(sample_csv_row)
        assert result["draw_date"] == date(2026, 5, 26)
        assert result["next_draw_date"] == date(2026, 5, 28)

    def test_empty_next_draw_date(self, sample_csv_row):
        sample_csv_row["next_draw_date"] = ""
        assert parse_row(sample_csv_row)["next_draw_date"] is None

    def test_draw_order(self, sample_csv_row):
        result = parse_row(sample_csv_row)
        assert result["draw_order"] == "2 5 60 36 27 40"

    def test_is_special_false(self, sample_csv_row):
        assert parse_row(sample_csv_row)["is_special"] is False

    def test_is_special_true(self, sample_csv_row):
        sample_csv_row["is_special"] = "True"
        assert parse_row(sample_csv_row)["is_special"] is True

    def test_milestone_draw_number(self, sample_csv_row):
        assert parse_row(sample_csv_row)["milestone_draw_number"] == 3050

    def test_milestone_draw_number_empty(self, sample_csv_row):
        sample_csv_row["milestone_draw_number"] = ""
        assert parse_row(sample_csv_row)["milestone_draw_number"] is None


class TestSeed:
    def test_inserts_all_rows(self, in_memory_engine, trusted_csv, monkeypatch):
        monkeypatch.setattr("seed_db.TRUSTED_CSV", trusted_csv)
        seed(engine=in_memory_engine)
        with in_memory_engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM drawings")).scalar()
        assert count == 3

    def test_idempotent(self, in_memory_engine, trusted_csv, monkeypatch):
        monkeypatch.setattr("seed_db.TRUSTED_CSV", trusted_csv)
        seed(engine=in_memory_engine)
        seed(engine=in_memory_engine)
        with in_memory_engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM drawings")).scalar()
        assert count == 3

    def test_truncate_reseeds(self, in_memory_engine, trusted_csv, monkeypatch):
        monkeypatch.setattr("seed_db.TRUSTED_CSV", trusted_csv)
        seed(engine=in_memory_engine)
        seed(truncate=True, engine=in_memory_engine)
        with in_memory_engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM drawings")).scalar()
        assert count == 3

    def test_skips_existing_drawing_numbers(self, in_memory_engine, trusted_csv, monkeypatch):
        monkeypatch.setattr("seed_db.TRUSTED_CSV", trusted_csv)
        seed(engine=in_memory_engine)
        # seed again — should not insert duplicates
        seed(engine=in_memory_engine)
        with in_memory_engine.connect() as conn:
            numbers = [r[0] for r in conn.execute(text("SELECT drawing_number FROM drawings ORDER BY drawing_number"))]
        assert numbers == [1, 2, 3]
