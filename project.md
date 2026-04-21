# Proyecto: App Web de Análisis Bibliométrico por ORCID

**Stakeholder:** Dr. Oswaldo Langs (profesor universitario)
**Responsable técnico:** José Gaspar
**Fecha de arranque de documentación:** 2026-04-20
**Estado:** Fases 1, 1.5 y 2 en producción — una y multi-investigador, comités editoriales, export CSV/PDF, URL compartibles, Open Graph dinámico.

**URLs productivas:**
- App: https://orcid-pubmetrics.innovarium.site
- API: https://api-orcid-pubmetrics.innovarium.site (Swagger en `/docs`)
- Repo: https://github.com/Innovariums/orcid-pubmetrics (público, MIT, auto-deploy en push a `main`)

**Plan de desarrollo detallado:** ver [`plan.md`](./plan.md)

---

## 1. Visión y propósito real

### 1.1 Problema que se quiere resolver

El profesor Langs detectó una práctica que considera corrupta en el ámbito académico latinoamericano: **redes de publicación cruzada** ("mafias editoriales") entre profesores de distintas universidades. El esquema, en palabras del profesor:

> "Los profesores se están poniendo de acuerdo para publicar en cierto tipo de revistas que no tienen ningún tipo de importancia. Publican en revistas locales y empiezan a pedir puntos, inflan el sueldo. Así mismo, el de la otra universidad viene y publica acá en una revista que tiene el otro en una universidad. Es una conducta inmoral. Es corrupción."

Estas prácticas se amparan en el marco legal vigente ("le buscaron el lado flaco a la ley") pero distorsionan los sistemas de incentivos académicos: puntos de escalafón, aumentos salariales, acreditación, etc.

### 1.2 Por qué cuartiles JCR (no SJR, no Scopus)

El profesor insiste en **cuartiles JCR (Clarivate / Web of Science)** porque:

> "Las Q son internacionales, son los indicadores que realmente valen."

Es decir: son el estándar globalmente reconocido para evaluación científica seria. Publicar en Q1/Q2 es difícil y caro de falsear. Las revistas de la "mafia" típicamente **no** están en JCR o están en Q3/Q4, lo que facilita detectar el patrón.

### 1.3 Objetivo a largo plazo

Herramienta de **transparencia académica** que permita a rectorías, vicerrectorías de investigación y observatorios independientes evidenciar con datos estos patrones de publicación coordinada y proponer políticas correctivas.

---

## 2. Alcance por fases

### Fase 1 — MVP (✅ en producción)

Un solo ORCID como input, rango de años configurable, pipeline
OpenAlex → SJR (Ruta A, ver §9). Dashboard con:

- Banda de 7 KPIs (Total, Indexadas, Q1-Q4, Sin indexar) con tono cromático
- Stacked bar publicaciones/año × cuartil (SVG custom, sin Chart.js)
- Doughnut distribución por cuartil
- HBar top 10 revistas
- Line chart evolución del SJR promedio
- Tabla de publicaciones con filtro por cuartil y click-to-open del detalle
- DetailDrawer con todas las categorías SJR + autores + identificadores + CTAs

Export CSV y PDF funcionales. **Criterio cumplido:** ORCIDs reales validados
(0000-0002-0170-462X, 0000-0002-9489-0520, etc.).

### Fase 1.5 — Robustez (parcial, ver §7)

- [x] Export PDF (react-pdf/renderer con fuentes built-in, gráficos vectoriales)
- [x] Manejo elegante de ORCIDs sin publicaciones / sin ISSN
- [x] Tests de contrato parametrizados SJR/JCR (4 tests verdes en SJR, skipped JCR)
- [x] URL parametrizable y compartible; Open Graph dinámico por análisis (§4.6)
- [ ] Cache persistente (hoy `@lru_cache` en memoria; se pierde al reiniciar)
- [ ] Logging estructurado

### Fase 2 — Comparación y detección de redes (✅ en producción)

