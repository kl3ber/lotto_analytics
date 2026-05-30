import sys
from pathlib import Path

# make scripts/ importable from tests/
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest

SAMPLE_RAW = {
    "numero": 3011,
    "dataApuracao": "26/05/2026",
    "dataProximoConcurso": "28/05/2026",
    "listaDezenas": ["02", "05", "27", "36", "40", "60"],
    "dezenasSorteadasOrdemSorteio": ["02", "05", "60", "36", "27", "40"],
    "acumulado": True,
    "valorTotalPremioFaixaUm": 0.0,
    "listaRateioPremio": [
        {"faixa": 1, "descricaoFaixa": "6 acertos", "numeroDeGanhadores": 0, "valorPremio": 0.0},
        {"faixa": 2, "descricaoFaixa": "5 acertos", "numeroDeGanhadores": 16, "valorPremio": 54125.58},
        {"faixa": 3, "descricaoFaixa": "4 acertos", "numeroDeGanhadores": 1509, "valorPremio": 945.98},
    ],
    "valorArrecadado": 21732324.0,
    "valorAcumuladoProximoConcurso": 2664643.71,
    "valorEstimadoProximoConcurso": 6000000.0,
    "valorAcumuladoConcursoEspecial": 666160.95,
    "valorAcumuladoConcurso_0_5": 1465554.04,
    "localSorteio": "ESPAÇO DA SORTE",
    "indicadorConcursoEspecial": 0,
    "numeroConcursoFinal_0_5": 3050,
}


@pytest.fixture
def sample_raw():
    return SAMPLE_RAW.copy()


@pytest.fixture
def sample_csv_row():
    return {
        "drawing_number": "3011",
        "draw_date": "2026-05-26",
        "n1": "2", "n2": "5", "n3": "27", "n4": "36", "n5": "40", "n6": "60",
        "draw_sum": "170",
        "total_prize": "0.0",
        "roll_over": "True",
        "next_draw_date": "2026-05-28",
        "winners_6": "0", "prize_6": "0.0",
        "winners_5": "16", "prize_5": "54125.58",
        "winners_4": "1509", "prize_4": "945.98",
        "total_collected": "21732324.0",
        "next_accumulated": "2664643.71",
        "next_estimated": "6000000.0",
        "special_accumulated": "666160.95",
        "milestone_accumulated": "1465554.04",
        "draw_order": "2 5 60 36 27 40",
        "is_special": "False",
        "milestone_draw_number": "3050",
    }
