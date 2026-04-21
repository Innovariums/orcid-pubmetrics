# Brief de diseño — orcid-pubmetrics

Este documento es un brief autocontenido para un agente diseñador (o diseñador humano) que va a rediseñar toda la UX/UI de la plataforma web **orcid-pubmetrics**.

Léelo completo antes de empezar. Si necesitas contexto adicional puedes consultar `project.md`, `plan.md` y `README.md` en la raíz del repo. En `docs/fase1_demo_screenshot.png` está el estado actual de la UI (diseño funcional pero básico, pendiente de tu rediseño).

---

## 1. Qué es la aplicación

**orcid-pubmetrics** es una herramienta web para análisis bibliométrico de investigadores académicos. El usuario pega un **ORCID** (identificador global de investigador, formato `0000-0000-0000-0000`) y un rango de años, y la aplicación devuelve un dashboard visual con todas sus publicaciones indexadas agrupadas por **cuartil (Q1/Q2/Q3/Q4)**, revista, año y evolución temporal.

**Stakeholder real:** Dr. Oswaldo Langs, profesor universitario colombiano (Universidad de Córdoba). Él y su equipo usarán la herramienta, y eventualmente podría compartirse con vicerrectorías de investigación y órganos de acreditación.

**Meta de fondo (léase bien, cambia el tono del producto):** detectar patrones de "mafia editorial" entre profesores que se auto-publican mutuamente en revistas de bajo impacto para inflar puntaje de escalafón y sueldo. En Fase 2 la app comparará 2-3 investigadores simultáneamente y cruzará datos de **comités editoriales** de revistas. O sea, **esto no es un juguete**: es una herramienta semi-forense que tiene que verse creíble, seria, institucional, y que un auditor pueda presentar frente a un rector sin que se vea de juguete.

**No es:** SaaS flashy estilo startup, app de consumo, dashboard de producto. Se parece más en espíritu a una herramienta de analítica académica profesional (SciVal, Dimensions, InCites), pero moderna, limpia, sin la densidad abrumadora de esas plataformas.

---

## 2. Usuarios y escenarios

### Usuario principal
Profesor universitario (50+ años), ingeniero de sistemas de formación. Usa macOS/Windows, pantalla de escritorio, Chrome/Edge. Espera que la herramienta funcione rápido, muestre datos claros, y que los gráficos los pueda pegar en Word/PowerPoint para informes.

### Usuarios secundarios (Fase 2+)
- **Decanos y jefes de investigación:** revisan comparativas entre docentes.
- **Equipos de acreditación:** exportan reportes PDF para auditorías.
- **Los propios investigadores evaluados:** consultan su propio perfil antes de rendiciones.

### Escenarios de uso
1. "Quiero ver mi propia producción de los últimos 10 años en un gráfico bonito."
2. "Voy a comparar a 3 profesores sospechosos de coludir publicaciones."
3. "Necesito un PDF con gráficos para una reunión con el rector el viernes."
4. "Un colega me mandó su ORCID, lo pego aquí y lo analizo."

---

## 3. Stack técnico (restricciones reales)

- **Frontend:** React 18 + TypeScript strict + Vite
- **Charts:** Chart.js 4 + react-chartjs-2 (ya instalados)
- **Estilos actuales:** CSS plano en `frontend/src/index.css` con variables CSS. **Libre de proponer Tailwind, CSS modules, vanilla-extract, o quedarse en CSS plano**. Justifica tu elección.
- **NO hay librería de componentes aún** — puedes recomendar una (Radix, Headless UI, shadcn/ui, Ant Design) o componentes propios. Si recomiendas una, justifica el trade-off (peso, a11y, mantenimiento).
- **Backend** ya entrega JSON listo para consumir (ver §6 "Contrato de datos"). No lo toques.
- **Idioma:** español de Colombia. Usa terminología académica correcta ("cuartil", "índice h", "revista indexada", "ORCID", "comité editorial").

---