- Input: **2–5 ORCIDs** (validación en backend y frontend)
- Dominio `comparison.compare_researchers()` calcula:
  - `journal_overlap`: revistas donde publican ≥2 del grupo, con cuartil best y conteo por investigador
  - `coauthorships`: works donde ≥2 del grupo son coautores directos (dedupeados por openalex_id/doi)
  - `editorial_cross`: (publisher, editor, revista, pub_count) — "A publica en revista donde B está en comité"
  - `has_editorial_conflict`: flag por revista (para coloreo sospechoso en grafo y tabla)
- UI:
  - Cards por investigador con MiniQDist tonalizado A/B/C/D/E
  - Tabla de solapamiento con badges "X en comité"
  - Grafo bipartito (SVG custom) autor ↔ revista, grosor ∝ frecuencia, revista con comité cruzado en **rojo**
  - Tabla de cruces editoriales
  - Tabla de coautorías click-to-open → mismo DetailDrawer con panel "Cooperación del grupo"
- Export CSV (4 secciones) y PDF de 2-3 páginas
- Fuente de comités: **Open Editors Plus 2026** (dataset Zenodo, 922k miembros, 14.8k revistas, 26 editoriales grandes; ver §8)

### Fase 3 — Escalamiento (parcial)

- [x] Dockerización (backend + frontend), compose en Dokploy con auto-deploy desde GitHub
- [x] Cloudflare DNS + Traefik + Let's Encrypt para TLS
- [x] CORS configurado para dominio productivo
- [ ] Migración a PostgreSQL (hoy SQLite no-persistente; no se persisten queries, solo resultados live)
- [ ] Cola asíncrona Celery + Redis (hoy endpoint síncrono; respuesta 5-60s según volumen)
- [ ] Autenticación institucional (si llega el caso)

---

## 3. Respuestas del profesor (WhatsApp + llamada telefónica)

| Pregunta | Respuesta |
|----------|-----------|
| Fuente del cuartil | **JCR / Clarivate Web of Science** (ratificado en llamada) |
| Suscripción institucional a Clarivate | **NO se cuenta con ella** — el profesor asumirá el costo personalmente para fase inicial ("di a comprarlas para probar, hacer proyecto directamente y no inmiscuir a nadie") |
| Usuarios de la app | **Solo él inicialmente.** Hosting simple para pruebas de despliegue, sin concurrencia alta |
| Cuartil por categoría (Q1 en una, Q3 en otra) | No respondió explícitamente. **Decisión por defecto:** mostrar el mejor cuartil de la revista, con la categoría en tooltip. Revisitar antes de implementar si el profesor se opone |
| Comparar varios investigadores | **Sí, en Fase 2.** Alcance: 2-3 investigadores. Es el objetivo real del proyecto |
| Detección de comités editoriales | **Sí, explícitamente solicitado en llamada.** Es Fase 2 o 3 |
| Fecha objetivo | No mencionó una fecha dura |
| Presupuesto API | No dio cifra. El bloqueador actual es saber cuánto cuesta (investigación en curso) |

---

## 4. Arquitectura técnica (consolidada del PDF + llamada)

### 4.1 Stack (estado actual)

- **Frontend:** React 18 + TypeScript strict + Vite 5 (SPA)
- **Charts:** SVG custom propios (no Chart.js) — 4 componentes en `frontend/src/components/charts.tsx` + 1 en `frontend/src/features/comparison/CoopGraph.tsx`. Decisión: cero dependencias de charts, responsive vía `ResizeObserver`, colores exactos del design system
- **Estilos:** CSS plano con tokens (`op-*`), fuentes Inter + Newsreader serif + JetBrains Mono desde Google Fonts
- **PDF export:** `@react-pdf/renderer` con fuentes built-in PDF (Helvetica, Times-Roman, Courier). Gráficos re-implementados en `<Svg>` nativo de react-pdf
- **Backend:** Python 3.12 + FastAPI + pydantic v2 + pandas (vectorized SJR loader) + pyarrow (parquet Open Editors) + Pillow (OG images)
- **Base de datos:** SQLite no persistente (no se persisten queries, todo live). Postgres pendiente (Fase 3)
- **Cache:** `@lru_cache(maxsize=1)` en el container de providers — SJR y Open Editors se cargan una vez por proceso. Cache persistente por consulta: pendiente
- **Deploy:** Docker Compose → Dokploy (auto-deploy en push a `main`) → Traefik → Cloudflare DNS (Innovarium)

