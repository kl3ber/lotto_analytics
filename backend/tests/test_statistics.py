import pytest


def test_statistics_status(client):
    res = client.get("/analytics/statistics")
    assert res.status_code == 200


def test_statistics_top_level_fields(client):
    data = client.get("/analytics/statistics").json()
    for field in (
        "total_drawings",
        "total_picks",
        "expected_per_number",
        "chi_square",
        "ks_test",
        "per_number",
    ):
        assert field in data


def test_statistics_counts(client):
    data = client.get("/analytics/statistics").json()
    assert data["total_drawings"] == 3
    assert data["total_picks"] == 18  # 3 draws * 6 numbers


def test_statistics_expected_per_number(client):
    data = client.get("/analytics/statistics").json()
    assert pytest.approx(data["expected_per_number"], abs=0.01) == 18 / 60


def test_chi_square_fields(client):
    chi = client.get("/analytics/statistics").json()["chi_square"]
    assert "statistic" in chi
    assert "p_value" in chi
    assert chi["degrees_of_freedom"] == 59
    assert isinstance(chi["significant"], bool)


def test_chi_square_statistic_positive(client):
    chi = client.get("/analytics/statistics").json()["chi_square"]
    assert chi["statistic"] >= 0


def test_ks_test_fields(client):
    ks = client.get("/analytics/statistics").json()["ks_test"]
    assert "statistic" in ks
    assert "p_value" in ks
    assert ks["degrees_of_freedom"] is None
    assert isinstance(ks["significant"], bool)


def test_ks_statistic_in_range(client):
    ks = client.get("/analytics/statistics").json()["ks_test"]
    assert 0.0 <= ks["statistic"] <= 1.0


def test_per_number_count(client):
    data = client.get("/analytics/statistics").json()
    assert len(data["per_number"]) == 60


def test_per_number_fields(client):
    item = client.get("/analytics/statistics").json()["per_number"][0]
    assert "number" in item
    assert "observed" in item
    assert "expected" in item
    assert "z_score" in item


def test_per_number_numbers_range(client):
    per_number = client.get("/analytics/statistics").json()["per_number"]
    numbers = [item["number"] for item in per_number]
    assert min(numbers) == 1
    assert max(numbers) == 60


def test_per_number_observed_sum(client):
    per_number = client.get("/analytics/statistics").json()["per_number"]
    total = sum(item["observed"] for item in per_number)
    assert total == 18  # 3 draws * 6 numbers


def test_date_filter_from(client):
    data = client.get("/analytics/statistics?date_from=2021-01-01").json()
    assert data["total_drawings"] == 2  # drawings 2 and 3


def test_date_filter_to(client):
    data = client.get("/analytics/statistics?date_to=2021-12-31").json()
    assert data["total_drawings"] == 2  # drawings 1 and 2


def test_date_filter_range(client):
    data = client.get(
        "/analytics/statistics?date_from=2021-06-15&date_to=2021-06-15"
    ).json()
    assert data["total_drawings"] == 1


def test_anderson_darling_computation(client_large):
    data = client_large.get("/analytics/anderson-darling").json()
    assert data["total_drawings"] == 30
    assert data["statistic"] >= 0
    assert data["critical_value_5pct"] > 0
    assert isinstance(data["significant"], bool)


def test_ljung_box_computation(client_large):
    data = client_large.get("/analytics/ljung-box?max_lag=5").json()
    assert data["total_drawings"] == 30
    assert data["statistic"] >= 0
    assert 0.0 <= data["p_value"] <= 1.0
    assert 0 <= data["significant_count"] <= 60


def test_markov_chain_computation(client_large):
    data = client_large.get("/analytics/markov-chain").json()
    assert data["total_drawings"] == 30
    assert data["chi_square_statistic"] >= 0
    assert 0.0 <= data["p_value"] <= 1.0
    assert len(data["top_above"]) <= 5
    assert len(data["top_below"]) <= 5


def test_spectral_computation(client_large):
    data = client_large.get("/analytics/spectral").json()
    assert data["total_drawings"] == 30
    assert len(data["spectrum"]) > 0
    assert data["dominant_period"] > 0
    assert data["noise_floor"] >= 0


def test_hurst_computation(client_large):
    data = client_large.get("/analytics/hurst").json()
    assert data["total_drawings"] == 30
    assert 0.0 <= data["hurst_exponent"] <= 1.0
    assert data["min_drawings_warning"] is True  # 30 < 500


