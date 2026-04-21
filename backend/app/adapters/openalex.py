"""
OpenAlex adapter para obtener publicaciones por ORCID.

Docs: https://docs.openalex.org/api-entities/works
Polite pool: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication#the-polite-pool
"""
from __future__ import annotations

import re
from typing import Any

import httpx

from app.ports.publications import Author, PublicationProvider, Work

ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")
ISSN_RE = re.compile(r"^\d{4}-?\d{3}[\dX]$")


def _normalize_orcid(orcid: str) -> str:
    """Acepta '0000-0002-...' o URL; devuelve la forma bare."""
    tail = orcid.strip().rsplit("/", 1)[-1]
    if not ORCID_RE.match(tail):
        raise ValueError(f"ORCID inválido: {orcid}")
    return tail


def _normalize_issn(issn: str | None) -> str | None:
    """Devuelve ISSN de 8 dígitos sin guión, o None."""
    if not issn:
        return None
    cleaned = issn.strip().replace("-", "").upper()
    if len(cleaned) == 8 and cleaned[:7].isdigit() and (cleaned[7].isdigit() or cleaned[7] == "X"):
        return cleaned
    return None


def _extract_doi(raw_doi: str | None) -> str | None:
    if not raw_doi:
        return None
    # OpenAlex devuelve DOIs como "https://doi.org/10.xxx/..."; guardamos la parte canónica.
    return raw_doi.replace("https://doi.org/", "").lower() or None


def _parse_work(orcid: str, raw: dict[str, Any]) -> Work | None:
    """Convierte un item de OpenAlex al modelo Work. Devuelve None si falta data crítica."""
    pub_year = raw.get("publication_year")
    title = raw.get("title") or raw.get("display_name")
    if pub_year is None or not title:
        return None

    primary = raw.get("primary_location") or {}
    source = primary.get("source") or {}
    issn_l = source.get("issn_l")
    issns = source.get("issn") or []

    issn = _normalize_issn(issn_l) or next(
        (x for x in (_normalize_issn(i) for i in issns) if x), None
    )
    eissn = None
    if issns:
        # Heurística: si hay varios ISSN, el segundo suele ser el electrónico.
        candidates = [x for x in (_normalize_issn(i) for i in issns) if x and x != issn]
        eissn = candidates[0] if candidates else None

    authors: list[Author] = []
    for a in raw.get("authorships", []):
        author = a.get("author") or {}
        orcid_raw = author.get("orcid")
        authors.append(
            Author(
                name=author.get("display_name", "unknown"),
                orcid=(orcid_raw.rsplit("/", 1)[-1] if orcid_raw else None),
            )
        )

    return Work(
        orcid=orcid,
        doi=_extract_doi(raw.get("doi")),
        title=title,
        journal_title=source.get("display_name"),
        issn=issn,
        eissn=eissn,
        pub_year=int(pub_year),
        work_type=raw.get("type", "article") or "article",
        authors=authors,
        openalex_id=raw.get("id"),
    )


class OpenAlexPublicationProvider:
    """Publications via OpenAlex `/works` con filtro por ORCID y años."""

    name: str = "openalex"
    API_BASE = "https://api.openalex.org"
    PER_PAGE = 200

    def __init__(self, mailto: str, client: httpx.Client | None = None) -> None:
        if not mailto:
            raise ValueError("OpenAlex requiere mailto para el polite pool")
        self.mailto = mailto
        self._client = client or httpx.Client(
            base_url=self.API_BASE,
            timeout=30.0,
            headers={"User-Agent": f"orcid-pubmetrics ({mailto})"},
        )

    def get_works_by_orcid(self, orcid: str, start_year: int, end_year: int) -> list[Work]:
        if start_year > end_year:
            raise ValueError("start_year debe ser <= end_year")
        bare = _normalize_orcid(orcid)

        params_base = {
            "filter": (
                f"author.orcid:{bare},"
                f"from_publication_date:{start_year}-01-01,"
                f"to_publication_date:{end_year}-12-31"
            ),
            "per_page": self.PER_PAGE,
            "mailto": self.mailto,
        }

        works: list[Work] = []
        cursor = "*"
        while cursor:
            res = self._client.get("/works", params={**params_base, "cursor": cursor})
            res.raise_for_status()
            payload = res.json()
            for raw in payload.get("results", []):
                w = _parse_work(bare, raw)
                if w is not None:
                    works.append(w)
            cursor = (payload.get("meta") or {}).get("next_cursor")
        return works

    def health(self) -> bool:
        try:
            res = self._client.get("/works", params={"per_page": 1, "mailto": self.mailto})
            return res.status_code == 200
        except httpx.HTTPError:
            return False


_: PublicationProvider = OpenAlexPublicationProvider(mailto="test@example.com")
