from typing import Any

import httpx
import pytest

from app.adapters.openalex import (
    OpenAlexPublicationProvider,
    _normalize_issn,
    _normalize_orcid,
    _parse_work,
)


ORCID = "0000-0002-0170-462X"


def test_normalize_orcid_bare() -> None:
    assert _normalize_orcid(ORCID) == ORCID


def test_normalize_orcid_url() -> None:
    assert _normalize_orcid(f"https://orcid.org/{ORCID}") == ORCID


def test_normalize_orcid_invalid() -> None:
    with pytest.raises(ValueError):
        _normalize_orcid("not-an-orcid")


def test_normalize_issn_with_hyphen() -> None:
    assert _normalize_issn("0306-4573") == "03064573"


def test_normalize_issn_without_hyphen() -> None:
    assert _normalize_issn("03064573") == "03064573"


def test_normalize_issn_with_x_check() -> None:
    assert _normalize_issn("0000-000X") == "0000000X"


def test_normalize_issn_invalid() -> None:
    assert _normalize_issn("bad") is None
    assert _normalize_issn(None) is None


def _make_openalex_work(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": "https://openalex.org/W123",
        "doi": "https://doi.org/10.1000/test",
        "title": "Test paper",
        "publication_year": 2023,
        "type": "article",
        "primary_location": {
            "source": {
                "display_name": "Information Processing & Management",
                "issn_l": "0306-4573",
                "issn": ["0306-4573", "1873-5371"],
            }
        },
        "authorships": [
            {"author": {"display_name": "Oswaldo Langs", "orcid": f"https://orcid.org/{ORCID}"}},
            {"author": {"display_name": "Otro Autor", "orcid": None}},
        ],
    }
    base.update(overrides)
    return base


def test_parse_work_happy_path() -> None:
    raw = _make_openalex_work()
    work = _parse_work(ORCID, raw)
    assert work is not None
    assert work.orcid == ORCID
    assert work.doi == "10.1000/test"
    assert work.title == "Test paper"
    assert work.pub_year == 2023
    assert work.issn == "03064573"
    assert work.eissn == "18735371"
    assert work.journal_title == "Information Processing & Management"
    assert len(work.authors) == 2
    assert work.authors[0].orcid == ORCID


def test_parse_work_missing_year_returns_none() -> None:
    raw = _make_openalex_work(publication_year=None)
    assert _parse_work(ORCID, raw) is None


def test_parse_work_missing_title_returns_none() -> None:
    raw = _make_openalex_work(title=None, display_name=None)
    assert _parse_work(ORCID, raw) is None


def test_parse_work_no_journal() -> None:
    raw = _make_openalex_work(primary_location=None)
    work = _parse_work(ORCID, raw)
    assert work is not None
    assert work.issn is None
    assert work.journal_title is None


class _MockTransport(httpx.MockTransport):
    def __init__(self, responses: list[dict[str, Any]]) -> None:
        self._responses = iter(responses)
        super().__init__(self._handler)

    def _handler(self, request: httpx.Request) -> httpx.Response:
        payload = next(self._responses)
        return httpx.Response(200, json=payload)


def test_get_works_paginates_with_cursor() -> None:
    page1 = {
        "meta": {"next_cursor": "abc"},
        "results": [_make_openalex_work(id="https://openalex.org/W1")],
    }
    page2 = {
        "meta": {"next_cursor": None},
        "results": [_make_openalex_work(id="https://openalex.org/W2", publication_year=2024)],
    }
    transport = _MockTransport([page1, page2])
    client = httpx.Client(base_url="https://api.openalex.org", transport=transport)

    provider = OpenAlexPublicationProvider(mailto="test@example.com", client=client)
    works = provider.get_works_by_orcid(ORCID, 2020, 2024)

    assert len(works) == 2
    assert works[0].openalex_id == "https://openalex.org/W1"
    assert works[1].pub_year == 2024


def test_get_works_raises_on_invalid_orcid() -> None:
    provider = OpenAlexPublicationProvider(mailto="test@example.com")
    with pytest.raises(ValueError):
        provider.get_works_by_orcid("bad", 2020, 2024)


def test_get_works_raises_on_inverted_year_range() -> None:
    provider = OpenAlexPublicationProvider(mailto="test@example.com")
    with pytest.raises(ValueError):
        provider.get_works_by_orcid(ORCID, 2024, 2020)
