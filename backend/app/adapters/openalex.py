from app.ports.publications import PublicationProvider, Work


class OpenAlexPublicationProvider:
    """Publications via OpenAlex. Se implementa en Fase 1."""

    name: str = "openalex"
    API_BASE = "https://api.openalex.org"

    def __init__(self, mailto: str) -> None:
        self.mailto = mailto

    def get_works_by_orcid(self, orcid: str, start_year: int, end_year: int) -> list[Work]:
        raise NotImplementedError("Fase 1: implementar OpenAlex /works filter=author.orcid")

    def health(self) -> bool:
        return bool(self.mailto)


_: PublicationProvider = OpenAlexPublicationProvider(mailto="test@example.com")
