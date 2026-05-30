"""Tests for CSV helpers: get_csv_numbers and append_to_csv."""

import csv

import pytest

from ingest_mega_sena import CSV_COLUMNS, append_to_csv, get_csv_numbers


@pytest.fixture(autouse=True)
def patch_trusted_csv(tmp_path, monkeypatch):
    """Redirect TRUSTED_CSV and TRUSTED_DIR to a temp directory for all tests."""
    import ingest_mega_sena as m

    monkeypatch.setattr(m, "TRUSTED_DIR", tmp_path)
    monkeypatch.setattr(m, "TRUSTED_CSV", tmp_path / "mega_sena.csv")


class TestGetCsvNumbers:
    def test_returns_empty_set_when_file_missing(self):
        result = get_csv_numbers()
        assert result == set()

    def test_returns_drawing_numbers_from_existing_csv(self, tmp_path):
        csv_path = tmp_path / "mega_sena.csv"
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            writer.writeheader()
            writer.writerow(
                {
                    col: ("100" if col == "drawing_number" else "0")
                    for col in CSV_COLUMNS
                }
            )
            writer.writerow(
                {
                    col: ("200" if col == "drawing_number" else "0")
                    for col in CSV_COLUMNS
                }
            )

        result = get_csv_numbers()
        assert result == {100, 200}


class TestAppendToCsv:
    def test_creates_file_with_header_on_first_write(self, tmp_path):
        row = {col: 0 for col in CSV_COLUMNS}
        row["drawing_number"] = 1
        append_to_csv(row)

        csv_path = tmp_path / "mega_sena.csv"
        assert csv_path.exists()
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            assert reader.fieldnames == CSV_COLUMNS
            rows = list(reader)
        assert len(rows) == 1
        assert rows[0]["drawing_number"] == "1"

    def test_appends_without_duplicate_header(self, tmp_path):
        row = {col: 0 for col in CSV_COLUMNS}
        row["drawing_number"] = 1
        append_to_csv(row)
        row["drawing_number"] = 2
        append_to_csv(row)

        csv_path = tmp_path / "mega_sena.csv"
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        assert len(rows) == 2
        assert rows[0]["drawing_number"] == "1"
        assert rows[1]["drawing_number"] == "2"

    def test_ignores_extra_keys(self, tmp_path):
        row = {col: 0 for col in CSV_COLUMNS}
        row["drawing_number"] = 1
        row["unexpected_field"] = "should_be_ignored"
        append_to_csv(row)  # must not raise

        csv_path = tmp_path / "mega_sena.csv"
        assert csv_path.exists()
