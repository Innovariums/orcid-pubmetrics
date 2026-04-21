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


class ResearcherSummary(BaseModel):
    """Resumen por investigador dentro de una comparación."""

    orcid: str
    researcher_name: str | None = None
    total_works: int
    indexed_works: int
    quartile_totals: QuartileTotals


class JournalOverlap(BaseModel):
    """Revista donde publican 2+ investigadores del grupo comparado."""

    issn: str | None
    journal_title: str
    best_quartile: Literal["Q1", "Q2", "Q3", "Q4"] | None = None
    pubs_by_orcid: dict[str, int]
    has_editorial_conflict: bool = Field(
        default=False,
        description=(
            "True si ≥1 investigador del grupo publica en esta revista y otro(s) "
            "figura(n) en el comité editorial. Requiere OpenEditorsProvider."
        ),
    )
    editors_orcids: list[str] = Field(
        default_factory=list,
        description="Subconjunto de ORCIDs del grupo que están en el comité editorial de la revista.",
    )


class Coauthorship(BaseModel):
    """Par (o n-upla) de investigadores co-autores en un mismo trabajo.

    `work` contiene la EnrichedWork completa (mismo shape que en el análisis
    individual) para poder reutilizar el drawer de detalle en la UI.
    `orcids` es el subconjunto del grupo comparado que co-autora el work.
    """

    orcids: list[str]
    work: EnrichedWork


class EditorialCrossRef(BaseModel):
    """A publica en revista X donde B está en el comité editorial."""

    publisher_orcid: str
    editor_orcid: str
    issn: str | None
    journal_title: str
    editor_role: str
    pub_count: int


class ComparisonResult(BaseModel):
    orcids: list[str]
    start_year: int
    end_year: int
    metrics_source: str
    editorial_source: str | None = None
    researchers: list[ResearcherSummary]
    journal_overlap: list[JournalOverlap]
    coauthorships: list[Coauthorship]
    editorial_cross: list[EditorialCrossRef]


class AnalysisResult(BaseModel):
    orcid: str
    researcher_name: str | None = Field(
        default=None,
        description="Nombre del investigador derivado de OpenAlex authorships (primer match)",
    )
    affiliation: str | None = None
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
