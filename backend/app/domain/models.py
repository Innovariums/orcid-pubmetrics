from pydantic import BaseModel, Field

from app.ports.journal_metrics import JournalMetric
from app.ports.publications import Work

NotFoundReason = (
    None
    | type(None)
)


class EnrichedWork(BaseModel):
    """Una publicación cruzada con su métrica de revista (si se encontró)."""

    work: Work
    metric: JournalMetric | None = None
    not_found_reason: str | None = Field(
        default=None,
        description="no_issn | not_in_source | incomplete_metadata",
    )

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


class AnalysisResult(BaseModel):
    orcid: str
    start_year: int
    end_year: int
    metrics_source: str
    total_works: int
    indexed_works: int
    by_year_quartile: list[YearQuartileBucket]
    top_journals: list[dict]
    works: list[EnrichedWork]
