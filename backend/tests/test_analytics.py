"""Tests for GET /analytics/frequency, /analytics/prizes, /analytics/cooccurrence."""

import pytest


class TestFrequency:
    def test_returns_all_60_numbers(self, client):
        r = client.get("/analytics/frequency")
        assert r.status_code == 200
        assert len(r.json()["frequencies"]) == 60

    def test_total_drawings(self, client):
        r = client.get("/analytics/frequency")
        assert r.json()["total_drawings"] == 3

    def test_known_numbers_have_count_3(self, client):
        r = client.get("/analytics/frequency")
        freqs = {f["number"]: f["count"] for f in r.json()["frequencies"]}
        for n in (1, 5, 10, 20, 40, 60):
            assert freqs[n] == 3

    def test_unseen_numbers_have_count_zero(self, client):
        r = client.get("/analytics/frequency")
        freqs = {f["number"]: f["count"] for f in r.json()["frequencies"]}
        for n in (2, 3, 4, 6, 7):
            assert freqs[n] == 0

    def test_date_filter_reduces_total(self, client):
        r = client.get("/analytics/frequency?date_from=2022-01-01")
        assert r.json()["total_drawings"] == 1

    def test_recent_window_returned(self, client):
        r = client.get("/analytics/frequency?recent=50")
        assert r.json()["recent_window"] == 50

    def test_global_percentage_present(self, client):
        r = client.get("/analytics/frequency")
        f = r.json()["frequencies"][0]
        assert "global_percentage" in f

    def test_drought_fields_present(self, client):
        r = client.get("/analytics/frequency")
        f = next(x for x in r.json()["frequencies"] if x["number"] == 1)
        assert f["last_seen"] == 3
        assert f["current_drought"] == 0
        assert "last_seen_date" in f

    def test_unseen_number_drought_equals_total(self, client):
        r = client.get("/analytics/frequency")
        f = next(x for x in r.json()["frequencies"] if x["number"] == 2)
        assert f["current_drought"] == 3
        assert f["last_seen"] is None


class TestPrizes:
    def test_returns_all_drawings(self, client):
        r = client.get("/analytics/prizes")
        assert r.status_code == 200
        assert len(r.json()["points"]) == 3

    def test_ordered_by_date(self, client):
        r = client.get("/analytics/prizes")
        dates = [p["draw_date"] for p in r.json()["points"]]
        assert dates == sorted(dates)

    def test_prize_values(self, client):
        r = client.get("/analytics/prizes")
        prizes = {p["drawing_number"]: p["prize_6"] for p in r.json()["points"]}
        assert prizes[1] == 0.0
        assert prizes[2] == 5_000_000.0
        assert prizes[3] == 10_000_000.0

    def test_roll_over_flag(self, client):
        r = client.get("/analytics/prizes")
        points = {p["drawing_number"]: p["roll_over"] for p in r.json()["points"]}
        assert points[1] is True
        assert points[2] is False

    def test_prize_tier_fields_present(self, client):
        r = client.get("/analytics/prizes")
        p = r.json()["points"][0]
        for field in ("prize_5", "winners_5", "prize_4", "winners_4"):
            assert field in p

    def test_accumulation_structure(self, client):
        r = client.get("/analytics/prizes")
        acc = r.json()["accumulation"]
        assert acc["total_cycles"] == 2
        assert acc["min_length"] == 1
        assert acc["max_length"] == 2
        assert "avg_length" in acc
        assert "longest" in acc
        assert len(acc["distribution"]) > 0

    def test_accumulation_cycle_lengths(self, client):
        # draw 1: roll_over=True, draw 2: winners_6=1 → cycle of 2
        # draw 3: winners_6=2 → cycle of 1
        r = client.get("/analytics/prizes")
        acc = r.json()["accumulation"]
        dist = {int(b["label"]): b["count"] for b in acc["distribution"]}
        assert dist[1] == 1  # one cycle of length 1
        assert dist[2] == 1  # one cycle of length 2

    def test_milestones_structure(self, client):
        r = client.get("/analytics/prizes")
        milestones = r.json()["milestones"]
        assert len(milestones) == 3
        thresholds = [m["threshold_m"] for m in milestones]
        assert thresholds == [50, 100, 200]
        for m in milestones:
            assert "count_individual" in m
            assert "count_sena_total" in m
            assert "count_distributed" in m

    def test_milestones_counts(self, client):
        # prize_6=5M (draw 2, 1 winner) and prize_6=10M (draw 3, 2 winners → total 20M)
        r = client.get("/analytics/prizes")
        milestones = {m["threshold_m"]: m for m in r.json()["milestones"]}
        assert milestones[50]["count_individual"] == 0
        assert milestones[50]["count_sena_total"] == 0

    def test_record_prizes(self, client):
        r = client.get("/analytics/prizes")
        body = r.json()
        assert body["record_individual"] == pytest.approx(10_000_000.0)
        assert body["record_sena_total"] == pytest.approx(
            20_000_000.0
        )  # 10M × 2 winners
        assert "record_distributed" in body


class TestCooccurrence:
    def test_returns_pairs(self, client):
        r = client.get("/analytics/cooccurrence")
        assert r.status_code == 200
        body = r.json()
        assert len(body["top"]) == 10
        assert len(body["bottom"]) == 10

    def test_all_pairs_count_3(self, client):
        r = client.get("/analytics/cooccurrence")
        for p in r.json()["top"]:
            assert p["count"] == 3

    def test_total_drawings(self, client):
        r = client.get("/analytics/cooccurrence")
        assert r.json()["total_drawings"] == 3

    def test_top_n_parameter(self, client):
        r = client.get("/analytics/cooccurrence?top_n=5")
        assert len(r.json()["top"]) == 5
        assert len(r.json()["bottom"]) == 5

    def test_pair_fields(self, client):
        r = client.get("/analytics/cooccurrence")
        p = r.json()["top"][0]
        assert "n1" in p and "n2" in p and "count" in p and "percentage" in p
