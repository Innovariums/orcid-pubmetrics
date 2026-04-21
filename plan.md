# Plan de desarrollo — App Web de Análisis Bibliométrico por ORCID

Complemento de [`project.md`](./project.md). Este documento define **cómo** vamos a construir la aplicación, con énfasis en dejar el camino limpio para una futura migración de **SJR (Ruta A, gratuita) → JCR (Ruta B, institucional)** sin reescribir el resto del sistema.

---

## 1. Principio rector: Ports & Adapters

El código se organiza en tres capas:

```
┌─────────────────────────────────────────────────┐
│  adapters (concretos: OpenAlex, SJR, JCR…)      │   ← intercambiables
├─────────────────────────────────────────────────┤
│  ports (interfaces abstractas)                  │   ← contratos estables
├─────────────────────────────────────────────────┤
│  domain (modelo + reglas de negocio)            │   ← agnóstico de fuente
└─────────────────────────────────────────────────┘
```

El **dominio nunca importa un adapter**. Solo conoce los **ports**. Cambiar de SJR a JCR = escribir un nuevo adapter que cumpla el mismo port. Cero cambios en domain, API, frontend.

---

## 2. Interfaces clave (ports)

Todo lo que hable con un servicio externo pasa por uno de estos protocolos. Son el contrato que hay que respetar si mañana se cambia la fuente.

### 2.1 Proveedor de métricas de revista (cuartil)

```python
# backend/app/ports/journal_metrics.py
from typing import Protocol, Literal
from datetime import date
from pydantic import BaseModel

class JournalMetric(BaseModel):
    """Métrica de una revista para un año concreto. Fuente-agnóstica."""
    issn: str                               # normalizado sin guión
    year: int                               # año al que corresponde la métrica
    source: Literal["sjr", "jcr"]           # proveedor que la emitió
    score: float                            # SJR score o JIF
    score_label: str                        # "SJR" | "JIF" (display)
    quartile: Literal["Q1", "Q2", "Q3", "Q4"]
    category: str                           # "Computer Science (miscellaneous)", etc.
    category_rank: int | None
    category_total: int | None
    year_rule: Literal["exact", "fallback-1", "fallback+1", "fallback-any"]

class JournalMetricsProvider(Protocol):
    name: Literal["sjr", "jcr"]

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        """
        Devuelve todas las métricas disponibles (puede haber múltiples categorías).
        Lista vacía si no se encontró la revista. Nunca devuelve None.
        Implementa fallback ±1 año internamente si no hay exacto, y reporta
        la regla usada en JournalMetric.year_rule.
        """
        ...

    def health(self) -> bool:
        """Smoke check: ¿el provider está listo para responder?"""
        ...
```

**Reglas clave:**

- El dominio recibe `list[JournalMetric]` y decide qué hacer (mostrar mejor cuartil, todos, etc.). El provider **no** toma esa decisión.
- El campo `source` viaja en cada métrica: en UI podemos mostrar badges "SJR 2023" o "JCR 2023" según corresponda.
- `score_label` evita hardcodear "SJR" o "JIF" en el frontend.
- Migración a JCR = nueva clase `ClarivateJcrProvider` que implementa `JournalMetricsProvider`. Se registra en el container y listo.

### 2.2 Proveedor de publicaciones (ORCID → works)

```python
# backend/app/ports/publications.py
class Work(BaseModel):
    orcid: str
    doi: str | None
    title: str
    journal_title: str | None
    issn: str | None
    eissn: str | None
    pub_year: int
    work_type: str                          # "article", "book-chapter", etc.
    authors: list[str]                      # lista de nombres
    openalex_id: str | None                 # para trazabilidad

class PublicationProvider(Protocol):
    def get_works_by_orcid(
        self, orcid: str, start_year: int, end_year: int
    ) -> list[Work]: ...
```