## 4. Tono visual y principios de diseño

| Principio | Qué significa aquí |
|-----------|---------------------|
| **Serio, no aburrido** | Nada de ilustraciones 3D, gradientes púrpura-rosa, emojis en UI, micro-animaciones excesivas. Pero tampoco feo: paleta cuidada, tipografía elegante, espaciado generoso. |
| **Datos primero** | Los números y gráficos son el producto. El chrome debe retirarse, dejar respirar los charts. |
| **Credibilidad institucional** | Se usará frente a rectores y comités. Tiene que sentirse como "herramienta de investigación" no como "app". Piensa en Linear, Vercel Analytics, SciVal moderno. |
| **Legibilidad sobre densidad** | Prefiero mucho espacio en blanco y un gráfico grande a 8 mini-widgets apretados. |
| **Accesible** | Contraste AA mínimo, foco visible, navegable por teclado. Nada rompe si se desactivan animaciones. |
| **Responsive pero con sesgo desktop** | El uso real es escritorio. Móvil debe funcionar pero no es la prioridad. |

### Paleta de cuartiles (OBLIGATORIA — no cambiarla sin permiso)
- **Q1:** verde (`#22c55e` o equivalente en la nueva paleta)
- **Q2:** azul (`#3b82f6` o equivalente)
- **Q3:** amarillo (`#eab308` o equivalente)
- **Q4:** rojo (`#ef4444` o equivalente)
- **Sin indexar:** gris (`#94a3b8` o equivalente)

Puedes ajustar los tonos exactos para que encajen mejor con la paleta general, pero el **orden semántico verde→azul→amarillo→rojo** y que "sin indexar" sea neutro son invariantes. Esta paleta aparece en chips, gráficos, stat cards y tabla.

### Paleta base (propuesta por ti)
Define un sistema de color completo:
- Fondo de app, fondo de superficies, bordes
- Acento primario (hoy es azul `#2563eb`, puedes cambiarlo)
- Texto primario/secundario/muted
- Estados (éxito/warning/error/info)
- Modo oscuro **opcional** (deseable pero no bloqueante)

### Tipografía
Actualmente: `system-ui`. Te invito a elegir algo mejor. Sugerencia (no obligatoria):
- **Sans para UI:** Inter, IBM Plex Sans, Geist Sans, o similar
- **Serif para números grandes / títulos de sección:** opcional (podría dar el aire académico)
- **Mono para ISSNs/DOIs:** JetBrains Mono, IBM Plex Mono, o similar

Especifica escala tipográfica (tamaños, line-heights, weights).

---

## 5. Vistas a diseñar

Lista completa, ordenada por prioridad. Cada vista debe entregarse con estados: default, loading, empty, error.

### 5.1 Shell / layout global (alta prioridad)
- Header con logotipo de la app (propón logo simple/wordmark), posible nav (cuando haya más vistas), selector de idioma (es/en futuro), botón de modo oscuro si lo incluyes.
- Área de contenido principal con ancho máximo (hoy 1200px, ajustable).
- Footer discreto con versión, link a docs, link a repo.
- Breadcrumbs o tabs para navegar entre vistas.

### 5.2 Vista 1 — Formulario inicial (hoy existe, rediseñar) (alta prioridad)
Pantalla de entrada. Antes de analizar, el usuario solo ve esto.

- Hero/intro breve que explique qué hace la herramienta en 1-2 líneas.
- Formulario: campo ORCID (con ejemplo de formato como placeholder/helper), dos campos de año (desde/hasta), botón "Analizar".
- Validación inline: regex ORCID, rango de años coherente.
- Estado opcional: historial de ORCIDs consultados recientemente (local storage), para que el profe pueda volver a uno con un click. Esto lo propones tú si lo ves útil.
- **Importante:** incluir el disclaimer de limitaciones (que el cuartil es SJR no JCR, que solo ve publicaciones públicas en OpenAlex) sin que asuste. Hoy está como banner amarillo después de analizar; evalúa si debe estar ahí antes o después.