### 4.2 Endpoints REST (actuales, en producción)

```
GET   /health                       estado + provider configurado

POST  /analysis                     body: { orcid, start_year, end_year }
                                    → AnalysisResult (síncrono)

POST  /comparison                   body: { orcids: [...], start_year, end_year }
                                    → ComparisonResult (síncrono, 2-5 ORCIDs)

# Open Graph dinámico (consumido por nginx cuando detecta bot social)
GET   /og/preview?tab=...&orcid=... → HTML con meta tags og:* específicos
GET   /og/preview?tab=compare&orcids=... → idem para comparación
GET   /og/image.png?orcid=...       → PNG 1200×630 generado con PIL
GET   /og/compare.png?orcids=...    → PNG 1200×630 comparación

GET   /docs                         Swagger auto-generado
GET   /openapi.json                 OpenAPI schema
```

Export CSV y PDF viven 100% client-side: el frontend recibe el JSON
completo y genera los archivos sin ida-y-vuelta al backend.

No hay endpoints `/status` ni `/results/{id}` — la arquitectura es
síncrona hoy. Cuando entre Celery (Fase 3) se agrega el patrón
`{id, status:"pending"}` + polling.

### 4.3 Módulos lógicos

| Módulo | Responsabilidad |
|--------|-----------------|
| A. Entrada y validación | Validar formato ORCID, rango de fechas |
| B. Recolección ORCID | Token público `/read-public`, consultar works, normalizar |
| C. Normalización bibliográfica | Deduplicar, extraer ISSN/eISSN/DOI, resolver journal title |
| D. Consulta JCR | Por ISSN preferentemente; recuperar JIF, cuartil, categoría, año JCR; cachear |
| E. Analítica | Agrupar por año/cuartil/categoría; calcular porcentajes; dataset para charts |
| F. Visualización y reporte | Histogramas, barras por cuartil, líneas JIF, exportar CSV/PDF |
| **G. Comparación (Fase 2)** | Cruzar ORCIDs contra pool de revistas; detectar solapamientos |
| **H. Comités editoriales (Fase 2/3)** | Scraper/conector a bases de editorial boards |

### 4.4 Reglas de negocio clave

1. **Clave de cruce publicación ↔ JCR:** ISSN/eISSN preferentemente. Fallback: DOI → source title.
2. **Año JCR vs año publicación:** usar el mismo año; fallback anterior/posterior con trazabilidad (guardar `jcr_year_rule_used`).
3. **Publicaciones no indexadas en JCR:** marcar con `indexed_in_jcr = false` y `jcr_not_found_reason ∈ {no_issn, not_in_jcr, incomplete_metadata}`. No descartarlas; mostrarlas como "no indexadas" en la visualización.
4. **Cuartil por categoría múltiple:** default = mejor cuartil; exponer las demás categorías en el detalle.

### 4.5 Compartir: URL parametrizable + Open Graph dinámico

La pantalla de resultados es **idempotente sobre la URL**:

```
/?tab=analysis&orcid=0000-...&from=2010&to=2026
/?tab=compare&orcids=A,B,C,D,E&from=2015&to=2025
```

Al abrir la URL el formulario se pre-llena y la consulta se ejecuta
automáticamente. El back/forward del navegador re-ejecuta según los
params nuevos. El botón **Compartir** copia `window.location.href` al
portapapeles con feedback "Copiado ✓".

