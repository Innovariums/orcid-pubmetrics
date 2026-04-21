from functools import lru_cache

from app.adapters.jcr_clarivate import ClarivateJcrProvider
from app.adapters.open_editors import OpenEditorsProvider
from app.adapters.openalex import OpenAlexPublicationProvider
from app.adapters.publindex import PublindexProvider
from app.adapters.sjr_csv import ScimagoSjrProvider
from app.infra.settings import settings
from app.ports.editorial_boards import EditorialBoardProvider
from app.ports.journal_metrics import JournalMetricsProvider
from app.ports.publications import PublicationProvider


@lru_cache(maxsize=1)
def get_publication_provider() -> PublicationProvider:
    return OpenAlexPublicationProvider(mailto=settings.openalex_mailto)


@lru_cache(maxsize=1)
def get_metrics_provider() -> JournalMetricsProvider:
    match settings.journal_metrics_provider:
        case "sjr":
            return ScimagoSjrProvider(data_dir=settings.sjr_data_dir)
        case "jcr":
            return ClarivateJcrProvider(
                api_key=settings.jcr_api_key,
                api_base=settings.jcr_api_base,
            )


@lru_cache(maxsize=1)
def get_editorial_board_provider() -> EditorialBoardProvider:
    if settings.editorial_boards_provider == "open_editors":
        return OpenEditorsProvider(data_path=settings.open_editors_data_path)
    raise NotImplementedError(
        f"Editorial boards provider '{settings.editorial_boards_provider}' not implemented yet"
    )


@lru_cache(maxsize=1)
def get_publindex_provider() -> PublindexProvider:
    return PublindexProvider(data_path=settings.publindex_data_path)