Implementaciones previstas:
- `OpenAlexPublicationProvider` (default, Fase 1)
- `OrcidDirectProvider` (fallback cuando OpenAlex falla)
- `ScopusPublicationProvider` (si alguna vez hay acceso institucional)

### 2.3 Proveedor de comités editoriales (Fase 2)

```python
# backend/app/ports/editorial_boards.py
class EditorialMember(BaseModel):
    issn: str
    journal_title: str
    researcher_name: str
    researcher_orcid: str | None
    role: str                               # "Editor-in-Chief", "Associate Editor", etc.
    year_start: int | None
    year_end: int | None
    source: Literal["open_editors", "manual", "scraped"]
    source_url: str | None

class EditorialBoardProvider(Protocol):
    def get_members_by_issn(self, issn: str) -> list[EditorialMember]: ...
    def find_journals_by_researcher(
        self, orcid: str | None, name: str | None
    ) -> list[EditorialMember]: ...
```

Implementaciones:
- `OpenEditorsProvider` (dataset Zenodo cargado en DB)
- `ManualListProvider` (CSV curado por el profe)
- `ScrapedProvider` (Playwright por dominio)

---

## 3. Modelo de datos (agnóstico de fuente)

> **Nota de estado actual:** el schema SQL de abajo es el plan para cuando
> entre el cache persistente (Fase 3). **Hoy no está implementado** — el
> backend es stateless y responde síncrono sin persistir nada. El
> `DATABASE_URL` apunta a un SQLite que nadie escribe. Las decisiones de
> tipado (columna `source` polimórfica) siguen siendo válidas cuando toque
> materializar.

SQLite en Fase 1. PostgreSQL en Fase 3. El schema es idéntico.

```sql
-- Investigadores consultados
CREATE TABLE researchers (
  orcid TEXT PRIMARY KEY,
  display_name TEXT,
  last_affiliation TEXT,
  first_seen_at TIMESTAMP,
  last_updated_at TIMESTAMP
);

-- Publicaciones
CREATE TABLE works (
  id INTEGER PRIMARY KEY,
  orcid TEXT NOT NULL REFERENCES researchers(orcid),
  doi TEXT,
  openalex_id TEXT,
  title TEXT NOT NULL,
  journal_title TEXT,
  issn TEXT,
  eissn TEXT,
  pub_year INTEGER NOT NULL,
  work_type TEXT,
  authors_json TEXT,
  UNIQUE(orcid, doi)
);
CREATE INDEX idx_works_orcid_year ON works(orcid, pub_year);
CREATE INDEX idx_works_issn ON works(issn);

-- Revistas (catálogo normalizado)
CREATE TABLE journals (
  issn TEXT PRIMARY KEY,
  eissn TEXT,
  title_normalized TEXT
);

-- Métricas de revista (polimórfica por fuente — SJR hoy, JCR mañana)
CREATE TABLE journal_metrics (
  id INTEGER PRIMARY KEY,
  issn TEXT NOT NULL,
  year INTEGER NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('sjr', 'jcr')),
  score REAL,
  score_label TEXT,                         -- "SJR" | "JIF"
  quartile TEXT CHECK(quartile IN ('Q1','Q2','Q3','Q4')),
  category TEXT NOT NULL,
  category_rank INTEGER,
  category_total INTEGER,
  UNIQUE(issn, year, source, category)
);
CREATE INDEX idx_metrics_lookup ON journal_metrics(issn, year, source);

-- Comités editoriales
CREATE TABLE editorial_boards (
  id INTEGER PRIMARY KEY,
  issn TEXT NOT NULL,
  researcher_name TEXT NOT NULL,
  researcher_orcid TEXT,
  role TEXT,
  year_start INTEGER,
  year_end INTEGER,
  source TEXT NOT NULL,                    -- 'open_editors' | 'manual' | 'scraped'
  source_url TEXT
);
CREATE INDEX idx_editorial_issn ON editorial_boards(issn);
CREATE INDEX idx_editorial_orcid ON editorial_boards(researcher_orcid);

-- Consultas y resultados (auditoría + cache)
CREATE TABLE queries (
  id INTEGER PRIMARY KEY,
  kind TEXT CHECK(kind IN ('single','comparison')),
  orcids_json TEXT NOT NULL,                -- ["0000-...","0000-..."]
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  status TEXT CHECK(status IN ('pending','running','done','failed')),
  metrics_source TEXT NOT NULL,             -- 'sjr' | 'jcr' (trazabilidad)
  created_at TIMESTAMP,
  finished_at TIMESTAMP,
  error TEXT
);

CREATE TABLE query_work_metrics (
  query_id INTEGER REFERENCES queries(id),
  work_id INTEGER REFERENCES works(id),
  metric_id INTEGER REFERENCES journal_metrics(id),   -- NULL si no indexada
  not_found_reason TEXT,                  -- 'no_issn' | 'not_in_source' | 'incomplete_metadata'
  year_rule TEXT,                         -- 'exact' | 'fallback-1' | ...
  PRIMARY KEY(query_id, work_id)
);
```