**Open Graph dinámico para previews de WhatsApp / X / LinkedIn / Slack
/ Discord / Telegram / Facebook**:

- Nginx tiene un `map $http_user_agent $is_social_bot` que detecta
  ~15 UAs de crawlers sociales.
- Si el UA matchea, nginx hace `proxy_pass http://backend:8000/og/preview$args`
  en vez de servir la SPA.
- El backend devuelve HTML mínimo con `<title>`, `og:title`,
  `og:description`, `og:image` personalizados según los params +
  un `<script>window.location.replace(...)>` por si llega un humano
  con UA raro.
- `og:image` apunta a `/og/image.png?orcid=...` o `/og/compare.png?orcids=...`
  que PIL genera on-the-fly con la paleta del design system (título
  serif, chip ORCID mono, 5 cards Q1-Q4 + sin-indexar, footer con
  dominio). Cacheado 24 h.

Humanos no ven el HTML dinámico — reciben la SPA. Solo los bots lo reciben.

### 4.6 Modelo de datos (borrador — aún no implementado)

```
researchers (id, orcid, name, affiliation_last_known)
works (id, orcid, doi, issn, eissn, journal_title, pub_year, title, work_type)
journals (id, issn, eissn, title_normalized)
jcr_metrics (journal_id, year, jif, quartile, category, edition)  -- PK: (journal_id, year, category)
editorial_boards (journal_id, researcher_orcid, role, year_start, year_end, source)
queries (id, orcid_input, start_year, end_year, status, created_at)
query_results (query_id, work_id, jcr_metric_id_used, jcr_year_rule_used)
```

---

## 5. Limitaciones de cobertura (lo que la app NO puede ver)

Documentadas de cara al usuario en `README.md`. Resumen técnico:

| Limitación | Consecuencia en la UI | Mitigación |
|-----------|----------------------|------------|
| ORCID no está en OpenAlex | Resultado vacío o muy corto | Revisar manualmente en orcid.org; considerar consultar ORCID API directamente como fallback |
| Publicaciones marcadas privadas en ORCID | No aparecen | Ninguna (respeta decisión del investigador) |
| Work sin ISSN en OpenAlex | Marcado `sin ISSN` — no resoluble | Futuro: enriquecer con CrossRef por DOI (Fase 1.5) |
| Revista no indexada en SJR | Marcado `no indexada` — **este es el patrón que el proyecto quiere detectar** | Es feature, no bug |
| SJR ≠ JCR en algunas revistas | Q mostrado difiere del JCR oficial | Migración a JCR vía Ruta B (§9) cuando la universidad lo active |
| `journal_title` vacío en OpenAlex | "Unknown" en top revistas | Validación manual para informes formales |

**Decisión explícita:** la app muestra lo que las fuentes públicas exponen. No alucina ni rellena con heurísticas especulativas. Si una publicación no tiene cuartil resoluble, queda marcada con la razón específica (`no_issn`, `not_in_source`, `incomplete_metadata`) y el usuario lo ve en la tabla.

## 6. Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Clarivate no vende API a individuos | **CONFIRMADO** (abril 2026) | Ruta A: usar Scimago SJR (cuartil equivalente, gratis). Ruta B: esperar a que la universidad active JCR institucional. Ver §9 |
| ORCIDs con metadatos incompletos (sin ISSN/DOI) | Medio | Enriquecimiento vía CrossRef + WoS Starter API |
| Costo API prohibitivo | Alto | Si sale de presupuesto del profe, proponer Plan B gratuito (Scimago + OpenAlex) |
| Datos de comités editoriales no disponibles vía API | Alto (Fase 2) | Scraping dirigido, cache agresivo, validación manual del profesor en primera iteración |
| Falsos positivos en "mafia detection" | Alto (reputacional) | La app muestra **datos**, no emite juicios. UI debe ser clara: "publica en la misma revista X veces" en vez de "coluden" |
| Rate limits de ORCID API | Bajo | Cache local + backoff |

---

## 7. Roadmap: qué sigue

