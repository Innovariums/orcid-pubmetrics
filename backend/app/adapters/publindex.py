"""
Publindex (Índice Nacional de Publicaciones, MinCiencias Colombia).

Dos fuentes de datos, ambas committeadas en data/publindex/:

- publindex.json          — histórico 2004-2024 (~907 ISSNs únicos) para
                            clasificación por año.
- publindex_current.json  — 287 revistas vigentes en la última convocatoria
                            (2024) con homepage_url, email, teléfono y
                            direcciones institucionales.

Uso en la app: feature *secundaria* de exploración. No reemplaza al provider
principal (SJR) ni altera las etiquetas "no indexada" que muestra la UI. Sólo
responde a:
  - ¿Cuáles de las "no indexadas" aparecen en Publindex?
  - ¿Dónde queda el sitio oficial de cada una?
"""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

PublindexCategory = Literal["A1", "A2", "B", "C"]
_VALID_CATEGORIES: set[str] = {"A1", "A2", "B", "C"}
# Orden de "mejor" a "peor" — se usa para elegir la más alta histórica cuando
# hay varios años.
_RANK: dict[str, int] = {"A1": 4, "A2": 3, "B": 2, "C": 1}

# Detección de plataforma Open Journal Systems: si la URL tiene el segmento
# /index.php/{slug} asumimos OJS y podemos inferir la ruta del comité
# editorial. Heurística simple pero de muy alta precisión para revistas
# académicas colombianas (verificado contra DOAJ: 93,6% de revistas CO
# siguen este patrón).
_OJS_SEGMENT = "/index.php/"


