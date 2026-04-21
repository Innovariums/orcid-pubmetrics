"""
Provider de comités editoriales desde el dataset Open Editors Plus.

Dataset: https://zenodo.org/records/19590816 (parquet, ~57 MB, 922k filas,
15k+ revistas, abril 2026). Columnas relevantes:
- journal, editor, role, role_std, affiliation, orcid, issn_l, source_url

El parquet se carga lazy en la primera llamada; después los lookups son
O(1) por dict.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from app.ports.editorial_boards import EditorialBoardProvider, EditorialMember

logger = logging.getLogger(__name__)


def _normalize_issn(raw: Any) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip().replace("-", "").upper()
    if len(s) != 8:
        return None
    if not s[:7].isdigit() or not (s[7].isdigit() or s[7] == "X"):
        return None
    return s


def _normalize_orcid(raw: Any) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip()
    if not s or s.lower() == "missing":
        return None
    # Algunos vienen como URL https://orcid.org/0000-xxx
    tail = s.rsplit("/", 1)[-1]
    import re
    if re.match(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$", tail):
        return tail
    return None


def _normalize_name(raw: Any) -> str:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return ""
    return " ".join(str(raw).strip().split()).lower()


class OpenEditorsProvider:
    """Comités editoriales desde Open Editors Plus parquet local."""

    name: str = "open_editors"

    def __init__(self, data_path: str) -> None:
        self.data_path = Path(data_path)
        self._by_issn: dict[str, list[EditorialMember]] | None = None
        self._by_orcid: dict[str, list[EditorialMember]] | None = None
        self._by_name: dict[str, list[EditorialMember]] | None = None

    def _ensure_loaded(self) -> None:
        if self._by_issn is not None:
            return

        if not self.data_path.is_file():
            logger.warning("Open Editors dataset not found at %s", self.data_path)
            self._by_issn = {}
            self._by_orcid = {}
            self._by_name = {}
            return

        cols = ["journal", "editor", "role", "role_std", "orcid", "issn_l", "source_url"]
        df = pd.read_parquet(self.data_path, columns=cols)

        by_issn: dict[str, list[EditorialMember]] = {}
        by_orcid: dict[str, list[EditorialMember]] = {}
        by_name: dict[str, list[EditorialMember]] = {}

        # Vectorizar normalización lo posible
        issns = df["issn_l"].map(_normalize_issn)
        orcids = df["orcid"].map(_normalize_orcid)
        names_norm = df["editor"].map(_normalize_name)
        roles = df["role"].fillna("editor")
        journals = df["journal"].fillna("Unknown")
        sources = df["source_url"].fillna("")

        editors_list = df["editor"].fillna("Unknown")

        for issn, orcid, nname, role, journal, src, editor_name in zip(
            issns, orcids, names_norm, roles, journals, sources, editors_list
        ):
            if issn is None:
                continue
            m = EditorialMember(
                issn=issn,
                journal_title=journal,
                researcher_name=editor_name,
                researcher_orcid=orcid,
                role=role,
                source="open_editors",
                source_url=src or None,
            )
            by_issn.setdefault(issn, []).append(m)
            if orcid:
                by_orcid.setdefault(orcid, []).append(m)
            if nname:
                by_name.setdefault(nname, []).append(m)

        self._by_issn = by_issn
        self._by_orcid = by_orcid
        self._by_name = by_name
        logger.info(
            "Loaded Open Editors: %d ISSNs, %d ORCIDs, %d names",
            len(by_issn),
            len(by_orcid),
            len(by_name),
        )

    def get_members_by_issn(self, issn: str) -> list[EditorialMember]:
        self._ensure_loaded()
        assert self._by_issn is not None
        key = _normalize_issn(issn)
        if not key:
            return []
        return self._by_issn.get(key, [])

    def find_journals_by_researcher(
        self, orcid: str | None = None, name: str | None = None
    ) -> list[EditorialMember]:
        self._ensure_loaded()
        assert self._by_orcid is not None
        assert self._by_name is not None
        if orcid:
            normalized = _normalize_orcid(orcid)
            if normalized and normalized in self._by_orcid:
                return self._by_orcid[normalized]
        if name:
            nname = _normalize_name(name)
            if nname and nname in self._by_name:
                return self._by_name[nname]
        return []

    def health(self) -> bool:
        return self.data_path.is_file()


_: EditorialBoardProvider = OpenEditorsProvider(data_path="/tmp")