### 5.3 Vista 2 — Loading state (media prioridad)
El análisis puede tardar 5-30 segundos (consulta OpenAlex + cruce SJR). El usuario necesita feedback.

- Skeleton de la pantalla de resultados, o
- Pasos visibles ("consultando ORCID → obteniendo publicaciones → resolviendo cuartiles → generando gráficos"), o
- Animación discreta + texto de lo que está pasando.

Lo que propongas debe tolerar 30 segundos sin sentirse roto.

### 5.4 Vista 3 — Resultados (Fase 1, ya existe, rediseñar) (alta prioridad)
La vista central. Hoy tiene (ver `docs/fase1_demo_screenshot.png`):

1. **Toolbar superior:** badge de fuente (SJR / JCR), ORCID y rango consultados, botón exportar CSV.
2. **Banda de stats:** 7 cards (Total, Indexadas, Q1, Q2, Q3, Q4, Sin indexar). Cada Q con su color.
3. **Disclaimer** (el banner amarillo sobre limitaciones).
4. **Fila 1 de gráficos:** bar stacked de publicaciones por año × cuartil + doughnut de distribución por cuartil.
5. **Fila 2 de gráficos:** bar horizontal top 10 revistas + line de evolución del SJR/JIF promedio.
6. **Tabla de publicaciones:** filtros por cuartil en la parte superior, columnas: Año, Cuartil (chip), Título, Revista, Categoría, Score, DOI.

**Puedes:**
- Reorganizar el layout completamente. Propón uno mejor.
- Convertir la banda de stats en KPIs más elegantes (inspiración: Linear dashboards, Vercel Analytics).
- Rediseñar los chips de cuartil (hoy son cuadrados con texto blanco sobre color).
- Proponer tooltips más ricos en los gráficos.
- Agregar acciones secundarias (ej. "ver en ORCID", "buscar en Google Scholar") en las filas de tabla.

**No puedes (invariantes):**
- Cambiar los colores semánticos de los cuartiles.
- Eliminar el disclaimer sobre la fuente SJR (es un requerimiento legal/ético).
- Ocultar publicaciones "sin indexar" — son relevantes para el análisis de redes (Fase 2).

### 5.5 Vista 4 — Detalle de publicación (media prioridad, nueva)
Click en una fila de la tabla abre un panel lateral o modal con:
- Metadata completa (autores, DOI, ORCID de co-autores, link a OpenAlex)
- Todas las categorías con sus cuartiles (una revista puede ser Q1 en una categoría y Q3 en otra — hoy solo mostramos el "headline", pero los tenemos todos en `all_metrics`)
- Si se usó fallback de año (`year_rule: fallback-1` por ejemplo), señalar con claridad

Diseña este detalle.

### 5.6 Vista 5 — Comparación de investigadores (Fase 2, alta prioridad conceptual)
**El valor real del producto.** El usuario ingresa 2-3 ORCIDs y ve:

- Lado a lado: stats y cuartiles de cada investigador
- Solapamiento de revistas donde publican todos (tabla o diagrama de Venn/UpSet)
- Si hay coautorías directas entre ellos, destacarlas
- **Diferenciador crítico:** detección de **comités editoriales compartidos** — si el investigador A está en el comité editorial de una revista donde publica B, hay que mostrarlo de forma inequívoca (pero neutra, sin acusar — la UI muestra datos, no emite juicios).

Propón la visualización:
- ¿Grafo tipo red (autores ↔ revistas ↔ comités)?
- ¿Matriz de adyacencia?
- ¿Tabla con columnas "revista / investigador A publica / investigador B publica / investigador C en comité"?

La elección de visualización es decisión tuya — justifica por qué.

**Tono muy importante aquí:** la comparación puede revelar corrupción. La UI debe presentar los hallazgos con frialdad y precisión, **nunca con lenguaje acusatorio ni alarmas rojas parpadeantes**. Etiquetas como "publica 7 veces en revista X donde Y es editor" — frío, factual. Que sea el humano quien interprete.