Fase 1, 1.5 y 2 están **en producción**. Lo siguiente en prioridad:

### Corto plazo (Fase 1.5 lo que falta)

- [ ] **Cache persistente** por `(orcid, start_year, end_year, provider)`.
  Hoy cada consulta pega a OpenAlex live; una segunda consulta del mismo
  ORCID reprocesa todo. Con SQLite/Postgres se puede resolver en ms.
- [ ] **Logging estructurado** (JSON logs, correlation ID por request).

### Medio plazo (Fase 3)

- [ ] **Postgres** reemplaza SQLite. Tablas del §4.6 se materializan
  cuando entra el cache persistente.
- [ ] **Cola asíncrona** (Celery o BullMQ con Redis): el endpoint pasa
  a patrón 202 + polling cuando el pipeline tarda más de ~10s.
- [ ] **Comités editoriales en revistas latinoamericanas**: scraping
  dirigido con Playwright contra una lista seed que aporte el profe
  (Open Editors Plus no las cubre bien).

### Largo plazo (Fase 4 — condicional)

- [ ] **Migración a JCR** si la universidad activa Clarivate. Escribir
  `ClarivateJcrProvider` en `adapters/jcr_clarivate.py` (ya hay stub),
  pasar tests de contrato, girar env var. Estimado 3-5 días netos.

### Pendiente por el profesor

- Consultar a biblioteca / vicerrectoría de investigación si la universidad
  tiene acceso institucional a JCR/InCites (para evaluar Fase 4).
- Aportar lista semilla de revistas / investigadores sospechosos para
  validar detección editorial con casos conocidos.

---

## 8. Comités editoriales (resuelto con Open Editors Plus 2026)

**Estado:** en producción con el dataset **Open Editors Plus 2026** (Zenodo
record 19590816), descargado como parquet (57 MB) y bakeado en la imagen
Docker. El `OpenEditorsProvider` (`backend/app/adapters/open_editors.py`)
lo carga lazy con pandas + pyarrow e indexa por `(issn, orcid, nombre)`
para lookups O(1).

**Cobertura:**
- 14.881 revistas únicas
- 246.782 ORCIDs de editores
- 613.212 nombres de editores
- 922k posiciones editoriales totales (editor, associate editor,
  editor-in-chief, etc.)
- 26 editoriales grandes: Elsevier, Springer, Wiley, Taylor & Francis,
  SAGE, Nature Research, Cambridge, Oxford Academic, Frontiers, PLOS,
  MDPI, IEEE, ACM, Hindawi, AMS, etc.

**Qué cubre bien:** revistas mainstream anglosajonas / internacionales.
**Qué NO cubre:** revistas latinoamericanas pequeñas, sociedades científicas
regionales, publicaciones de editoriales independientes. Fallback futuro:
scraping dirigido con Playwright a lista seed del profesor (Fase 3).

El cruce `editorial_cross` en `ComparisonResult` emite una tupla por
cada patrón *"publisher publica en revista donde editor está en comité"*
con el conteo de publicaciones. El flag `has_editorial_conflict` en
`JournalOverlap` se activa cuando hay solapamiento revista ↔ comité
para al menos un investigador del grupo, y dispara el coloreo rojo en
UI y el badge "COMITÉ" en el grafo.

---

## 9. Investigación de APIs (abril 2026)

### 8.1 Hallazgo crítico

**El profesor NO puede comprar la Clarivate Web of Science Journals API por su cuenta.** Clarivate no vende esta API a individuos: es un add-on de una suscripción institucional a **JCR** o **InCites**. Los precios son negociados caso por caso (reportado: miles a decenas de miles USD/año) y no están publicados. No hay trial ni sandbox gratuito.

Esto invalida el supuesto con el que arrancamos ("el profe compra la API y probamos"). Hay que comunicárselo y presentar alternativas.

### 8.2 Tabla comparativa

