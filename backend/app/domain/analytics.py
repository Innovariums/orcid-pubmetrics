"""
Orquestación del pipeline de análisis: ORCID -> publicaciones -> cuartil -> agregados.

Depende únicamente de los ports (PublicationProvider, JournalMetricsProvider).
No sabe ni le importa si las fuentes son OpenAlex+SJR o Scopus+JCR.
"""
from __future__ import annotations

from collections import Counter
from typing import Literal

from app.domain.models import (
    AnalysisResult,
    EnrichedWork,
    QuartileTotals,
    TopJournal,
    YearQuartileBucket,
    YearScorePoint,
)
from app.ports.journal_metrics import JournalMetric, JournalMetricsProvider, Quartile
from app.ports.publications import PublicationProvider, Work

QUARTILE_RANK: dict[Quartile, int] = {"Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4}


def analyze(
    orcid: str,
    start_year: int,
    end_year: int,
    publications: PublicationProvider,
    metrics: JournalMetricsProvider,
) -> AnalysisResult:
    works = publications.get_works_by_orcid(orcid, start_year, end_year)
    enriched = [_enrich(w, metrics) for w in works]

    return AnalysisResult(
        orcid=orcid,
        start_year=start_year,
        end_year=end_year,
        metrics_source=metrics.name,
        total_works=len(enriched),
        indexed_works=sum(1 for e in enriched if e.indexed),
        quartile_totals=_quartile_totals(enriched),
        by_year_quartile=_bucket_by_year(enriched, start_year, end_year),
        score_evolution=_score_evolution(enriched),
        top_journals=_top_journals(enriched),
        works=enriched,
    )


def _enrich(work: Work, metrics: JournalMetricsProvider) -> EnrichedWork:
    if not work.issn:
        return EnrichedWork(work=work, not_found_reason="no_issn")

    found = metrics.get_metrics(work.issn, work.pub_year)
    if not found:
        return EnrichedWork(work=work, not_found_reason="not_in_source")

    best = _pick_headline(found)
    return EnrichedWork(work=work, metric=best, all_metrics=found)


def _pick_headline(found: list[JournalMetric]) -> JournalMetric:
    """
    Elige la métrica "headline" de una revista con múltiples categorías.

    Política: mejor cuartil (Q1 > Q2 > Q3 > Q4), y en empate mayor score.
    El resto de categorías queda disponible en `all_metrics`.
    """
    return min(found, key=lambda m: (QUARTILE_RANK[m.quartile], -m.score))


def _bucket_by_year(
    enriched: list[EnrichedWork], start_year: int, end_year: int
) -> list[YearQuartileBucket]:
    buckets: dict[int, YearQuartileBucket] = {
        y: YearQuartileBucket(year=y) for y in range(start_year, end_year + 1)
    }
    for e in enriched:
        year = e.work.pub_year
        if year not in buckets:
            continue
        bucket = buckets[year]
        if e.metric is None:
            bucket.unindexed += 1
        else:
            _increment_quartile(bucket, e.metric.quartile)
    return [buckets[y] for y in sorted(buckets)]


def _increment_quartile(
    target: YearQuartileBucket | QuartileTotals, quartile: Quartile
) -> None:
    attr: Literal["q1", "q2", "q3", "q4"] = quartile.lower()  # type: ignore[assignment]
    setattr(target, attr, getattr(target, attr) + 1)


def _quartile_totals(enriched: list[EnrichedWork]) -> QuartileTotals:
    totals = QuartileTotals()
    for e in enriched:
        if e.metric is None:
            totals.unindexed += 1
        else:
            _increment_quartile(totals, e.metric.quartile)
    return totals


def _score_evolution(enriched: list[EnrichedWork]) -> list[YearScorePoint]:
    by_year: dict[int, list[float]] = {}
    for e in enriched:
        if e.metric is None:
            continue
        by_year.setdefault(e.work.pub_year, []).append(e.metric.score)
    return [
        YearScorePoint(
            year=y,
            avg_score=sum(scores) / len(scores),
            count=len(scores),
        )
        for y, scores in sorted(by_year.items())
    ]


def _top_journals(enriched: list[EnrichedWork], limit: int = 10) -> list[TopJournal]:
    counter: Counter[tuple[str, str | None]] = Counter()
    for e in enriched:
        title = e.work.journal_title or "Unknown"
        counter[(title, e.work.issn)] += 1
    return [
        TopJournal(title=title, issn=issn, count=n)
        for (title, issn), n in counter.most_common(limit)
    ]