**Por qué la tabla `journal_metrics` lleva columna `source`:**

- Permite que coexistan métricas SJR y JCR para la misma revista.
- Habilita el feature "comparar cuartiles SJR vs JCR" sin cambiar schema.
- En las consultas del dominio se filtra por `source = <provider configurado>`; cambiar de proveedor es una variable de entorno.

---

## 4. Configuración y selección de proveedores

Un único archivo `.env` controla todo:

```bash
# backend/.env
OPENALEX_MAILTO=jgasparlopez29@gmail.com   # requerido por OpenAlex ToS

JOURNAL_METRICS_PROVIDER=sjr                # sjr | jcr
SJR_DATA_DIR=./data/sjr                     # CSVs anuales de Scimago

# Activar cuando/si la universidad habilita JCR
JCR_API_KEY=
JCR_API_BASE=https://api.clarivate.com/apis/wos-journal/v1

EDITORIAL_BOARDS_PROVIDER=open_editors      # open_editors | manual | composite
OPEN_EDITORS_DATA_PATH=/data/open_editors/openeditors_plus.parquet

DATABASE_URL=sqlite:////data/app.db

# CORS (whitelist de orígenes autorizados)
CORS_ORIGINS=["https://orcid-pubmetrics.innovarium.site"]
```

**En producción** estas variables viven en Dokploy (`compose.env`);
el `docker-compose.yml` las consume con `${VAR:-default}`. Para cambiar
un dominio o la API key de Clarivate basta con editarlo en la UI de
Dokploy y redeployar — no requiere recommit.

El contenedor de dependencias resuelve los providers al arrancar:

```python
# backend/app/container.py
def resolve_metrics_provider() -> JournalMetricsProvider:
    match settings.JOURNAL_METRICS_PROVIDER:
        case "sjr":  return ScimagoSjrProvider(data_dir=settings.SJR_DATA_DIR)
        case "jcr":  return ClarivateJcrProvider(api_key=settings.JCR_API_KEY)
        case other:  raise ValueError(f"Unknown provider: {other}")
```

Migrar a JCR cuando la universidad lo active:
1. Implementar `ClarivateJcrProvider` (es la única clase nueva)
2. Cambiar `JOURNAL_METRICS_PROVIDER=jcr` y poner la API key
3. Redesplegar

Nada más toca.

---

## 5. Estructura del repositorio

