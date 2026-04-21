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

Fase 1 — MVP con un investigador. Ver [`plan.md §6`](./plan.md) para el detalle de fases.

## Limitaciones conocidas

Esta herramienta solo puede ver lo que las fuentes públicas exponen. Importante entenderlas antes de sacar conclusiones, y comunicárselas a quien interprete los resultados:

1. **El ORCID debe estar en OpenAlex.** OpenAlex cubre ~260M publicaciones pero no todas. Un ORCID recién creado o usado solo para revistas muy locales puede aparecer con pocas o ninguna publicación.

2. **Las publicaciones deben ser públicas.** ORCID permite al investigador marcar works como privados; esos son invisibles para la app y para cualquier otra herramienta pública.

3. **El cuartil requiere ISSN.** Los papers que OpenAlex devuelve sin ISSN (conferencias sin ISSN asignado, preprints, reportes técnicos) aparecen como **"sin ISSN"** y no pueden tener cuartil. No es un bug: es metadata faltante en origen.

4. **La revista debe estar en SJR.** Revistas pequeñas, locales, o no indexadas en Scopus quedan como **"no indexada"**. Esta señal es intencional — en la lógica del proyecto, una producción con alto porcentaje de "no indexadas" es precisamente uno de los indicadores que interesa detectar.

5. **SJR ≠ JCR.** El cuartil que se muestra es el de Scimago (basado en Scopus), no el de Clarivate/Web of Science. Para la mayoría de revistas coinciden; para algunas difieren una Q. Si su proceso de evaluación exige "cuartil JCR" formal, tenga presente que los Q que ve aquí son SJR. Ver [`project.md §9`](./project.md) para la ruta de migración a JCR.

6. **Metadatos de OpenAlex pueden tener gaps.** Ocasionalmente OpenAlex no resuelve el `journal_title` de un work (aparece como "Unknown"), o el ORCID aparece listado en varios nombres del autor. La app muestra lo que hay; validación manual recomendada para casos que se vayan a usar en informes formales.

Para cualquier publicación concreta, la tabla del detalle muestra la razón exacta por la que quedó sin cuartil (`sin ISSN`, `no indexada`, etc.) — revísela antes de interpretar agregados.
