from fastapi import FastAPI

from app.api import analysis
from app.infra.settings import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "app": settings.app_name,
        "metrics_provider": settings.journal_metrics_provider,
        "editorial_provider": settings.editorial_boards_provider,
    }
