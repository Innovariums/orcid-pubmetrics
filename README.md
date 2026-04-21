<div align="center">

# orcid-pubmetrics

**Análisis bibliométrico por ORCID — cuartil, revistas y evolución temporal.**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/tests-27%20passed-1F9D55)](./backend/tests)
[![License](https://img.shields.io/badge/license-MIT-000000)](./LICENSE)

<a href="https://orcid-pubmetrics.innovarium.site"><img src="https://img.shields.io/badge/demo-orcid--pubmetrics.innovarium.site-1F4FD1?style=for-the-badge" alt="Demo"/></a>
<a href="https://api-orcid-pubmetrics.innovarium.site/docs"><img src="https://img.shields.io/badge/api%20docs-swagger-009688?style=for-the-badge&logo=swagger&logoColor=white" alt="API docs"/></a>

</div>

---

Recibe un **ORCID** y un rango de años, consulta **OpenAlex** para obtener las publicaciones del investigador, las cruza con los rankings anuales de **Scimago Journal Rank (SJR)** y devuelve un dashboard con cuartiles, distribución por revista, evolución del score y tabla navegable.

Pensada para hacer transparentes patrones de producción académica — incluida la detección de redes de publicación cruzada ("mafias editoriales") en una Fase 2 comparativa. Ver [`project.md`](./project.md) para el contexto completo y [`plan.md`](./plan.md) para el plan por fases.

## Stack

| Capa | Tecnologías |
|------|------------|
| **Backend** | Python 3.12, FastAPI, pydantic v2, pandas (vectorized SJR loader), httpx, pytest |
| **Frontend** | React 18, TypeScript strict, Vite 5, charts SVG propios (sin Chart.js) |
| **Datos** | OpenAlex API (gratuita), Scimago CSVs anuales, Open Editors (Fase 2) |
| **Deploy** | Docker Compose, Traefik, Dokploy, Cloudflare DNS |
| **Diseño** | Tokens CSS, paleta institucional, tipografías Inter + Newsreader + JetBrains Mono |

## Arquitectura

Ports & Adapters (hexagonal). El dominio depende de **interfaces**, no de fuentes concretas — cambiar SJR por **JCR (Clarivate)** es escribir un adapter y girar una variable de entorno.

```
backend/app/
├── api/               Routers FastAPI
├── domain/            Modelo y reglas de negocio (puro)
├── ports/             Interfaces (JournalMetricsProvider, etc.)
├── adapters/          Implementaciones (OpenAlex, SJR, JCR stub, Open Editors)
└── infra/             Settings, container, DB

frontend/src/
├── components/        Primitives (Chip, Btn, Card, Icon, charts SVG)
├── features/analysis/ Vistas (Form, Loading, Results, DetailDrawer, Error)
├── hooks/             useMeasure (charts responsive)
└── types.ts           Mirror de los modelos Pydantic
```

## Desarrollo local

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate       # Windows bash / Git Bash
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```

→ http://localhost:8000/health

```bash
pytest                              # 27 tests + 4 skipped (JCR pendiente)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

### Con Docker Compose

```bash
docker compose up --build
```

→ `http://localhost` (frontend), `http://localhost:8000` (backend) — requiere ajustar labels/puertos según cómo lo corras.

## Deploy en producción

Auto-deploy via **Dokploy** conectado a `main`:

- **Frontend**: https://orcid-pubmetrics.innovarium.site
- **Backend**: https://api-orcid-pubmetrics.innovarium.site

Traefik maneja TLS (Let's Encrypt) y routing por host en `docker-compose.yml`.

## Limitaciones conocidas

La herramienta solo puede ver lo que las fuentes públicas exponen. Importante comunicárselas al usuario final:

1. **El ORCID debe estar en OpenAlex.** Cobertura ~260M works pero no 100%.
2. **Los works deben ser públicos en ORCID.** Los privados no se ven.
3. **Cuartil requiere ISSN.** Conferencias sin ISSN aparecen como *sin ISSN*.
4. **Revista debe estar en SJR.** Revistas pequeñas/locales aparecen como *no indexada* — señal deliberada.
5. **SJR ≠ JCR.** Para evaluaciones que exijan cuartil JCR formal, migrar a Ruta B (ver [`project.md §9`](./project.md)).
6. **Metadatos incompletos en OpenAlex** ocasionalmente (journal_title vacío, co-autores listados con nombres distintos).

Cada publicación en la tabla muestra la razón exacta si no tiene cuartil resoluble (`no_issn`, `not_in_source`, `incomplete_metadata`).

## Documentación

- [`project.md`](./project.md) — Contexto completo, stakeholder, fases, investigación de APIs, decisiones tomadas
- [`plan.md`](./plan.md) — Plan de desarrollo, arquitectura Ports & Adapters, modelo de datos, tests de contrato

## Licencia

MIT — ver [LICENSE](./LICENSE).

---

<div align="center">
<sub>Construido para el <strong>Dr. Oswaldo Vélez-Langs</strong> (Universidad de Córdoba).</sub>
</div>
