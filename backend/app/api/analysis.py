from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.domain.analytics import analyze
from app.domain.models import AnalysisResult
from app.infra.container import get_metrics_provider, get_publication_provider
from app.ports.journal_metrics import JournalMetricsProvider
from app.ports.publications import PublicationProvider

router = APIRouter()

ORCID_RE = r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$"


class AnalysisRequest(BaseModel):
    orcid: str = Field(pattern=ORCID_RE, description="0000-0002-0170-462X")
    start_year: int = Field(ge=1900, le=2100)
    end_year: int = Field(ge=1900, le=2100)

    @field_validator("end_year")
    @classmethod
    def end_after_start(cls, v: int, info) -> int:
        start = info.data.get("start_year")
        if start is not None and v < start:
            raise ValueError("end_year must be >= start_year")
        return v


@router.post("", response_model=AnalysisResult)
def create_analysis(
    req: AnalysisRequest,
    publications: PublicationProvider = Depends(get_publication_provider),
    metrics: JournalMetricsProvider = Depends(get_metrics_provider),
) -> AnalysisResult:
    try:
        return analyze(
            orcid=req.orcid,
            start_year=req.start_year,
            end_year=req.end_year,
            publications=publications,
            metrics=metrics,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
