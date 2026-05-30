"""Tests for parse_drawing, _prize_by_faixa and parse_date."""

from datetime import date


from ingest_mega_sena import _prize_by_faixa, parse_date, parse_drawing


class TestParseDate:
    def test_valid_date(self):
        assert parse_date("26/05/2026") == date(2026, 5, 26)

    def test_none_returns_none(self):
        assert parse_date(None) is None

    def test_empty_string_returns_none(self):
        assert parse_date("") is None


class TestPrizeByFaixa:
    def test_returns_correct_winners_and_prize(self, sample_raw):
        winners, prize = _prize_by_faixa(sample_raw, 2)
        assert winners == 16
        assert prize == 54125.58

    def test_faixa_not_present_returns_zero(self, sample_raw):
        winners, prize = _prize_by_faixa(sample_raw, 9)
        assert winners == 0
        assert prize == 0.0

    def test_empty_lista_returns_zero(self, sample_raw):
        sample_raw["listaRateioPremio"] = []
        winners, prize = _prize_by_faixa(sample_raw, 1)
        assert winners == 0
        assert prize == 0.0

    def test_missing_key_returns_zero(self, sample_raw):
        del sample_raw["listaRateioPremio"]
        winners, prize = _prize_by_faixa(sample_raw, 1)
        assert winners == 0
        assert prize == 0.0


class TestParseDrawing:
    def test_drawing_number(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["drawing_number"] == 3011

    def test_draw_date(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["draw_date"] == date(2026, 5, 26)

    def test_numbers_are_sorted(self, sample_raw):
        result = parse_drawing(sample_raw)
        numbers = [result[f"n{i}"] for i in range(1, 7)]
        assert numbers == sorted(numbers)
        assert numbers == [2, 5, 27, 36, 40, 60]

    def test_draw_sum(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["draw_sum"] == 2 + 5 + 27 + 36 + 40 + 60

    def test_roll_over(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["roll_over"] is True

    def test_next_draw_date(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["next_draw_date"] == date(2026, 5, 28)

    def test_next_draw_date_missing(self, sample_raw):
        del sample_raw["dataProximoConcurso"]
        result = parse_drawing(sample_raw)
        assert result["next_draw_date"] is None

    def test_prize_faixa_1(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["winners_6"] == 0
        assert result["prize_6"] == 0.0

    def test_prize_faixa_2(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["winners_5"] == 16
        assert result["prize_5"] == 54125.58

    def test_prize_faixa_3(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["winners_4"] == 1509
        assert result["prize_4"] == 945.98

    def test_financials(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["total_collected"] == 21732324.0
        assert result["next_accumulated"] == 2664643.71
        assert result["next_estimated"] == 6000000.0
        assert result["special_accumulated"] == 666160.95
        assert result["milestone_accumulated"] == 1465554.04

    def test_missing_financials_default_to_zero(self, sample_raw):
        for key in ("valorArrecadado", "valorAcumuladoProximoConcurso",
                    "valorEstimadoProximoConcurso", "valorAcumuladoConcursoEspecial",
                    "valorAcumuladoConcurso_0_5"):
            del sample_raw[key]
        result = parse_drawing(sample_raw)
        assert result["total_collected"] == 0
        assert result["next_accumulated"] == 0

    def test_draw_order(self, sample_raw):
        result = parse_drawing(sample_raw)
        assert result["draw_order"] == "2 5 60 36 27 40"

    def test_draw_order_missing(self, sample_raw):
        del sample_raw["dezenasSorteadasOrdemSorteio"]
        assert parse_drawing(sample_raw)["draw_order"] == ""

    def test_is_special_false(self, sample_raw):
        assert parse_drawing(sample_raw)["is_special"] is False

    def test_is_special_true(self, sample_raw):
        sample_raw["indicadorConcursoEspecial"] = 1
        assert parse_drawing(sample_raw)["is_special"] is True

    def test_milestone_draw_number(self, sample_raw):
        assert parse_drawing(sample_raw)["milestone_draw_number"] == 3050

    def test_milestone_draw_number_missing(self, sample_raw):
        del sample_raw["numeroConcursoFinal_0_5"]
        assert parse_drawing(sample_raw)["milestone_draw_number"] is None