| API | Acceso individual | Costo | Cubre cuartil JCR | Free tier | ORCID lookup |
|---|---|---|---|---|---|
| **WoS Journals API** (Clarivate) | ❌ No | Solo con JCR institucional | ✅ Sí | ❌ | Indirecto |
| **WoS Starter API** (Clarivate) | ✅ Sí | Gratis limitado | ❌ **No** | 50 req/día | ✅ Sí |
| **Scopus API** (Elsevier) | API key sí, datos reales **requieren IP institucional** | Por contrato | ❌ (solo CiteScore/SJR/SNIP) | 20k req/sem | ✅ Sí |
| **OpenAlex** | ✅ Sí | ~$0/mes para uso individual | ❌ (tiene proxy 2yr_mean_citedness) | $1/día crédito (~10k calls) | ✅ Sí |
| **SJR (Scimago)** | ✅ Sí | Gratis (CSV anual) | ❌ **pero sí cuartil SJR oficial** | Libre CC BY-NC | ❌ |
| **Dimensions** | ✅ Sí (académicos) | Gratis no-comercial | ❌ (RCR propio) | Por solicitud | ✅ Sí |
| **Open Editors** | ✅ Sí | Gratis (CSV Zenodo) | N/A | Libre | N/A (comités) |

### 8.3 Recomendación técnica — Ruta A (gratuita, viable)

**OpenAlex (metadata) + SJR CSV (cuartil) + Open Editors (comités Fase 2)**

1. **ORCID → publicaciones**: OpenAlex `GET /works?filter=author.orcid:<ORCID>,from_publication_date:YYYY-01-01,to_publication_date:YYYY-12-31`
2. **Extraer ISSN**: OpenAlex expone `primary_location.source.issn_l`
3. **Cuartil**: cargar CSV anual de SJR en SQLite/Postgres, indexado por `(issn, year)`. Lookup offline, 0 latencia.
4. **Comités editoriales (Fase 2)**: dataset Open Editors (~594k posiciones de 7.3k revistas de 26 editoriales grandes — Elsevier, Springer, Wiley, SAGE, etc.). Se descarga de Zenodo, se carga como tabla.
5. **Cache local** por ORCID para evitar recargas.

**Costo total estimado: $0–10 USD/mes** incluso con uso intensivo.

**Diferencia SJR vs JCR (lo que hay que comunicarle al profe):**
- SJR usa Scopus; JCR usa WoS Core Collection.
- SJR tiene **cuartil oficial Q1–Q4 por categoría** — es un sustituto funcional.
- Organismos como **CNEAI (España)** ya aceptan SJR. Es probable que su institución también.
- Un artículo puede ser Q1 en JCR y Q2 en SJR (o viceversa) por metodologías distintas — hay que mostrarlo claramente en UI.

### 8.4 Ruta B — JCR oficial (vía institución)

Si el profesor considera indispensable tener cuartil JCR:

- **No puede comprarlo personalmente.**
- Debe pedir a la **biblioteca / dirección de investigación** de su universidad que verifique si ya tienen suscripción a **JCR** o **InCites**. Muchas universidades la tienen y el add-on de WoS Journals API solo requiere habilitación administrativa.
- Si no la tienen y la quiere contratar institucionalmente: el proceso toma meses y requiere aprobación de rectoría.

**Recomendación práctica:** arrancar Fase 1 con Ruta A (SJR + OpenAlex). Si en paralelo la universidad activa JCR, migrar a Ruta B sin cambiar el frontend (solo cambia la fuente del cuartil en el backend).

### 8.5 Factibilidad de Fase 2 (comités editoriales)

**Viable** gracias a Open Editors:
- Dataset CSV libre con ~594 000 posiciones editoriales
- Cubre las 26 editoriales grandes (Elsevier, Springer, Wiley, Taylor & Francis, SAGE, etc.)
- Actualización de marzo 2026
- Código open-source en GitHub (se puede re-ejecutar para actualizar)

