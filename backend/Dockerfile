FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        fonts-liberation2 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# pyproject/deps primero para maximizar cache
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir .

# App
COPY backend/app ./app

# Data bakeada en la imagen (~190 MB): evita depender de volume mounts
# del orquestador. Si quieres sustituir con volume, monta /data ro.
COPY data /data

ENV SJR_DATA_DIR=/data/sjr \
    OPEN_EDITORS_DATA_PATH=/data/open_editors/openeditors_plus.parquet \
    DATABASE_URL=sqlite:////data/app.db \
    JOURNAL_METRICS_PROVIDER=sjr \
    EDITORIAL_BOARDS_PROVIDER=open_editors \
    LOG_LEVEL=INFO

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
