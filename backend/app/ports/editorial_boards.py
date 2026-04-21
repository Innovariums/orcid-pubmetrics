from typing import Literal, Protocol, runtime_checkable

from pydantic import BaseModel, Field

EditorialSource = Literal["open_editors", "manual", "scraped"]


class EditorialMember(BaseModel):
    """Miembro de un comité editorial de una revista."""

    issn: str
    journal_title: str
    researcher_name: str
    researcher_orcid: str | None = None
    role: str = Field(description="Editor-in-Chief, Associate Editor, etc.")
    year_start: int | None = None
    year_end: int | None = None
    source: EditorialSource
    source_url: str | None = None


@runtime_checkable
class EditorialBoardProvider(Protocol):
    """Proveedor de datos de comités editoriales (Fase 2)."""

    name: str

    def get_members_by_issn(self, issn: str) -> list[EditorialMember]:
        """Miembros del comité editorial de una revista."""
        ...

    def find_journals_by_researcher(
        self, orcid: str | None = None, name: str | None = None
    ) -> list[EditorialMember]:
        """
        Revistas donde el investigador pertenece al comité editorial.

        Al menos uno de los dos (orcid o name) debe estar presente.
        Si hay ambos, orcid tiene prioridad.
        """
        ...

    def health(self) -> bool: ...