### 5.7 Vista 6 — Reporte exportable / vista de impresión (media prioridad, nueva)
Cuando el usuario exporta a PDF (Fase 1.5) queremos:
- Portada con ORCID, nombre del investigador, rango, fecha de generación, logo de la app
- Resumen ejecutivo en una página (KPIs + mini-chart)
- Gráficos a tamaño adecuado para impresión
- Tabla paginada con estilo print-friendly (bordes finos, gris sutil, no colores saturados salvo los chips)
- Pie de página en cada hoja con fuente SJR y disclaimer

Diseña cómo se ve este "modo documento".

### 5.8 Vista 7 — Historial / ORCIDs guardados (baja prioridad, nueva)
Lista de consultas previas del usuario (localStorage o backend en el futuro). Click para re-ejecutar. Útil para workflow recurrente.

### 5.9 Estados especiales (todas las vistas)
- **Empty state** — ORCID sin publicaciones en el rango: ilustración/icono sutil + mensaje claro + CTAs (ampliar rango, probar otro ORCID).
- **Error state** — OpenAlex caído, ORCID malformado, red muerta: mensaje útil + sugerencia de qué hacer.
- **Partial data** — la mitad de publicaciones sin ISSN: banner informativo que explique por qué, sin alarmar.

---

## 6. Contrato de datos

El backend ya devuelve un JSON tipado. Cuando diseñes, **asume que estos son los datos reales** (están en `frontend/src/types.ts`). No alucines campos.

```typescript
interface AnalysisResult {
  orcid: string;                          // "0000-0002-0170-462X"
  start_year: number;
  end_year: number;
  metrics_source: "sjr" | "jcr";          // hoy siempre "sjr"
  total_works: number;
  indexed_works: number;
  quartile_totals: { q1, q2, q3, q4, unindexed: number };
  by_year_quartile: { year, q1, q2, q3, q4, unindexed: number }[];
  score_evolution:  { year, avg_score, count: number }[];
  top_journals:     { title, issn, count }[];
  works: EnrichedWork[];                  // lista completa
}

interface EnrichedWork {
  work: {
    orcid, doi, title, journal_title, issn, eissn, pub_year, work_type;
    authors: { name, orcid }[];
    openalex_id: string | null;
  };
  metric: {                               // la "headline" — mejor cuartil entre categorías
    issn, year, source, score, score_label, quartile, category;
    category_rank, category_total: number | null;
    year_rule: "exact" | "fallback-1" | "fallback+1" | "fallback-any";
  } | null;
  all_metrics: JournalMetric[];           // una por cada categoría (Q1 Hematology + Q3 Oncology, etc.)
  not_found_reason: "no_issn" | "not_in_source" | "incomplete_metadata" | null;
}
```

Para el diseño: la mayoría de investigadores tiene entre 5 y 60 publicaciones en un rango de 10 años. El profesor Langs tiene 9. Un investigador Q1 activo puede tener 200+. Diseña para cubrir ese rango.

---

## 7. Accesibilidad

- Contraste AA en todo el texto.
- Foco visible en controles (no `outline: none`).
- Navegación 100% por teclado (tabulable, Enter/Espacio activan, Esc cierra modales).
- `aria-label` en iconos sin texto.
- Los gráficos deben tener fallback textual (caption o `aria-describedby` con el resumen numérico).
- Color nunca es el único canal: los cuartiles deben tener la etiqueta "Q1"/"Q2"/... además del color.

---

## 8. Responsive

Breakpoints sugeridos:
- **Desktop ancho** ≥ 1280px (diseño pleno)
- **Desktop base** 960-1280px (diseño pleno un poco más apretado)
- **Tablet** 640-960px (charts apilan vertical, tabla con scroll lateral)
- **Móvil** <640px (aceptable degradación, no prioritario pero funcional)

