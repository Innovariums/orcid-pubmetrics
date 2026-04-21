from typing import Protocol, runtime_checkable

from pydantic import BaseModel, Field


class Author(BaseModel):
    name: str
    orcid: str | None = None


class Work(BaseModel):
    """Publicación (work) de un investigador, normalizada."""

    orcid: str = Field(description="ORCID del investigador consultado")
    doi: str | None = None
    title: str
    journal_title: str | None = None
    issn: str | None = Field(default=None, description="ISSN normalizado sin guión")
    eissn: str | None = None
    pub_year: int
    work_type: str = "article"
    authors: list[Author] = Field(default_factory=list)
    openalex_id: str | None = None


@runtime_checkable
class PublicationProvider(Protocol):
    """Proveedor de publicaciones dado un ORCID (OpenAlex hoy, Scopus mañana)."""

    name: str

    def get_works_by_orcid(
        self, orcid: str, start_year: int, end_year: int
    ) -> list[Work]:
        """
        Devuelve todas las publicaciones del investigador en el rango.

        Lista vacía si el ORCID no existe o no tiene publicaciones.
        El filtro por años es inclusivo en ambos extremos.
        """
        ...

    def health(self) -> bool: ...
