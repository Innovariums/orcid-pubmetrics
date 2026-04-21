from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

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


@router.post("", status_code=202)
def create_analysis(req: AnalysisRequest) -> dict:
    """
    Stub Fase 0: recibe la request válida y devuelve un id placeholder.
    Implementación completa en Fase 1.
    """
    raise HTTPException(status_code=501, detail="Fase 1: implementar pipeline completo")
