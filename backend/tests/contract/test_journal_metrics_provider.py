"""
Suite de contrato: todo JournalMetricsProvider que se registre debe pasar
estos tests. Si mañana agregamos ClarivateJcrProvider y falla acá, el bug
está en el adapter, no en el dominio.

Los tests están marcados como skip hasta Fase 1. Su existencia temprana
fija el contrato y evita que alguien "olvide" validar una nueva implementación.
"""
import os
from typing import cast

import pytest

from app.adapters.jcr_clarivate import ClarivateJcrProvider
from app.adapters.sjr_csv import ScimagoSjrProvider
from app.ports.journal_metrics import JournalMetricsProvider


def _make_provider(name: str) -> JournalMetricsProvider:
    if name == "sjr":
        return cast(JournalMetricsProvider, ScimagoSjrProvider(data_dir="tests/fixtures/sjr"))
    if name == "jcr":
        key = os.getenv("JCR_API_KEY", "")
        if not key:
            pytest.skip("JCR_API_KEY no disponible")
        return cast(
            JournalMetricsProvider,
            ClarivateJcrProvider(api_key=key, api_base=os.getenv("JCR_API_BASE", "")),
        )
    raise ValueError(name)


@pytest.fixture(params=["sjr", "jcr"])
def provider(request: pytest.FixtureRequest) -> JournalMetricsProvider:
    return _make_provider(request.param)


@pytest.mark.skip(reason="Fase 1: implementar adapters y fixtures de prueba")
def test_known_journal_returns_quartile(provider: JournalMetricsProvider) -> None:
    results = provider.get_metrics("03064573", 2023)
    assert results
    assert all(m.quartile in {"Q1", "Q2", "Q3", "Q4"} for m in results)
    assert all(m.source == provider.name for m in results)


@pytest.mark.skip(reason="Fase 1: implementar adapters")
def test_unknown_journal_returns_empty(provider: JournalMetricsProvider) -> None:
    assert provider.get_metrics("00000000", 2023) == []


@pytest.mark.skip(reason="Fase 1: implementar adapters")
def test_year_rule_is_reported(provider: JournalMetricsProvider) -> None:
    results = provider.get_metrics("03064573", 2099)
    for m in results:
        assert m.year_rule in {"exact", "fallback-1", "fallback+1", "fallback-any"}
