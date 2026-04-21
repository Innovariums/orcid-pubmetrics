"""
Publindex (Índice Nacional de Publicaciones, MinCiencias Colombia).

Dataset publicado en datos.gov.co, congelado en `data/publindex/publindex.json`
con cobertura 2004-2022 y ~665 revistas clasificadas A1/A2/B/C.

Uso en la app: feature *secundaria* de exploración. No reemplaza al provider
principal (SJR) ni altera las etiquetas "no indexada" que muestra la UI. Sólo
responde a la pregunta "¿cuáles de las no indexadas aparecen en Publindex?".
"""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

PublindexCategory = Literal["A1", "A2", "B", "C"]
_VALID_CATEGORIES: set[str] = {"A1", "A2", "B", "C"}
# Orden de "mejor" a "peor" — se usa para elegir la más alta histórica cuando
# hay varios años.
_RANK: dict[str, int] = {"A1": 4, "A2": 3, "B": 2, "C": 1}


def _normalize_issn(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip().replace("-", "").upper()
    if len(cleaned) != 8:
        return None
    if not cleaned[:7].isdigit() or not (cleaned[7].isdigit() or cleaned[7] == "X"):
        return None
    return cleaned


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


class PublindexProvider:
    """Lookup O(1) por ISSN con el histórico de clasificación Publindex."""

    def __init__(self, data_path: str) -> None:
        self.data_path = Path(data_path)
        self._by_issn: dict[str, PublindexRecord] | None = None

    def _ensure_loaded(self) -> None:
        if self._by_issn is not None:
            return

        if not self.data_path.exists():
            logger.warning("Publindex data file not found: %s", self.data_path)
            self._by_issn = {}
            return

        with self.data_path.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)

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
            )

        self._by_issn = records
        logger.info("Loaded Publindex: %d unique ISSNs", len(records))

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