def test_runs_test_computation(client_large):
    data = client_large.get("/analytics/runs-test").json()
    assert data["total_drawings"] == 30
    assert 0.0 <= data["avg_p_value"] <= 1.0


def test_gap_distribution_computation(client_large):
    data = client_large.get("/analytics/gap-distribution").json()
    assert data["total_drawings"] == 30
    assert len(data["distribution"]) == 7


def test_bootstrap_computation(client_large):
    data = client_large.get("/analytics/bootstrap?n_resamples=100").json()
    assert data["total_drawings"] == 30
    assert len(data["items"]) == 60


def test_anderson_darling_status(client):
    assert client.get("/analytics/anderson-darling").status_code == 200


def test_anderson_darling_fields(client):
    data = client.get("/analytics/anderson-darling").json()
    for f in ("total_drawings", "statistic", "critical_value_5pct", "significant"):
        assert f in data


def test_anderson_darling_statistic_positive(client):
    data = client.get("/analytics/anderson-darling").json()
    assert data["statistic"] >= 0


def test_anderson_darling_date_filter(client):
    data = client.get("/analytics/anderson-darling?date_from=2021-01-01").json()
    assert data["total_drawings"] == 2


def test_ljung_box_status(client):
    assert client.get("/analytics/ljung-box?max_lag=2").status_code == 200


def test_ljung_box_fields(client):
    data = client.get("/analytics/ljung-box?max_lag=2").json()
    for f in (
        "total_drawings",
        "max_lag",
        "statistic",
        "p_value",
        "significant",
        "significant_count",
    ):
        assert f in data


def test_ljung_box_p_value_range(client):
    data = client.get("/analytics/ljung-box?max_lag=2").json()
    assert 0.0 <= data["p_value"] <= 1.0


def test_ljung_box_date_filter(client):
    data = client.get("/analytics/ljung-box?max_lag=2&date_from=2022-01-01").json()
    assert data["total_drawings"] == 1


def test_markov_chain_status(client):
    assert client.get("/analytics/markov-chain").status_code == 200


def test_markov_chain_fields(client):
    data = client.get("/analytics/markov-chain").json()
    for f in (
        "total_drawings",
        "expected_transition_rate",
        "chi_square_statistic",
        "p_value",
        "significant",
        "top_above",
        "top_below",
    ):
        assert f in data


def test_markov_chain_top_counts(client):
    data = client.get("/analytics/markov-chain").json()
    assert len(data["top_above"]) <= 5
    assert len(data["top_below"]) <= 5


def test_markov_chain_item_fields(client):
    data = client.get("/analytics/markov-chain").json()
    if data["top_above"]:
        for f in (
            "from_number",
            "to_number",
            "observed_count",
            "expected_count",
            "z_score",
        ):
            assert f in data["top_above"][0]


def test_markov_chain_date_filter(client):
    data = client.get("/analytics/markov-chain?date_from=2021-01-01").json()
    assert data["total_drawings"] == 2


def test_spectral_status(client):
    assert client.get("/analytics/spectral").status_code == 200


def test_spectral_fields(client):
    data = client.get("/analytics/spectral").json()
    for f in ("total_drawings", "dominant_period", "noise_floor", "spectrum"):
        assert f in data


def test_spectral_empty_when_few_draws(client):
    data = client.get("/analytics/spectral").json()
    # conftest has 3 draws (< 20 threshold)
    assert data["spectrum"] == []


def test_spectral_date_filter(client):
    data = client.get("/analytics/spectral?date_from=2020-01-01").json()
    assert data["total_drawings"] == 3


def test_runs_test_status(client):
    assert client.get("/analytics/runs-test").status_code == 200


def test_runs_test_fields(client):
    data = client.get("/analytics/runs-test").json()
    for f in (
        "total_drawings",
        "avg_z_statistic",
        "avg_p_value",
        "significant_count",
        "significant",
    ):
        assert f in data


def test_runs_test_p_value_range(client):
    data = client.get("/analytics/runs-test").json()
    assert 0.0 <= data["avg_p_value"] <= 1.0


def test_runs_test_date_filter(client):
    data = client.get("/analytics/runs-test?date_from=2021-01-01").json()
    assert data["total_drawings"] == 2


def test_gap_distribution_status(client):
    assert client.get("/analytics/gap-distribution").status_code == 200


def test_gap_distribution_fields(client):
    data = client.get("/analytics/gap-distribution").json()
    for f in (
        "total_drawings",
        "expected_gap",
        "avg_observed_gap",
        "chi_square_statistic",
        "p_value",
        "significant",
        "distribution",
    ):
        assert f in data