```
orcid/
├── project.md
├── plan.md
├── README.md                        # público, con badges y demo link
├── LICENSE                          # MIT
├── docker-compose.yml               # backend + frontend para Dokploy
├── backend/
│   ├── Dockerfile                   # COPY data /data para bake de datasets
│   ├── pyproject.toml
│   ├── .env.example
│   ├── app/
│   │   ├── main.py                  # FastAPI + CORS
│   │   ├── api/
│   │   │   ├── analysis.py
│   │   │   ├── comparison.py
│   │   │   └── og.py                # /og/preview, /og/image.png (PIL)
│   │   ├── domain/                  # puro, sin I/O
│   │   │   ├── models.py            # pydantic: EnrichedWork, ComparisonResult, ...
│   │   │   ├── analytics.py         # análisis individual
│   │   │   └── comparison.py        # Fase 2
│   │   ├── ports/
│   │   │   ├── journal_metrics.py
│   │   │   ├── publications.py
│   │   │   └── editorial_boards.py
│   │   ├── adapters/
│   │   │   ├── openalex.py          # httpx + cursor pagination
│   │   │   ├── sjr_csv.py           # pandas vectorizado
│   │   │   ├── jcr_clarivate.py     # stub, esperando API key
│   │   │   └── open_editors.py      # parquet + pyarrow + dict lookups
│   │   └── infra/
│   │       ├── settings.py          # pydantic-settings desde env
│   │       └── container.py         # lru_cache de providers
│   └── tests/
│       ├── unit/                    # 14 OpenAlex + 5 comparison + 5 analytics + fakes
│       ├── contract/                # tests parametrizados SJR/JCR
│       └── test_api_analysis.py, test_health.py
├── frontend/
│   ├── Dockerfile                   # multi-stage node build + nginx serve
│   ├── nginx.conf                   # SPA fallback + UA routing a /og/preview
│   ├── package.json
│   ├── index.html                   # SEO estático + fuentes Google
│   ├── public/                      # favicon.svg, og-image.jpg, robots.txt, sitemap.xml
│   └── src/
│       ├── api/client.ts            # fetch tipado
│       ├── App.tsx                  # state machine (tab, stage, drawer)
│       ├── urlParams.ts             # serialización URL ↔ estado
│       ├── types.ts                 # espejo de pydantic models
│       ├── hooks/useMeasure.ts      # ResizeObserver para charts
│       ├── components/
│       │   ├── primitives.tsx       # Chip, Btn, Card, StatCard, Icon, Sparkline
│       │   ├── charts.tsx           # 4 SVG charts responsive
│       │   ├── Shell.tsx            # shell con tabs
│       │   └── ShareButton.tsx      # copy-to-clipboard con feedback
│       └── features/
│           ├── analysis/
│           │   ├── AnalysisForm.tsx
│           │   ├── LoadingView.tsx
│           │   ├── ResultsView.tsx
│           │   ├── DetailDrawer.tsx      # reusado desde compare con compareContext
│           │   ├── ErrorState.tsx
│           │   ├── exportCsv.ts
│           │   └── pdfReport.tsx         # @react-pdf/renderer
│           └── comparison/
│               ├── CompareForm.tsx
│               ├── CompareView.tsx
│               ├── CoopGraph.tsx         # grafo bipartito SVG
│               ├── exportCsv.ts
│               └── pdfReport.tsx
└── data/
    ├── sjr/                         # 12 CSVs 2013-2024 (commiteados, 132 MB)
    └── open_editors/                # parquet Open Editors Plus 2026 (57 MB)
```

---

## 6. Fases de desarrollo

Cada fase tiene **criterio de aceptación** concreto (lo que el profe puede ver funcionando).

### Fase 0 — Setup ✅

- [x] Repo público en Innovariums/orcid-pubmetrics
- [x] Estructura de carpetas (ver §5 al final)
- [x] FastAPI + SQLite + React + Vite + pytest corriendo
- [x] CSVs SJR 2013-2024 (132 MB) committed y bakeados en la imagen
- [x] Open Editors Plus 2026 parquet (57 MB) committed y bakeado

### Fase 1 — MVP: un investigador ✅

**Backend:**
- [x] Endpoint `POST /analysis` con validación pydantic
- [x] `OpenAlexPublicationProvider` con paginación cursor + tests httpx mock (14 unit)
- [x] `ScimagoSjrProvider` vectorizado con pandas, ~566k (issn, year) keys,
  load <1s tras bake
