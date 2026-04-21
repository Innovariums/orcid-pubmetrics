"""Tests del dominio con providers fake (no I/O)."""
from __future__ import annotations

import pytest

from app.domain.analytics import _pick_headline, analyze
from app.ports.journal_metrics import JournalMetric, JournalMetricsProvider, MetricsSource
from app.ports.publications import Work


class FakePublicationProvider:
    name = "fake"

    def __init__(self, works: list[Work]) -> None:
        self._works = works

    def get_works_by_orcid(
        self, orcid: str, start_year: int, end_year: int
    ) -> list[Work]:
        return [
            w
            for w in self._works
            if w.orcid == orcid and start_year <= w.pub_year <= end_year
        ]

    def health(self) -> bool:
        return True


class FakeMetricsProvider:
    name: MetricsSource = "sjr"

    def __init__(self, lookup: dict[tuple[str, int], list[JournalMetric]]) -> None:
        self._lookup = lookup

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        return self._lookup.get((issn, year), [])

    def health(self) -> bool:
        return True


def _metric(issn: str, year: int, quartile: str, score: float, category: str) -> JournalMetric:
    return JournalMetric(
        issn=issn,
        year=year,
        source="sjr",
        score=score,
        score_label="SJR",
        quartile=quartile,  # type: ignore[arg-type]
        category=category,
    )


def _work(pub_year: int, issn: str | None, journal: str = "X") -> Work:
    return Work(
        orcid="0000-0001-0001-0001",
        title=f"Paper {pub_year}",
        journal_title=journal,
        issn=issn,
        pub_year=pub_year,
    )


def test_pick_headline_prefers_best_quartile() -> None:
    ms = [
        _metric("1", 2023, "Q3", 1.0, "A"),
        _metric("1", 2023, "Q1", 0.5, "B"),
        _metric("1", 2023, "Q2", 2.0, "C"),
    ]
    best = _pick_headline(ms)
    assert best.quartile == "Q1"


def test_pick_headline_tiebreak_by_score() -> None:
    ms = [
        _metric("1", 2023, "Q1", 1.0, "A"),
        _metric("1", 2023, "Q1", 3.0, "B"),
        _metric("1", 2023, "Q1", 2.0, "C"),
    ]
    best = _pick_headline(ms)
    assert best.category == "B"


def test_analyze_groups_by_year_and_quartile() -> None:
    works = [
        _work(2020, "11111111", "Alpha"),
        _work(2020, "22222222", "Beta"),
        _work(2021, "11111111", "Alpha"),
        _work(2021, None, "NoISSN"),
        _work(2022, "99999999", "NotInSource"),
    ]
    lookup = {
        ("11111111", 2020): [_metric("11111111", 2020, "Q1", 2.5, "Info")],
        ("22222222", 2020): [_metric("22222222", 2020, "Q3", 0.5, "Info")],
        ("11111111", 2021): [_metric("11111111", 2021, "Q1", 2.7, "Info")],
    }
    result = analyze(
        orcid="0000-0001-0001-0001",
        start_year=2020,
        end_year=2022,
        publications=FakePublicationProvider(works),
        metrics=FakeMetricsProvider(lookup),
    )

    assert result.metrics_source == "sjr"
    assert result.total_works == 5
    assert result.indexed_works == 3

    buckets = {b.year: b for b in result.by_year_quartile}
    assert buckets[2020].q1 == 1 and buckets[2020].q3 == 1
    assert buckets[2021].q1 == 1 and buckets[2021].unindexed == 1
    assert buckets[2022].unindexed == 1

    assert result.quartile_totals.q1 == 2
    assert result.quartile_totals.q3 == 1
    assert result.quartile_totals.unindexed == 2

    # Not found reasons
    by_reason = {
        e.work.pub_year: e.not_found_reason
        for e in result.works
        if e.not_found_reason is not None
    }
    assert by_reason[2021] == "no_issn"
    assert by_reason[2022] == "not_in_source"


def test_analyze_score_evolution() -> None:
    works = [_work(2020, "11111111"), _work(2021, "11111111")]
    lookup = {
        ("11111111", 2020): [_metric("11111111", 2020, "Q2", 1.0, "C")],
        ("11111111", 2021): [_metric("11111111", 2021, "Q1", 3.0, "C")],
    }
    result = analyze(
        "0000-0001-0001-0001",
        2020,
        2021,
        FakePublicationProvider(works),
        FakeMetricsProvider(lookup),
    )
    points = {p.year: p for p in result.score_evolution}
    assert points[2020].avg_score == 1.0
    assert points[2021].avg_score == 3.0


def test_analyze_top_journals() -> None:
    works = [
        _work(2020, "11111111", "Alpha"),
        _work(2020, "11111111", "Alpha"),
        _work(2021, "22222222", "Beta"),
    ]
    lookup: dict[tuple[str, int], list[JournalMetric]] = {}
    result = analyze(
        "0000-0001-0001-0001",
        2020,
        2021,
        FakePublicationProvider(works),
        FakeMetricsProvider(lookup),
    )
    top = result.top_journals
    assert top[0].title == "Alpha"
    assert top[0].count == 2
    assert top[1].title == "Beta"