def _normalize_issn(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip().replace("-", "").upper()
    if len(cleaned) != 8:
        return None
    if not cleaned[:7].isdigit() or not (cleaned[7].isdigit() or cleaned[7] == "X"):
        return None
    return cleaned


def _derive_editorial_team_url(homepage_url: str | None) -> str | None:
    """Devuelve la URL canónica del comité editorial en OJS, o None si no se
    puede inferir con confianza.

    El patrón es {base}/index.php/{journal}/about/editorialTeam. Si la URL
    ya apunta a una sección interna de la revista, normalizamos hasta el
    slug base antes de añadir /about/editorialTeam.
    """
    if not homepage_url:
        return None
    try:
        parsed = urlparse(homepage_url)
    except Exception:
        return None
    if not parsed.netloc:
        return None
    # Detectar /index.php/{slug}/... o /index.php/{slug}
    path = parsed.path.rstrip("/")
    idx = path.find(_OJS_SEGMENT)
    if idx < 0:
        return None
    after = path[idx + len(_OJS_SEGMENT):]
    slug = after.split("/", 1)[0] if after else ""
    if not slug:
        return None
    base = f"{parsed.scheme}://{parsed.netloc}{path[:idx]}"
    return f"{base}/index.php/{slug}/about/editorialTeam"


@dataclass(frozen=True)
class PublindexYearEntry:
    year: int
    category: PublindexCategory


@dataclass(frozen=True)
class PublindexRecord:
    issn: str
    name: str | None
    area: str | None
    big_area: str | None
    country: str | None
    best_category: PublindexCategory
    latest_year: int
    latest_category: PublindexCategory
    history: tuple[PublindexYearEntry, ...]
    # Enriquecimiento desde publindex_current.json (sólo revistas vigentes)
    homepage_url: str | None = None
    email: str | None = None
    editorial_team_url: str | None = None
    is_ojs: bool = False


class PublindexProvider:
    """Lookup O(1) por ISSN con clasificación histórica + datos de contacto."""

    def __init__(
        self,
        data_path: str,
        current_data_path: str | None = None,
    ) -> None:
        self.data_path = Path(data_path)
        # Por convención, el fichero de vigentes vive al lado con nombre
        # `publindex_current.json`. Se permite override explícito para tests.
        if current_data_path is None:
            self.current_data_path = self.data_path.with_name("publindex_current.json")
        else:
            self.current_data_path = Path(current_data_path)
        self._by_issn: dict[str, PublindexRecord] | None = None

    def _load_current(self) -> dict[str, dict[str, str | None]]:
        """Indexa publindex_current.json por ISSN normalizado."""
        if not self.current_data_path.exists():
            return {}
        with self.current_data_path.open("r", encoding="utf-8") as fh:
            rows = json.load(fh)
        out: dict[str, dict[str, str | None]] = {}
        for row in rows:
            homepage = row.get("homepage_url")
            email = row.get("email")
            editorial_url = _derive_editorial_team_url(homepage)
            is_ojs = editorial_url is not None
            enrichment = {
                "homepage_url": homepage,
                "email": email,
                "editorial_team_url": editorial_url,
                "is_ojs": is_ojs,
            }
            for raw_issn in row.get("issns", []) or []:
                norm = _normalize_issn(raw_issn)
                if norm and norm not in out:
                    out[norm] = enrichment
        return out

    def _ensure_loaded(self) -> None:
        if self._by_issn is not None:
            return

        if not self.data_path.exists():
            logger.warning("Publindex data file not found: %s", self.data_path)
            self._by_issn = {}
            return

        with self.data_path.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)

        current_by_issn = self._load_current()

        # Agrupar por ISSN: combina issn_p e issn_l como claves alternativas
        # hacia el mismo record (algunas revistas aparecen sólo con e-ISSN).
        by_issn_history: dict[str, dict[int, str]] = defaultdict(dict)
        meta: dict[str, dict[str, str | None]] = {}

        for row in raw:
            cat = row.get("category")
            if cat not in _VALID_CATEGORIES:
                continue
            year = row.get("year")
            if not isinstance(year, int):
                continue
            issns: list[str] = []
            for key in ("issn_p", "issn_l"):
                normalized = _normalize_issn(row.get(key))
                if normalized and normalized not in issns:
                    issns.append(normalized)
            if not issns:
                continue
            for issn in issns:
                # Si hay varios registros mismo issn+year, gana la mejor cat.
                prev = by_issn_history[issn].get(year)
                if prev is None or _RANK[cat] > _RANK[prev]:
                    by_issn_history[issn][year] = cat
                if issn not in meta:
                    meta[issn] = {
                        "name": row.get("name"),
                        "area": row.get("area"),
                        "big_area": row.get("big_area"),
                        "country": row.get("country"),
                    }

        records: dict[str, PublindexRecord] = {}
        for issn, years in by_issn_history.items():
            history = tuple(
                PublindexYearEntry(year=y, category=c)  # type: ignore[arg-type]
                for y, c in sorted(years.items())
            )
            latest_year = max(years.keys())
            latest_category = years[latest_year]
            best_category = max(years.values(), key=lambda c: _RANK[c])
            m = meta[issn]
            enrich = current_by_issn.get(issn, {})
            records[issn] = PublindexRecord(
                issn=issn,
                name=m["name"],
                area=m["area"],
                big_area=m["big_area"],
                country=m["country"],
                best_category=best_category,  # type: ignore[arg-type]
                latest_year=latest_year,
                latest_category=latest_category,  # type: ignore[arg-type]
                history=history,
                homepage_url=enrich.get("homepage_url"),
                email=enrich.get("email"),
                editorial_team_url=enrich.get("editorial_team_url"),
                is_ojs=bool(enrich.get("is_ojs")),
            )

        self._by_issn = records
        with_url = sum(1 for r in records.values() if r.homepage_url)
        logger.info(
            "Loaded Publindex: %d unique ISSNs (%d with homepage_url)",
            len(records),
            with_url,
        )

    def lookup(self, issn: str) -> PublindexRecord | None:
        self._ensure_loaded()
        assert self._by_issn is not None
        normalized = _normalize_issn(issn)
        if normalized is None:
            return None
        return self._by_issn.get(normalized)

    def lookup_many(self, issns: list[str]) -> dict[str, PublindexRecord]:
        self._ensure_loaded()
        assert self._by_issn is not None
        out: dict[str, PublindexRecord] = {}
        for issn in issns:
            normalized = _normalize_issn(issn)
            if normalized is None or normalized in out:
                continue
            rec = self._by_issn.get(normalized)
            if rec is not None:
                out[normalized] = rec
        return out

    def health(self) -> bool:
        return self.data_path.exists()
