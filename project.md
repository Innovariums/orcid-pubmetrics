# Proyecto: App Web de Análisis Bibliométrico por ORCID

**Stakeholder:** Dr. Oswaldo Langs (profesor universitario)
**Responsable técnico:** José Gaspar
**Fecha de arranque de documentación:** 2026-04-20
**Estado:** Aprobado — arrancamos desarrollo por Ruta A (OpenAlex + SJR + Open Editors)
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

### Fase 1 — MVP (objetivo inmediato)

- Un único ORCID como input
- Rango de años configurable
- Backend consulta ORCID + API JCR (Clarivate) y resuelve cuartil por publicación
- Dashboard con:
  - Histograma publicaciones/año por cuartil
  - Frecuencia por cuartil (total)
  - Frecuencia por JIF en bins
  - Top revistas
  - Evolución temporal del JIF promedio
- Tabla de publicaciones con filtros
- Exportación CSV + PDF

**Criterio de éxito de Fase 1:** cargar el ORCID del profesor Langs, visualizar su propia producción, que los datos cuadren con su CV oficial.

### Fase 2 — Comparación y detección de redes (donde está el valor real)

- Input: **2 a 3 ORCIDs** lado a lado
- Métricas nuevas:
  - Solapamiento de revistas donde publican (¿publican en las mismas?)
  - Frecuencia con la que se coautorean entre sí
  - Distribución de cuartiles comparada
- **Detección de comités editoriales cruzados** ⚠️ (feature central):
  - ¿El investigador A pertenece al comité editorial de alguna revista donde publica el investigador B?
  - ¿Y viceversa?
  - Visualización de red (grafo) de relaciones autor ↔ revista ↔ comité

**Nota técnica crítica:** Los datos de comités editoriales **no están en ORCID, Scopus ni WoS** como dato estructurado. Hay que resolverlos por scraping dirigido a sitios de revistas o bases especializadas. Esto es investigación aparte (ver §7).

### Fase 3 — Escalamiento

- Cache persistente en DB (evitar recargar ORCIDs consultados)
- Procesamiento asíncrono (cola Celery/BullMQ + Redis) para ORCIDs con muchas publicaciones
- Dashboard comparativo más rico
- Posible autenticación institucional si llega a desplegarse a nivel universidad

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

### 4.1 Stack

- **Frontend:** React (SPA)
- **Charts:** Chart.js para MVP; migración eventual a Plotly/ECharts si se requieren gráficos de red (Fase 2)
- **UI framework:** MUI o Tailwind (decisión pendiente — preferencia: Tailwind por ligereza)
- **Backend:** Python + FastAPI
- **Base de datos:** SQLite para MVP, PostgreSQL cuando se despliegue
- **Cache:** tabla local en MVP; Redis cuando se meta cola (Fase 3)
- **Cola asíncrona:** Celery + Redis (Fase 3, no en MVP)

### 4.2 Endpoints REST (propuestos)

```
POST  /analysis                     body: { orcid, start_year, end_year }
GET   /analysis/{id}/status
GET   /analysis/{id}/results
GET   /analysis/{id}/export.csv
GET   /analysis/{id}/export.pdf
```

Para Fase 2:

```
POST  /comparison                   body: { orcids: [...], start_year, end_year }
GET   /comparison/{id}/results
GET   /comparison/{id}/editorial-overlap
```

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

### 4.5 Modelo de datos (borrador)

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

## 5. Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Clarivate no vende API a individuos | **CONFIRMADO** (abril 2026) | Ruta A: usar Scimago SJR (cuartil equivalente, gratis). Ruta B: esperar a que la universidad active JCR institucional. Ver §8 |
| ORCIDs con metadatos incompletos (sin ISSN/DOI) | Medio | Enriquecimiento vía CrossRef + WoS Starter API |
| Costo API prohibitivo | Alto | Si sale de presupuesto del profe, proponer Plan B gratuito (Scimago + OpenAlex) |
| Datos de comités editoriales no disponibles vía API | Alto (Fase 2) | Scraping dirigido, cache agresivo, validación manual del profesor en primera iteración |
| Falsos positivos en "mafia detection" | Alto (reputacional) | La app muestra **datos**, no emite juicios. UI debe ser clara: "publica en la misma revista X veces" en vez de "coluden" |
| Rate limits de ORCID API | Bajo | Cache local + backoff |

---

## 6. Roadmap inmediato

1. **[COMPLETADO]** Investigación de precios y factibilidad de APIs → §8
2. **[SIGUIENTE]** Enviar al profesor resumen: no puede comprar JCR API personalmente. Presentarle las 2 rutas (A: SJR+OpenAlex gratis / B: esperar JCR institucional)
3. Con su decisión: montar repo, iniciar Fase 1 con la ruta elegida
4. En paralelo, que él consulte con biblioteca/investigación si la universidad ya tiene JCR (por si se puede hacer Ruta B sin costo extra)

### Próximos 7 días

- [ ] Completar investigación de APIs
- [ ] Enviar al profesor reporte de costos con 2-3 opciones
- [ ] Esperar decisión de presupuesto
- [ ] Crear repo con esqueleto FastAPI + React
- [ ] Endpoint `POST /analysis` funcional con ORCID mock (sin JCR aún)

---

## 7. Investigación especial: comités editoriales (Fase 2)

**Estado:** pendiente. Posibles fuentes a explorar:

- **Scraping directo de sitios editoriales** (cada revista lista su comité; no hay formato estándar). Requiere parser por dominio.
- **OpenAlex:** tiene `institutions` y `authors` pero no modela `editorial_boards` explícitamente.
- **Researchfish / ORCID (membership):** ORCID permite declarar membresías (incluye comités); depende de que el investigador lo haya registrado (alta variabilidad).
- **Publons / Web of Science Researcher Profile (Clarivate):** históricamente rastreaba reviewer activity y editorships. Estado post-merge de Publons: verificar qué sobrevivió.

**Decisión provisional:** para MVP asumir scraping ad-hoc + pedir al profesor una lista manual de revistas y comités sospechosos como seed data para validar el concepto.

---

## 8. Investigación de APIs (abril 2026)

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

## 9. Decisiones tomadas y pendientes

**Tomadas:**
- [x] **Ruta A** (OpenAlex + SJR + Open Editors) — 2026-04-20
- [x] Presupuesto aprobado (~$0/mes para Fase 1)
- [x] Arquitectura con interfaces abstractas para futura migración a JCR

**Pendientes:**
- [ ] Hosting concreto (Vercel/Render/VPS) — a definir al cierre de Fase 1
- [ ] Regla final de cuartil por categoría múltiple (default: mejor cuartil; confirmar al ver UI)
- [ ] Repositorio creado (GitHub privado)
- [ ] Consulta del profesor a biblioteca sobre JCR institucional (paralelo)
