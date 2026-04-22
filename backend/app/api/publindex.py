from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.adapters.publindex import PublindexProvider
from app.infra.container import get_publindex_provider

router = APIRouter()


class PublindexYearItem(BaseModel):
    year: int
    category: str


class PublindexEntry(BaseModel):
    issn: str
    name: str | None = None
    area: str | None = None
    big_area: str | None = None
    country: str | None = None
    best_category: str
    latest_year: int
    latest_category: str
    history: list[PublindexYearItem]
    homepage_url: str | None = None
    email: str | None = None
    editorial_team_url: str | None = None
    is_ojs: bool = False


class PublindexLookupRequest(BaseModel):
    issns: list[str] = Field(default_factory=list, max_length=500)


class PublindexLookupResponse(BaseModel):
    entries: dict[str, PublindexEntry]


@router.post("/lookup", response_model=PublindexLookupResponse)
def lookup(
    req: PublindexLookupRequest,
    provider: PublindexProvider = Depends(get_publindex_provider),
) -> PublindexLookupResponse:
    found = provider.lookup_many(req.issns)
    entries: dict[str, PublindexEntry] = {}
    for issn, rec in found.items():
        entries[issn] = PublindexEntry(
            issn=rec.issn,
            name=rec.name,
            area=rec.area,
            big_area=rec.big_area,
            country=rec.country,
            best_category=rec.best_category,
            latest_year=rec.latest_year,
            latest_category=rec.latest_category,
            history=[
                PublindexYearItem(year=h.year, category=h.category) for h in rec.history
            ],
            homepage_url=rec.homepage_url,
            email=rec.email,
            editorial_team_url=rec.editorial_team_url,
            is_ojs=rec.is_ojs,
        )
    return PublindexLookupResponse(entries=entries)
