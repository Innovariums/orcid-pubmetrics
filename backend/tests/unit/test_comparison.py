"""Tests del dominio comparison con providers fake."""
from __future__ import annotations

import pytest

from app.domain.comparison import compare_researchers
from app.ports.editorial_boards import EditorialBoardProvider, EditorialMember
from app.ports.publications import Author, Work
from tests.unit.test_analytics import FakeMetricsProvider, FakePublicationProvider, _metric


def _work(
    orcid: str,
    pub_year: int,
    issn: str | None,
    title: str = "Paper",
    journal: str = "Alpha",
    coauthors: list[Author] | None = None,
    doi: str | None = None,
    openalex_id: str | None = None,
) -> Work:
    authors = [Author(name=f"Dr {orcid[-4:]}", orcid=orcid)]
    if coauthors:
        authors.extend(coauthors)
    return Work(
        orcid=orcid,
        title=title,
        journal_title=journal,
        issn=issn,
        pub_year=pub_year,
        authors=authors,
        doi=doi,
        openalex_id=openalex_id,
    )


class FakeEditorialBoards:
    name = "fake"

    def __init__(self, by_issn: dict[str, list[EditorialMember]]) -> None:
        self._by_issn = by_issn

    def get_members_by_issn(self, issn: str) -> list[EditorialMember]:
        return self._by_issn.get(issn, [])

    def find_journals_by_researcher(
        self, orcid: str | None = None, name: str | None = None
    ) -> list[EditorialMember]:
        out = []
        for members in self._by_issn.values():
            for m in members:
                if orcid and m.researcher_orcid == orcid:
                    out.append(m)
        return out

    def health(self) -> bool:
        return True


def test_compare_rejects_under_two_orcids() -> None:
    with pytest.raises(ValueError):
        compare_researchers(
            ["0000-0000-0000-0001"], 2020, 2024,
            FakePublicationProvider([]), FakeMetricsProvider({}),
        )


def test_compare_rejects_duplicates() -> None:
    orcids = ["0000-0000-0000-0001", "0000-0000-0000-0001"]
    with pytest.raises(ValueError):
        compare_researchers(
            orcids, 2020, 2024,
            FakePublicationProvider([]), FakeMetricsProvider({}),
        )


def test_journal_overlap_detects_shared_journal() -> None:
    a = "0000-0000-0000-000A"
    b = "0000-0000-0000-000B"
    works = [
        _work(a, 2023, "11111111", journal="Shared"),
        _work(a, 2023, "11111111", journal="Shared"),
        _work(a, 2023, "22222222", journal="AlphaOnly"),
        _work(b, 2023, "11111111", journal="Shared"),
        _work(b, 2024, "33333333", journal="BetaOnly"),
    ]
    pubs = FakePublicationProvider(works)
    metrics = FakeMetricsProvider({
        ("11111111", 2023): [_metric("11111111", 2023, "Q1", 2.0, "Info")],
    })
    result = compare_researchers([a, b], 2020, 2025, pubs, metrics)

    shared = [o for o in result.journal_overlap if o.issn == "11111111"]
    assert len(shared) == 1
    assert shared[0].pubs_by_orcid == {a: 2, b: 1}
    assert shared[0].best_quartile == "Q1"
    # No debe incluir revistas donde solo publica uno
    non_shared = [o for o in result.journal_overlap if o.issn in {"22222222", "33333333"}]
    assert non_shared == []


def test_coauthorships_detects_shared_work() -> None:
    a = "0000-0000-0000-000A"
    b = "0000-0000-0000-000B"
    shared_work = _work(
        a, 2023, "11111111", title="Joint paper",
        coauthors=[Author(name="Dr B", orcid=b)],
        openalex_id="W1",
    )
    # Mismo work visto desde B
    shared_work_b = _work(
        b, 2023, "11111111", title="Joint paper",
        coauthors=[Author(name="Dr A", orcid=a)],
        openalex_id="W1",
    )
    pubs = FakePublicationProvider([shared_work, shared_work_b])
    result = compare_researchers([a, b], 2020, 2024, pubs, FakeMetricsProvider({}))

    assert len(result.coauthorships) == 1
    assert set(result.coauthorships[0].orcids) == {a, b}
    assert result.coauthorships[0].work.work.title == "Joint paper"


def test_editorial_cross_flags_suspicious_pattern() -> None:
    a = "0000-0000-0000-000A"
    b = "0000-0000-0000-000B"
    works = [
        _work(a, 2023, "11111111", journal="Red Journal"),
        _work(a, 2024, "11111111", journal="Red Journal"),
    ]
    pubs = FakePublicationProvider(works)
    metrics = FakeMetricsProvider({})
    editors = FakeEditorialBoards({
        "11111111": [
            EditorialMember(
                issn="11111111",
                journal_title="Red Journal",
                researcher_name="Dr B",
                researcher_orcid=b,
                role="Editor-in-Chief",
                source="manual",
            )
        ]
    })
    result = compare_researchers([a, b], 2020, 2025, pubs, metrics, editorial_boards=editors)

    assert result.editorial_source == "fake"
    cross = result.editorial_cross
    assert len(cross) == 1
    assert cross[0].publisher_orcid == a
    assert cross[0].editor_orcid == b
    assert cross[0].pub_count == 2
    # Además debería estar marcado en journal_overlap aunque B no publique
    overlap = [o for o in result.journal_overlap if o.issn == "11111111"]
    # El overlap requiere 2+ publicadores; en este test B no publica en Red
    # Journal, solo está en comité. Entonces overlap puede estar vacío.
    # El conflicto editorial se reporta vía editorial_cross.
    assert overlap == [] or overlap[0].has_editorial_conflict
