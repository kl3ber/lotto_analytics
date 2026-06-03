"""Tests for GET /analytics/patterns."""

import pytest


class TestPatterns:
    def test_returns_200(self, client):
        r = client.get("/analytics/patterns")
        assert r.status_code == 200

    def test_total_drawings(self, client):
        assert client.get("/analytics/patterns").json()["total_drawings"] == 3

    def test_date_filter(self, client):
        r = client.get("/analytics/patterns?date_from=2022-01-01")
        assert r.json()["total_drawings"] == 1

    def test_all_metric_keys_present(self, client):
        body = client.get("/analytics/patterns").json()
        expected = [
            "sum",
            "parity",
            "low_high",
            "spacing",
            "amplitude",
            "consecutives",
            "repeats",
            "primes",
            "fibonacci",
            "mult3",
            "mult5",
            "quartiles",
            "sum_parity",
            "sum_stat",
            "sum_parity_stat",
        ]
        for key in expected:
            assert key in body, f"missing key: {key}"

    def test_bucket_item_fields(self, client):
        body = client.get("/analytics/patterns").json()
        bucket = body["parity"][0]
        for field in ("label", "count", "percentage", "expected_percentage"):
            assert field in bucket

    def test_sum_stat_fields(self, client):
        stat = client.get("/analytics/patterns").json()["sum_stat"]
        for field in ("mean", "std_dev", "min", "max", "most_common"):
            assert field in stat

    def test_sum_parity_stat_fields(self, client):
        stat = client.get("/analytics/patterns").json()["sum_parity_stat"]
        assert "mean" in stat and "std_dev" in stat

    def test_quartiles_has_four_buckets(self, client):
        quartiles = client.get("/analytics/patterns").json()["quartiles"]
        assert len(quartiles) == 4

    def test_quartile_labels(self, client):
        labels = [
            q["label"] for q in client.get("/analytics/patterns").json()["quartiles"]
        ]
        assert labels == ["Q1 (1–15)", "Q2 (16–30)", "Q3 (31–45)", "Q4 (46–60)"]

    def test_quartile_expected_percentage(self, client):
        for q in client.get("/analytics/patterns").json()["quartiles"]:
            assert q["expected_percentage"] == pytest.approx(25.0)

    def test_parity_buckets_count_to_total(self, client):
        body = client.get("/analytics/patterns").json()
        total = body["total_drawings"]
        assert sum(b["count"] for b in body["parity"]) == total

    def test_sum_stat_mean_within_range(self, client):
        # all 3 draws use n1=1,n2=5,n3=10,n4=20,n5=40,n6=60 → sum=136 each
        stat = client.get("/analytics/patterns").json()["sum_stat"]
        assert stat["mean"] == pytest.approx(136.0)
        assert stat["min"] == 136
        assert stat["max"] == 136

    def test_empty_result_on_no_match(self, client):
        r = client.get("/analytics/patterns?date_from=2099-01-01")
        assert r.status_code == 200
        assert r.json()["total_drawings"] == 0