def test_gap_distribution_expected_gap(client):
    data = client.get("/analytics/gap-distribution").json()
    assert data["expected_gap"] == pytest.approx(10.0, abs=0.1)


def test_gap_distribution_buckets(client):
    data = client.get("/analytics/gap-distribution").json()
    # conftest has 3 draws (< 10 threshold) so distribution is empty; check valid lengths
    assert len(data["distribution"]) in (0, 7)


def test_gap_distribution_date_filter(client):
    data = client.get("/analytics/gap-distribution?date_from=2021-01-01").json()
    assert data["total_drawings"] == 2


def test_pair_bias_status(client):
    assert client.get("/analytics/pair-bias").status_code == 200


def test_pair_bias_fields(client):
    data = client.get("/analytics/pair-bias").json()
    for f in (
        "total_drawings",
        "expected_per_pair",
        "chi_square_statistic",
        "p_value",
        "significant",
        "top_above",
        "top_below",
    ):
        assert f in data


def test_pair_bias_top_counts(client):
    data = client.get("/analytics/pair-bias").json()
    assert len(data["top_above"]) <= 5
    assert len(data["top_below"]) <= 5


def test_pair_bias_item_fields(client):
    data = client.get("/analytics/pair-bias").json()
    if data["top_above"]:
        for f in ("n1", "n2", "observed", "expected", "z_score"):
            assert f in data["top_above"][0]


def test_pair_bias_date_filter(client):
    data = client.get("/analytics/pair-bias?date_from=2022-01-01").json()
    assert data["total_drawings"] == 1


def test_hurst_status(client):
    assert client.get("/analytics/hurst").status_code == 200


def test_hurst_fields(client):
    data = client.get("/analytics/hurst").json()
    for field in (
        "total_drawings",
        "hurst_exponent",
        "interpretation",
        "min_drawings_warning",
    ):
        assert field in data


def test_hurst_exponent_range(client):
    data = client.get("/analytics/hurst").json()
    assert 0.0 <= data["hurst_exponent"] <= 1.0


def test_hurst_interpretation_not_empty(client):
    data = client.get("/analytics/hurst").json()
    assert len(data["interpretation"]) > 0


def test_hurst_warning_few_draws(client):
    # conftest has 3 draws — well below 500 threshold
    data = client.get("/analytics/hurst").json()
    assert data["min_drawings_warning"] is True


def test_hurst_date_filter(client):
    data = client.get("/analytics/hurst?date_from=2022-01-01").json()
    assert data["total_drawings"] == 1


def test_hurst_empty_db(client_empty):
    res = client_empty.get("/analytics/hurst")
    assert res.status_code == 200
    assert res.json()["min_drawings_warning"] is True


def test_monte_carlo_status(client):
    res = client.get("/analytics/monte-carlo?n_simulations=100")
    assert res.status_code == 200


def test_monte_carlo_top_level_fields(client):
    data = client.get("/analytics/monte-carlo?n_simulations=100").json()
    for field in ("total_drawings", "n_simulations", "outside_band_count", "items"):
        assert field in data


def test_monte_carlo_n_simulations(client):
    data = client.get("/analytics/monte-carlo?n_simulations=100").json()
    assert data["n_simulations"] == 100


def test_monte_carlo_items_count(client):
    data = client.get("/analytics/monte-carlo?n_simulations=100").json()
    assert len(data["items"]) == 60


def test_monte_carlo_item_fields(client):
    item = client.get("/analytics/monte-carlo?n_simulations=100").json()["items"][0]
    for field in (
        "number",
        "observed_pct",
        "sim_mean",
        "sim_p5",
        "sim_p95",
        "outside_band",
    ):
        assert field in item


def test_monte_carlo_band_ordered(client):
    items = client.get("/analytics/monte-carlo?n_simulations=100").json()["items"]
    for it in items:
        assert it["sim_p5"] <= it["sim_mean"] <= it["sim_p95"]


def test_monte_carlo_outside_band_count(client):
    data = client.get("/analytics/monte-carlo?n_simulations=100").json()
    computed = sum(1 for it in data["items"] if it["outside_band"])
    assert data["outside_band_count"] == computed


def test_monte_carlo_date_filter(client):
    data = client.get(
        "/analytics/monte-carlo?n_simulations=100&date_from=2021-01-01"
    ).json()
    assert data["total_drawings"] == 2