---

## 9. Deliverables esperados

Ajusta a tus capacidades; si eres un agente de código, entrega lo que tenga sentido para el stack. Idealmente:

1. **Sistema de diseño tokenizado**
   - Variables CSS (o equivalente) para colores, espaciado, radio, sombras, tipografía
   - Documento breve explicando el sistema

2. **Componentes base**
   - Button (primary/secondary/ghost), Input, Select, Chip/Badge, Card, StatCard, Tooltip, Modal/Drawer, Table, Tabs, Toast/Alert
   - Como código React + TypeScript si puedes, o como mockups con spec si no

3. **Vistas completas** (al menos §5.2 Form, §5.3 Resultados, §5.6 Comparación)
   - HTML/CSS/React o mockups de alta fidelidad
   - Un mockup por estado (default, loading, empty, error)

4. **Guía de charts**
   - Configuración visual de Chart.js para que los 4 gráficos se vean consistentes con el sistema (colores, tooltips, fuentes, leyendas)

5. **Documento de decisiones**
   - Por qué elegiste esa paleta, tipografía, librería de UI, etc. Un ADR corto basta.

Si la salida es código, respeta la estructura actual del repo:
```
frontend/src/
  api/           (no tocar)
  features/analysis/   (aquí viven los componentes de la vista Fase 1)
  components/    (crear aquí los nuevos componentes base)
  styles/        (o donde decidas poner tokens / utilidades)
  types.ts       (no tocar)
```

---

## 10. Referencias de inspiración

No copies, inspírate:
- **Linear** — limpieza, uso del espacio, tipografía
- **Vercel Analytics** — KPIs, line charts, tooltips
- **Dimensions.ai** — densidad de datos académicos bien resuelta
- **Scimago Journal Rank** — lo feo que hay que evitar
- **Stripe Dashboard** — balance de datos/elegancia
- **Observable** — visualizaciones matemáticas limpias
- **GitHub** — tablas y listas largas que no cansan

---

## 11. Lo que NO debes hacer

- Ilustraciones estilo "personaje vectorial sonriendo".
- Gradientes saturados.
- Iconografía infantil o sticker-style.
- Animaciones decorativas que distraen del dato.
- Terminología de producto SaaS ("empieza tu journey!", "descubre tu impacto"). Prefiere lenguaje académico sobrio.
- Reorganizar el backend API, el modelo de datos, o los tipos (no es tu trabajo, otro equipo lo maneja).
- Agregar tracking, analytics o cookies de terceros.

---

## 12. Primer entregable sugerido

Si vas a iterar, propongo este orden:
1. Sistema de diseño (tokens + typography + paleta) → revisa con el stakeholder
2. Componentes base (Button, Card, StatCard, Chip, Input) → revisa
3. Vista Formulario + Loading → revisa
4. Vista Resultados Fase 1 completa → **hito grande, valida con el profesor Langs**
5. Vista Comparación Fase 2 → **gran diferenciador, validar antes de implementar**
6. Vista Reporte PDF → polish final

Cada iteración entrega algo revisable (código o mockup). No entregues todo junto al final.

---

## 13. Preguntas que puedes necesitar responder tú mismo

- ¿Modo oscuro o solo claro? (Claro obligatorio, oscuro bonus).
- ¿Una librería de UI o componentes propios? (Tu decisión, justifícala).
- ¿Qué densidad de datos toleramos en la tabla de publicaciones sin hacerla incómoda?
- ¿Cómo comunicamos con elegancia que el cuartil es SJR y no JCR? (El profesor lo sabe pero quien mire el PDF quizás no).
- ¿El grafo de red en Fase 2 es un plus interactivo o una imagen estática exportable?

Decide, documenta, entrega.

---

Buena suerte. Si algo no te queda claro después de leer este brief, `project.md` y `plan.md`, **pregunta en concreto** antes de asumir. No es un brief para adivinar — es para ejecutar bien.