- [x] Dominio: `analytics.analyze` con `quartile_totals`, `by_year_quartile`,
  `score_evolution`, `top_journals`, `works` enriquecidos
- [x] Marcado de no-indexados con `not_found_reason ∈ {no_issn, not_in_source, incomplete_metadata}`

**Frontend:**
- [x] Formulario + loading state con pasos simulados + skeleton
- [x] 4 gráficos SVG custom (StackedBar, Doughnut, HBar, Line)
- [x] Tabla de publicaciones con filter pills por cuartil, click-to-open
- [x] Export CSV client-side
- [x] DetailDrawer lateral con cuartil por categoría, autores, IDs, CTAs

### Fase 1.5 — Robustez (parcial)

- [x] **Export PDF** con `@react-pdf/renderer`: cover + KPIs + 4 charts
  SVG + tabla paginada. Fuentes built-in de PDF para cero dependencias
  de red
- [x] **Tests de contrato parametrizados** (`tests/contract/test_journal_metrics_provider.py`):
  mismo suite corre contra SJR (4 verdes) y JCR (skipped por diseño
  hasta que haya API key)
- [x] **Manejo elegante de ORCIDs sin publicaciones / sin ISSN**
- [x] **URL compartible** (`/?tab=...&orcid=...&from=...&to=...`) con
  auto-ejecución al montar + back/forward vía `popstate`
- [x] **Open Graph dinámico** con nginx UA-sniffing y backend endpoint
  (/og/preview + /og/image.png + /og/compare.png)
- [ ] Cache persistente de resultados (pendiente)
- [ ] Logging estructurado (pendiente)

### Fase 2 — Comparación y comités editoriales ✅

**Backend:**
- [x] Endpoint `POST /comparison` (2-5 ORCIDs, validación estricta)
- [x] Dominio `comparison.compare_researchers()` con:
  - `_compute_journal_overlap` (dedup por (issn, title_norm))
  - `_compute_coauthorships` (dedup por openalex_id/doi, devuelve EnrichedWork completo)
  - `_compute_editorial_cross` (cruces publisher↔editor por revista)
  - `has_editorial_conflict` flag propagado a JournalOverlap
- [x] `OpenEditorsProvider` sobre Open Editors Plus 2026 (Zenodo 19590816,
  parquet 57 MB, 922k miembros, 14.8k revistas, 247k ORCIDs indexados)
- [x] Tests unit con FakeEditorialBoards (5 verdes)

**Frontend:**
- [x] Vista comparación 2-5 ORCIDs (CompareForm con badges dinámicos A-E)
- [x] Grafo bipartito SVG custom (no Cytoscape — más control, sin deps)
- [x] Tabla de solapamiento con matriz por investigador + badges
  "X en comité"
- [x] Tabla de cruces editoriales
- [x] Tabla de coautorías click-to-open reutilizando el mismo
  `DetailDrawer` de Analysis, con prop `compareContext` que agrega panel
  "Cooperación del grupo" y tonaliza autores del grupo
- [x] CSV + PDF de comparación
- [x] UI neutra: datos sin juicios, tonos sin alarmas

### Fase 3 — Escalamiento y despliegue (parcial)

- [x] **Dockerización**: backend Dockerfile con data bakeada, frontend
  multi-stage (Node build + Nginx serve), docker-compose.yml
- [x] **Dokploy** compose en el proyecto Herramientas, auto-deploy en
  push a `main`, env vars centralizadas en Dokploy UI
- [x] **Cloudflare DNS**: dos A records hacia el VPS, TLS vía Traefik
  + Let's Encrypt (proxied false para validación HTTP-01)
- [x] **Nginx** del frontend con SPA fallback, gzip, cache agresivo de
  assets, UA routing para bots sociales vía `map` + `resolver`
