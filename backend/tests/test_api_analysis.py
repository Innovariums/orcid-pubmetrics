"""
Integration test de POST /analysis con providers fake sobrescritos vía
dependency_overrides. Verifica:
- Validación de input (regex ORCID, rango de años)
- Respuesta JSON con estructura completa
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.infra.container import get_metrics_provider, get_publication_provider
from app.main import app
from tests.unit.test_analytics import (
    FakeMetricsProvider,
    FakePublicationProvider,
    _metric,
    _work,
)


def _setup_overrides() -> None:
    works = [
        _work(2023, "11111111", "Alpha"),
        _work(2023, "22222222", "Beta"),
    ]
    lookup = {
        ("11111111", 2023): [_metric("11111111", 2023, "Q1", 5.0, "Info")],
        ("22222222", 2023): [_metric("22222222", 2023, "Q4", 0.1, "Info")],
    }
    app.dependency_overrides[get_publication_provider] = lambda: FakePublicationProvider(works)
    app.dependency_overrides[get_metrics_provider] = lambda: FakeMetricsProvider(lookup)


def _clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_analysis_happy_path() -> None:
    _setup_overrides()
    try:
        client = TestClient(app)
        res = client.post(
            "/analysis",
            json={"orcid": "0000-0001-0001-0001", "start_year": 2023, "end_year": 2023},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["orcid"] == "0000-0001-0001-0001"
        assert body["metrics_source"] == "sjr"
        assert body["total_works"] == 2
        assert body["indexed_works"] == 2
        assert body["quartile_totals"]["q1"] == 1
        assert body["quartile_totals"]["q4"] == 1
        assert len(body["by_year_quartile"]) == 1
        assert len(body["top_journals"]) == 2
    finally:
        _clear_overrides()


def test_analysis_rejects_invalid_orcid() -> None:
    client = TestClient(app)
    res = client.post("/analysis", json={"orcid": "bad", "start_year": 2020, "end_year": 2021})
    assert res.status_code == 422


def test_analysis_rejects_inverted_year_range() -> None:
    client = TestClient(app)
    res = client.post(
        "/analysis",
        json={"orcid": "0000-0001-0001-0001", "start_year": 2024, "end_year": 2020},
    )
    assert res.status_code == 422
