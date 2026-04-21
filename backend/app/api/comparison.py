from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.domain.comparison import compare_researchers
from app.domain.models import ComparisonResult
from app.infra.container import (
    get_editorial_board_provider,
    get_metrics_provider,
    get_publication_provider,
)
from app.ports.editorial_boards import EditorialBoardProvider
from app.ports.journal_metrics import JournalMetricsProvider
from app.ports.publications import PublicationProvider

router = APIRouter()

ORCID_RE = r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$"


class ComparisonRequest(BaseModel):
    orcids: list[str] = Field(min_length=2, max_length=5)
    start_year: int = Field(ge=1900, le=2100)
    end_year: int = Field(ge=1900, le=2100)

    @field_validator("orcids")
    @classmethod
    def validate_orcids(cls, v: list[str]) -> list[str]:
        import re

        pattern = re.compile(ORCID_RE)
        cleaned = [o.strip() for o in v]
        for o in cleaned:
            if not pattern.match(o):
                raise ValueError(f"ORCID inválido: {o}")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("ORCIDs duplicados")
        return cleaned

    @field_validator("end_year")
    @classmethod
    def end_after_start(cls, v: int, info) -> int:
        start = info.data.get("start_year")
        if start is not None and v < start:
            raise ValueError("end_year must be >= start_year")
        return v


def _optional_editorial_provider() -> EditorialBoardProvider | None:
    try:
        return get_editorial_board_provider()
    except (NotImplementedError, Exception):
        return None


@router.post("", response_model=ComparisonResult)
def create_comparison(
    req: ComparisonRequest,
    publications: PublicationProvider = Depends(get_publication_provider),
    metrics: JournalMetricsProvider = Depends(get_metrics_provider),
) -> ComparisonResult:
    editorial = _optional_editorial_provider()
    try:
        return compare_researchers(
            orcids=req.orcids,
            start_year=req.start_year,
            end_year=req.end_year,
            publications=publications,
            metrics=metrics,
            editorial_boards=editorial,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
