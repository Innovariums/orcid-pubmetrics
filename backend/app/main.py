from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analysis, comparison
from app.infra.settings import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
app.include_router(comparison.router, prefix="/comparison", tags=["comparison"])


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "app": settings.app_name,
        "metrics_provider": settings.journal_metrics_provider,
        "editorial_provider": settings.editorial_boards_provider,
    }
