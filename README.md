# orcid-pubmetrics

App web de análisis bibliométrico por ORCID. Recibe un ORCID y un rango de años y devuelve visualizaciones de publicaciones agrupadas por cuartil, año, JIF/SJR y revista. Pensada para detectar patrones de publicación coordinada ("mafias editoriales") mediante comparación de 2-3 investigadores y cruce con datos de comités editoriales.

**Stakeholder:** Dr. Oswaldo Langs (Universidad de Córdoba)
**Contexto completo:** [`project.md`](./project.md)
**Plan de desarrollo:** [`plan.md`](./plan.md)

## Arquitectura

Monorepo con Ports & Adapters. El dominio es agnóstico de la fuente de datos; el proveedor de métricas de revista es intercambiable (SJR hoy, JCR cuando la universidad active la suscripción).

```
backend/     FastAPI + SQLAlchemy + pytest
frontend/    React + Vite + TypeScript + Chart.js
data/        SJR CSVs, Open Editors dataset (no commiteado, se descarga)
docs/        especificación original, cuestionarios, material de contexto
```

## Arranque local

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows bash
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```

Visita http://localhost:8000/health.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visita http://localhost:5173.

## Fase actual

Fase 0 — scaffold. Ver [`plan.md §6`](./plan.md) para el detalle de fases.
