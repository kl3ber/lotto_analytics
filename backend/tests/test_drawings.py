"""Tests for GET /drawings and GET /drawings/{drawing_number}."""


class TestListDrawings:
    def test_returns_all_rows(self, client):
        r = client.get("/drawings")
        assert r.status_code == 200
        assert r.json()["total"] == 3

    def test_pagination(self, client):
        r = client.get("/drawings?page=1&page_size=2")
        body = r.json()
        assert len(body["results"]) == 2
        assert body["page"] == 1
        assert body["page_size"] == 2

    def test_second_page(self, client):
        r = client.get("/drawings?page=2&page_size=2")
        assert len(r.json()["results"]) == 1

    def test_default_sort_is_draw_date_desc(self, client):
        r = client.get("/drawings")
        numbers = [row["drawing_number"] for row in r.json()["results"]]
        assert numbers == [3, 2, 1]

    def test_sort_by_draw_sum_asc(self, client):
        r = client.get("/drawings?sort=draw_sum&order=asc")
        numbers = [row["drawing_number"] for row in r.json()["results"]]
        assert numbers == [1, 2, 3]

    def test_sort_by_prize_desc(self, client):
        r = client.get("/drawings?sort=prize_6&order=desc")
        prizes = [row["prize_6"] for row in r.json()["results"]]
        assert prizes == sorted(prizes, reverse=True)

    def test_invalid_sort_returns_400(self, client):
        r = client.get("/drawings?sort=invalid_field")
        assert r.status_code == 400

    def test_filter_roll_over_true(self, client):
        r = client.get("/drawings?roll_over=true")
        body = r.json()
        assert body["total"] == 1
        assert body["results"][0]["drawing_number"] == 1

    def test_filter_roll_over_false(self, client):
        r = client.get("/drawings?roll_over=false")
        assert r.json()["total"] == 2

    def test_filter_date_from(self, client):
        r = client.get("/drawings?date_from=2022-01-01")
        assert r.json()["total"] == 1

    def test_filter_date_to(self, client):
        r = client.get("/drawings?date_to=2021-12-31")
        assert r.json()["total"] == 2

    def test_filter_date_range(self, client):
        r = client.get("/drawings?date_from=2021-01-01&date_to=2021-12-31")
        assert r.json()["total"] == 1
        assert r.json()["results"][0]["drawing_number"] == 2

    def test_filter_drawing_from(self, client):
        r = client.get("/drawings?drawing_from=2")
        assert r.json()["total"] == 2

    def test_filter_drawing_to(self, client):
        r = client.get("/drawings?drawing_to=2")
        assert r.json()["total"] == 2

    def test_filter_drawing_range(self, client):
        r = client.get("/drawings?drawing_from=2&drawing_to=2")
        assert r.json()["total"] == 1
        assert r.json()["results"][0]["drawing_number"] == 2

    def test_combined_filters(self, client):
        r = client.get("/drawings?roll_over=false&sort=prize_6&order=desc")
        body = r.json()
        assert body["total"] == 2
        assert body["results"][0]["prize_6"] == 10_000_000.0


class TestGetDrawing:
    def test_returns_drawing(self, client):
        r = client.get("/drawings/2")
        assert r.status_code == 200
        body = r.json()
        assert body["drawing_number"] == 2
        assert body["winners_6"] == 1
        assert body["prize_6"] == 5_000_000.0

    def test_returns_all_detail_fields(self, client):
        r = client.get("/drawings/1")
        body = r.json()
        for field in (
            "winners_5",
            "prize_5",
            "winners_4",
            "prize_4",
            "total_collected",
            "next_accumulated",
            "draw_order",
            "is_special",
        ):
            assert field in body

    def test_not_found_returns_404(self, client):
        r = client.get("/drawings/999")
        assert r.status_code == 404


class TestHealth:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}
