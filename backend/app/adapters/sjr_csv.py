"""
Provider de cuartil SJR leído de CSVs anuales descargados de scimagojr.com.

Formato CSV (delimitado por `;`, decimal con `,`):
    Rank;Sourceid;Title;Type;Issn;Publisher;Open Access;Open Access Diamond;
    SJR;SJR Best Quartile;H index;...;Categories;Areas

- `Issn` puede contener varios ISSN separados por coma: "15424863, 00079235"
- `Categories` viene como "Hematology (Q1); Oncology (Q1)"
- `SJR` es decimal europeo: "106,094" => 106.094

Los archivos se nombran `scimagojr_YYYY.csv` y se buscan en `data_dir`.
La carga es lazy: el índice se construye en la primera llamada a get_metrics().
"""
from __future__ import annotations

import logging
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

from app.ports.journal_metrics import (
    JournalMetric,
    JournalMetricsProvider,
    MetricsSource,
    Quartile,
    YearRule,
)

logger = logging.getLogger(__name__)

_CATEGORY_RE = re.compile(r"^(?P<name>.+?)\s*\(Q(?P<n>[1-4])\)\s*$")
_FILENAME_RE = re.compile(r"scimagojr_(\d{4})\.csv$")


def _normalize_issn(raw: Any) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    cleaned = str(raw).strip().replace("-", "").upper()
    if len(cleaned) != 8:
        return None
    if not cleaned[:7].isdigit() or not (cleaned[7].isdigit() or cleaned[7] == "X"):
        return None
    return cleaned


def _parse_categories(raw: str) -> list[tuple[str, Quartile]]:
    out: list[tuple[str, Quartile]] = []
    if not raw:
        return out
    for part in raw.split(";"):
        m = _CATEGORY_RE.match(part.strip())
        if not m:
            continue
        q: Quartile = f"Q{m.group('n')}"  # type: ignore[assignment]
        out.append((m.group("name").strip(), q))
    return out


def _split_issns(raw: Any) -> list[str]:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return []
    issns: list[str] = []
    for token in str(raw).split(","):
        normalized = _normalize_issn(token)
        if normalized:
            issns.append(normalized)
    return issns


class ScimagoSjrProvider:
    """Cuartil SJR desde CSVs anuales locales."""

    name: MetricsSource = "sjr"

    def __init__(self, data_dir: str) -> None:
        self.data_dir = Path(data_dir)
        self._rows_by_key: dict[tuple[str, int], list[dict[str, Any]]] | None = None
        self._years_by_issn: dict[str, list[int]] | None = None

    def _ensure_loaded(self) -> None:
        if self._rows_by_key is not None:
            return

        if not self.data_dir.is_dir():
            logger.warning("SJR data_dir does not exist: %s", self.data_dir)
            self._rows_by_key = {}
            self._years_by_issn = {}
            return

        csv_files = sorted(self.data_dir.glob("scimagojr_*.csv"))
        frames: list[pd.DataFrame] = []
        for csv_file in csv_files:
            m = _FILENAME_RE.search(csv_file.name)
            if not m:
                continue
            year = int(m.group(1))
            df = pd.read_csv(
                csv_file,
                sep=";",
                decimal=",",
                dtype={"Issn": "string", "SJR": "string"},
                encoding="utf-8",
                on_bad_lines="skip",
                usecols=["Type", "Issn", "SJR", "SJR Best Quartile", "Categories", "Title"],
            )
            # Incluimos journals, book series y conference proceedings — todos
            # tienen cuartil Scimago y son relevantes para CVs académicos.
            valid_types = {"journal", "book series", "conference and proceedings"}
            df = df[df["Type"].fillna("").str.lower().isin(valid_types)].copy()
            df["year"] = year
            frames.append(df)

        if not frames:
            self._rows_by_key = {}
            self._years_by_issn = {}
            return

        all_df = pd.concat(frames, ignore_index=True)
        all_df["Issn"] = all_df["Issn"].fillna("").str.split(",")
        all_df = all_df.explode("Issn", ignore_index=True)
        all_df["issn"] = (
            all_df["Issn"].fillna("").str.strip().str.replace("-", "", regex=False).str.upper()
        )
        all_df = all_df[all_df["issn"].str.match(r"^\d{7}[\dX]$", na=False)]
        all_df["sjr"] = all_df["SJR"].map(_parse_sjr)
        all_df["categories"] = all_df["Categories"].fillna("").astype(str)

        rows_by_key: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
        years_by_issn: dict[str, set[int]] = defaultdict(set)

        records = all_df[["issn", "year", "sjr", "categories"]].to_dict("records")
        for rec in records:
            key = (rec["issn"], rec["year"])
            rows_by_key[key].append({"sjr": rec["sjr"], "categories": rec["categories"]})
            years_by_issn[rec["issn"]].add(rec["year"])

        self._rows_by_key = dict(rows_by_key)
        self._years_by_issn = {k: sorted(v) for k, v in years_by_issn.items()}
        logger.info(
            "Loaded SJR data: %d year-files, %d (issn,year) keys",
            len(csv_files),
            len(self._rows_by_key),
        )

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        self._ensure_loaded()
        assert self._rows_by_key is not None
        assert self._years_by_issn is not None

        normalized = _normalize_issn(issn)
        if normalized is None:
            return []

        year_used, rule = self._resolve_year(normalized, year)
        if year_used is None:
            return []

        rows = self._rows_by_key.get((normalized, year_used), [])
        metrics: list[JournalMetric] = []
        for row in rows:
            score = row["sjr"]
            if score is None:
                continue
            for category_name, quartile in _parse_categories(row["categories"]):
                metrics.append(
                    JournalMetric(
                        issn=normalized,
                        year=year_used,
                        source=self.name,
                        score=score,
                        score_label="SJR",
                        quartile=quartile,
                        category=category_name,
                        year_rule=rule,
                    )
                )
        return metrics

    def _resolve_year(self, issn: str, year: int) -> tuple[int | None, YearRule]:
        assert self._rows_by_key is not None
        assert self._years_by_issn is not None

        if (issn, year) in self._rows_by_key:
            return year, "exact"
        if (issn, year - 1) in self._rows_by_key:
            return year - 1, "fallback-1"
        if (issn, year + 1) in self._rows_by_key:
            return year + 1, "fallback+1"
        years = self._years_by_issn.get(issn, [])
        if not years:
            return None, "exact"
        closest = min(years, key=lambda y: (abs(y - year), -y))
        return closest, "fallback-any"

    def health(self) -> bool:
        return self.data_dir.is_dir()


def _parse_sjr(raw: Any) -> float | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    text = str(raw).strip().replace(",", ".")
    if not text or text == "-":
        return None
    try:
        return float(text)
    except ValueError:
        return None


_: JournalMetricsProvider = ScimagoSjrProvider(data_dir="/tmp")