def test_monte_carlo_empty_db(client_empty):
    res = client_empty.get("/analytics/monte-carlo?n_simulations=100")
    assert res.status_code == 200
    assert res.json()["items"] == []


def test_bootstrap_status(client):
    res = client.get("/analytics/bootstrap?n_resamples=100")
    assert res.status_code == 200


def test_bootstrap_top_level_fields(client):
    data = client.get("/analytics/bootstrap?n_resamples=100").json()
    for field in (
        "total_drawings",
        "n_resamples",
        "expected_pct",
        "confidence_level",
        "within_ci_count",
        "items",
    ):
        assert field in data


def test_bootstrap_n_resamples(client):
    data = client.get("/analytics/bootstrap?n_resamples=100").json()
    assert data["n_resamples"] == 100


def test_bootstrap_expected_pct(client):
    data = client.get("/analytics/bootstrap?n_resamples=100").json()
    assert pytest.approx(data["expected_pct"], abs=0.01) == 100 / 60


def test_bootstrap_items_count(client):
    data = client.get("/analytics/bootstrap?n_resamples=100").json()
    assert len(data["items"]) == 60


def test_bootstrap_item_fields(client):
    item = client.get("/analytics/bootstrap?n_resamples=100").json()["items"][0]
    for field in ("number", "observed_pct", "ci_low", "ci_high", "expected_within_ci"):
        assert field in item


def test_bootstrap_ci_ordered(client):
    items = client.get("/analytics/bootstrap?n_resamples=100").json()["items"]
    for item in items:
        assert item["ci_low"] <= item["observed_pct"] <= item["ci_high"]


def test_bootstrap_numbers_range(client):
    items = client.get("/analytics/bootstrap?n_resamples=100").json()["items"]
    numbers = [it["number"] for it in items]
    assert min(numbers) == 1 and max(numbers) == 60


def test_bootstrap_within_ci_count(client):
    data = client.get("/analytics/bootstrap?n_resamples=100").json()
    computed = sum(1 for it in data["items"] if it["expected_within_ci"])
    assert data["within_ci_count"] == computed


def test_bootstrap_date_filter(client):
    data = client.get(
        "/analytics/bootstrap?n_resamples=100&date_from=2021-01-01"
    ).json()
    assert data["total_drawings"] == 2


def test_bootstrap_empty_db(client_empty):
    res = client_empty.get("/analytics/bootstrap?n_resamples=100")
    assert res.status_code == 200
    assert res.json()["total_drawings"] == 0
    assert res.json()["items"] == []


def test_autocorrelation_status(client):
    res = client.get("/analytics/autocorrelation?max_lag=5")
    assert res.status_code == 200


def test_autocorrelation_top_level_fields(client):
    data = client.get("/analytics/autocorrelation?max_lag=5").json()
    for field in ("total_drawings", "max_lag", "ci_bound", "acf"):
        assert field in data


def test_autocorrelation_max_lag(client):
    data = client.get("/analytics/autocorrelation?max_lag=2").json()
    assert data["max_lag"] == 2


def test_autocorrelation_acf_length(client):
    data = client.get("/analytics/autocorrelation?max_lag=2").json()
    assert len(data["acf"]) == 2


def test_autocorrelation_acf_lags(client):
    data = client.get("/analytics/autocorrelation?max_lag=2").json()
    lags = [p["lag"] for p in data["acf"]]
    assert lags == [1, 2]


def test_autocorrelation_values_range(client):
    data = client.get("/analytics/autocorrelation?max_lag=2").json()
    for p in data["acf"]:
        assert -1.0 <= p["autocorrelation"] <= 1.0


def test_autocorrelation_ci_bound_positive(client):
    data = client.get("/analytics/autocorrelation?max_lag=2").json()
    assert data["ci_bound"] > 0


def test_autocorrelation_date_filter(client):
    data = client.get(
        "/analytics/autocorrelation?max_lag=2&date_from=2021-01-01"
    ).json()
    assert data["total_drawings"] == 2


def test_autocorrelation_too_few_draws(client_empty):
    res = client_empty.get("/analytics/autocorrelation?max_lag=20")
    assert res.status_code == 200
    assert res.json()["acf"] == []


def test_statistics_empty_db(client_empty):
    res = client_empty.get("/analytics/statistics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_drawings"] == 0
    assert data["per_number"] == []


@pytest.fixture
def client_empty(db_engine):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.database import get_db
    from sqlalchemy.orm import sessionmaker

    session_factory = sessionmaker(bind=db_engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
