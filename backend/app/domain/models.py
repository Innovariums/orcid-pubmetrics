from typing import Literal

from pydantic import BaseModel, Field

from app.ports.journal_metrics import JournalMetric
from app.ports.publications import Work

NotFoundReason = Literal["no_issn", "not_in_source", "incomplete_metadata"]


class EnrichedWork(BaseModel):
    """Una publicación con la métrica "headline" elegida y todas las categorías."""

    work: Work
    metric: JournalMetric | None = Field(
        default=None,
        description="Métrica headline: mejor cuartil de la revista en el año",
    )
    all_metrics: list[JournalMetric] = Field(default_factory=list)
    not_found_reason: NotFoundReason | None = None

    @property
    def indexed(self) -> bool:
        return self.metric is not None


class YearQuartileBucket(BaseModel):
    year: int
    q1: int = 0
    q2: int = 0
    q3: int = 0
    q4: int = 0
    unindexed: int = 0

    @property
    def total(self) -> int:
        return self.q1 + self.q2 + self.q3 + self.q4 + self.unindexed


class QuartileTotals(BaseModel):
    q1: int = 0
    q2: int = 0
    q3: int = 0
    q4: int = 0
    unindexed: int = 0


class YearScorePoint(BaseModel):
    year: int
    avg_score: float
    count: int


class TopJournal(BaseModel):
    title: str
    issn: str | None
    count: int


class AnalysisResult(BaseModel):
    orcid: str
    start_year: int
    end_year: int
    metrics_source: str
    total_works: int
    indexed_works: int
    quartile_totals: QuartileTotals
    by_year_quartile: list[YearQuartileBucket]
    score_evolution: list[YearScorePoint]
    top_journals: list[TopJournal]
    works: list[EnrichedWork]