**Limitación:** revistas pequeñas, latinoamericanas o de sociedades científicas **no están en Open Editors**. Para esas, plan: scraping dirigido con Playwright/BeautifulSoup por lista de revistas que aporte el profe (seed data). Trabajo manual significativo pero acotado.

### 8.6 Decisión tomada

El profesor aprobó **Ruta A** (OpenAlex + SJR + Open Editors) el 2026-04-20 vía WhatsApp.

Se compromete además a consultar en paralelo con biblioteca/investigación si la universidad ya tiene JCR/InCites institucional, para evaluar una eventual migración a Ruta B sin que impacte el frontend ni el modelo de datos. El plan de desarrollo (ver `plan.md`) está diseñado con **interfaces abstractas** que permiten intercambiar el proveedor de cuartiles sin reescribir el resto del sistema.

### 8.7 Fuentes consultadas

- [Clarivate Developer Portal – WoS Journals API](https://developer.clarivate.com/apis/wos-journal)
- [Clarivate Developer Portal – WoS Starter API](https://developer.clarivate.com/apis/wos-starter)
- [Elsevier Developer Portal](https://dev.elsevier.com/) · [API quotas](https://dev.elsevier.com/api_key_settings.html)
- [OpenAlex – Sources object](https://developers.openalex.org/api-entities/sources/source-object) · [Pricing](https://help.openalex.org/hc/en-us/articles/24397762024087-Pricing) · [Rate limits](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- [Scimago Journal & Country Rank](https://www.scimagojr.com/) · [CSV download](https://www.scimagojr.com/journalrank.php)
- [Open Editors project](https://openeditors.ooir.org/) · [Oxford paper](https://academic.oup.com/rev/article/32/2/228/6747989)
- [Dimensions Metrics API](https://www.dimensions.ai/products/all-products/metrics-api/)
- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [JCR vs Scimago — Erasmus MC](https://medbib.erasmusmc.nl/en/faq/what-is-the-difference-between-impact-factors-and-quartile-scores-from-jcr-and-scimago/)

---

## 10. Decisiones tomadas y pendientes

**Tomadas:**
- [x] **Ruta A** (OpenAlex + SJR + Open Editors) — 2026-04-20
- [x] Presupuesto aprobado (~$0/mes para Fases 1-2)
- [x] Arquitectura Ports & Adapters con `JournalMetricsProvider`
  intercambiable para migración futura a JCR sin tocar dominio/UI
- [x] Fase 1 en producción
- [x] Fase 1.5 parcial: PDF, URL compartibles, Open Graph dinámico, tests de contrato
- [x] Fase 2 en producción: comparación multi-ORCID (2-5), grafo de
  cooperación, cruce con comités editoriales (Open Editors Plus 2026,
  922k miembros)
- [x] Regla de cuartil por categoría múltiple: **mejor cuartil como
  headline**, todas las categorías en `all_metrics` para el detalle
- [x] Repo público en **Innovariums/orcid-pubmetrics** (GitHub)
- [x] Hosting: **Dokploy** sobre VPS Innovarium, subdominios
  `orcid-pubmetrics.innovarium.site` (front) y
  `api-orcid-pubmetrics.innovarium.site` (back), TLS vía Traefik +
  Let's Encrypt
- [x] Data bakeada en la imagen Docker (SJR 2013-2024 + Open Editors
  Plus 2026) para evitar volume mounts frágiles

**Pendientes:**
- [ ] Cache persistente de consultas → Postgres (Fase 3)
- [ ] Cola asíncrona Celery/Redis si el profesor consulta ORCIDs con
  cientos de publicaciones (hoy tope síncrono cómodo ≈ 100 pubs × 5
  investigadores en compare)
- [ ] Consulta del profesor a biblioteca sobre JCR institucional
- [ ] Lista seed de revistas/investigadores sospechosos para validar
  detección editorial con casos conocidos (aporta el profesor)
- [ ] Scraping dirigido de comités editoriales de revistas
  latinoamericanas que Open Editors no cubre