- [x] **CORS** en backend con whitelist de dominios
- [ ] Migración a PostgreSQL (pendiente; SQLite sirve para stateless MVP)
- [ ] Cola asíncrona Celery + Redis (endpoint aún síncrono)

### Fase 4 (condicional) — Migración a JCR

Se dispara **solo si** la universidad activa JCR/InCites.

Checklist:
- [ ] Implementar `ClarivateJcrProvider` en `adapters/jcr_clarivate.py`
- [ ] Pasar el suite de tests de contrato existente contra el nuevo adapter
- [ ] Cargar `JCR_API_KEY` y cambiar `JOURNAL_METRICS_PROVIDER=jcr` en producción
- [ ] Re-ejecutar consultas históricas para poblar `journal_metrics` con rows `source='jcr'`
- [ ] Agregar toggle en UI: "Ver con cuartil SJR / JCR / Ambos"
- [ ] Redesplegar

**Tiempo estimado:** 3-5 días netos de desarrollo, sin tocar dominio, modelo de datos, endpoints ni frontend principal.

---

## 7. Tests de contrato: el seguro anti-migración

En `backend/tests/contract/test_journal_metrics_provider.py` vivirá un único test suite parametrizado sobre todas las implementaciones de `JournalMetricsProvider`:

```python
@pytest.fixture(params=["sjr", "jcr"])
def provider(request):
    if request.param == "sjr":
        return ScimagoSjrProvider(data_dir="tests/fixtures/sjr")
    if request.param == "jcr":
        pytest.skip("JCR provider no disponible sin API key")
        return ClarivateJcrProvider(api_key=os.getenv("JCR_API_KEY"))

def test_known_journal_returns_quartile(provider):
    results = provider.get_metrics("03064573", 2023)
    assert len(results) >= 1
    assert all(m.quartile in {"Q1","Q2","Q3","Q4"} for m in results)

def test_unknown_journal_returns_empty(provider):
    assert provider.get_metrics("00000000", 2023) == []

def test_fallback_year_when_no_exact_match(provider):
    results = provider.get_metrics("03064573", 2099)
    # Si hay datos cercanos, debe reportar la regla
    for m in results:
        assert m.year_rule in {"exact","fallback-1","fallback+1","fallback-any"}
```

Si el día de mañana el nuevo `ClarivateJcrProvider` no pasa este suite, el problema está **en el adapter**, no en el dominio. Nos enteramos en CI antes de desplegar.

---

## 8. Riesgos específicos del plan y cómo los mitigamos

| Riesgo | Mitigación |
|--------|-----------|
| Un adapter filtra detalles de su fuente (p.ej. un campo `sjr_value` en el response) | Revisión de PR: nada dentro de `domain/` o `api/` puede importar de `adapters/`. Regla de lint (`import-linter`) que lo haga obligatorio |
| Se introduce un endpoint que asume SJR | Contrato de respuesta tipado con Pydantic (`JournalMetric`) se valida en runtime |
| Migración a JCR revela que los cuartiles cambian para muchas revistas | Guardar siempre `source` en `query_work_metrics`; mostrar en UI "este informe se generó con SJR el día X" |
| Open Editors queda desactualizado | ETL programado trimestralmente para refrescar el dataset; fallback a scraping manual para revistas críticas |
| Rate limit de OpenAlex | `OPENALEX_MAILTO` declarado (pool gratis más generoso); caché agresiva por ORCID |

---

## 9. Qué entrego al profesor al cierre de cada fase

- **Fase 0:** link al repo y al README que explica cómo levantar localmente
- **Fase 1:** URL de staging + video corto demostrando su propio ORCID analizado
- **Fase 1.5:** PDF de ejemplo exportado desde la app
- **Fase 2:** URL con la comparación de 2 ORCIDs que él elija + reporte PDF
- **Fase 3:** URL productiva con dominio
- **Fase 4 (si aplica):** informe comparativo SJR vs JCR sobre los mismos investigadores
