"""
Comparación de N investigadores: solapamiento de revistas, coautorías
directas y cruces con comités editoriales (Fase 2).

Depende solo de los ports; la lógica es agnóstica de fuente.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from app.domain.analytics import _enrich, _quartile_totals
from app.domain.models import (
    ComparisonResult,
    Coauthorship,
    EditorialCrossRef,
    EnrichedWork,
    JournalOverlap,
    ResearcherSummary,
)
from app.ports.editorial_boards import EditorialBoardProvider
from app.ports.journal_metrics import JournalMetricsProvider, Quartile
from app.ports.publications import PublicationProvider, Work

QUARTILE_RANK: dict[Quartile, int] = {"Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4}


def compare_researchers(
    orcids: list[str],
    start_year: int,
    end_year: int,
    publications: PublicationProvider,
    metrics: JournalMetricsProvider,
    editorial_boards: EditorialBoardProvider | None = None,
) -> ComparisonResult:
    if len(orcids) < 2:
        raise ValueError("La comparación requiere al menos 2 ORCIDs.")
    if len(set(orcids)) != len(orcids):
        raise ValueError("ORCIDs duplicados en la comparación.")

    works_by_orcid: dict[str, list[Work]] = {}
    enriched_by_orcid: dict[str, list[EnrichedWork]] = {}
    for orcid in orcids:
        ws = publications.get_works_by_orcid(orcid, start_year, end_year)
        works_by_orcid[orcid] = ws
        enriched_by_orcid[orcid] = [_enrich(w, metrics) for w in ws]

    researchers = [
        ResearcherSummary(
            orcid=orcid,
            researcher_name=_extract_name(orcid, works_by_orcid[orcid]),
            total_works=len(enriched_by_orcid[orcid]),
            indexed_works=sum(1 for e in enriched_by_orcid[orcid] if e.indexed),
            quartile_totals=_quartile_totals(enriched_by_orcid[orcid]),
        )
        for orcid in orcids
    ]

    editors_by_issn = _resolve_editors(editorial_boards, enriched_by_orcid, orcids) if editorial_boards else {}

    journal_overlap = _compute_journal_overlap(enriched_by_orcid, editors_by_issn)
    coauthorships = _compute_coauthorships(enriched_by_orcid, orcids)
    editorial_cross = _compute_editorial_cross(enriched_by_orcid, editors_by_issn, orcids)

    return ComparisonResult(
        orcids=orcids,
        start_year=start_year,
        end_year=end_year,
        metrics_source=metrics.name,
        editorial_source=editorial_boards.name if editorial_boards else None,
        researchers=researchers,
        journal_overlap=journal_overlap,
        coauthorships=coauthorships,
        editorial_cross=editorial_cross,
    )


def _extract_name(orcid: str, works: list[Work]) -> str | None:
    for w in works:
        for a in w.authors:
            if a.orcid == orcid and a.name and a.name != "unknown":
                return a.name
    return None


def _compute_journal_overlap(
    enriched_by_orcid: dict[str, list[EnrichedWork]],
    editors_by_issn: dict[str, set[str]],
) -> list[JournalOverlap]:
    # Clave: (issn preferido o journal_title lowercased). Así evitamos duplicar
    # cuando un mismo journal aparece sin ISSN en algunos works.
    buckets: dict[tuple[str | None, str], dict[str, int]] = defaultdict(lambda: defaultdict(int))
    titles: dict[tuple[str | None, str], str] = {}
    quartiles: dict[tuple[str | None, str], Quartile | None] = {}

    for orcid, enriched in enriched_by_orcid.items():
        for ew in enriched:
            w = ew.work
            issn = w.issn
            title = w.journal_title or "Sin título de revista"
            key = (issn, title.strip().lower())
            buckets[key][orcid] += 1
            titles.setdefault(key, title)

            q = ew.metric.quartile if ew.metric else None
            prev = quartiles.get(key)
            if q is not None and (prev is None or QUARTILE_RANK[q] < QUARTILE_RANK[prev]):
                quartiles[key] = q
            elif prev is None:
                quartiles[key] = None

    overlaps: list[JournalOverlap] = []
    for key, pubs_by_orcid in buckets.items():
        if len(pubs_by_orcid) < 2:
            continue
        issn = key[0]
        editors_here = editors_by_issn.get(issn, set()) if issn else set()
        # ¿Hay al menos un editor del grupo que NO publica en esta revista,
        # o que publica poco en relación a otro del grupo? Por ahora marcamos
        # conflicto si hay editor del grupo y algún otro del grupo publica.
        has_conflict = False
        if editors_here:
            publishers = set(pubs_by_orcid.keys())
            has_conflict = bool(publishers - editors_here) or (len(editors_here) < len(publishers))
        overlaps.append(
            JournalOverlap(
                issn=issn,
                journal_title=titles[key],
                best_quartile=quartiles.get(key),
                pubs_by_orcid=dict(pubs_by_orcid),
                has_editorial_conflict=has_conflict,
                editors_orcids=sorted(editors_here),
            )
        )
    # Orden: primero las de conflicto editorial, luego por número de investigadores que publican, luego total
    overlaps.sort(
        key=lambda o: (
            -int(o.has_editorial_conflict),
            -len(o.pubs_by_orcid),
            -sum(o.pubs_by_orcid.values()),
        )
    )
    return overlaps


def _compute_coauthorships(
    enriched_by_orcid: dict[str, list[EnrichedWork]],
    orcids: list[str],
) -> list[Coauthorship]:
    """
    Busca works donde ≥2 ORCIDs del grupo aparecen en la lista de authorships.
    Usa el openalex_id (o doi como fallback) para deduplicar — un mismo work
    puede venir una vez por cada investigador del grupo.
    """
    seen: dict[str, tuple[set[str], EnrichedWork]] = {}
    orcid_set = set(orcids)
    for owner, enriched in enriched_by_orcid.items():
        for ew in enriched:
            authors = {a.orcid for a in ew.work.authors if a.orcid}
            shared = (authors | {owner}) & orcid_set
            if len(shared) < 2:
                continue
            key = ew.work.openalex_id or ew.work.doi or f"{ew.work.title}|{ew.work.pub_year}"
            if key in seen:
                seen[key][0].update(shared)
            else:
                seen[key] = (set(shared), ew)

    out: list[Coauthorship] = []
    for shared, ew in seen.values():
        out.append(Coauthorship(orcids=sorted(shared), work=ew))
    out.sort(key=lambda c: (-c.work.work.pub_year, c.work.work.title))
    return out


def _resolve_editors(
    provider: EditorialBoardProvider,
    enriched_by_orcid: dict[str, list[EnrichedWork]],
    orcids: list[str],
) -> dict[str, set[str]]:
    """
    Para cada revista en el conjunto, cruza con los miembros del comité y
    devuelve los ORCIDs del grupo que pertenecen al comité.
    """
    issns: set[str] = set()
    for ews in enriched_by_orcid.values():
        for ew in ews:
            if ew.work.issn:
                issns.add(ew.work.issn)

    editors_by_issn: dict[str, set[str]] = defaultdict(set)
    for issn in issns:
        members = provider.get_members_by_issn(issn)
        for m in members:
            if m.researcher_orcid in orcids:
                editors_by_issn[issn].add(m.researcher_orcid)
    return dict(editors_by_issn)


def _compute_editorial_cross(
    enriched_by_orcid: dict[str, list[EnrichedWork]],
    editors_by_issn: dict[str, set[str]],
    orcids: list[str],
) -> list[EditorialCrossRef]:
    """
    Para cada (publisher, editor, revista) donde publisher publica en revista
    y editor (≠ publisher) está en su comité, emite un EditorialCrossRef.
    """
    crosses: dict[tuple[str, str, str | None, str], int] = defaultdict(int)
    titles: dict[tuple[str, str, str | None, str], str] = {}
    for publisher, ews in enriched_by_orcid.items():
        for ew in ews:
            issn = ew.work.issn
            if not issn:
                continue
            editors = editors_by_issn.get(issn, set())
            for editor in editors:
                if editor == publisher:
                    continue
                title = ew.work.journal_title or "Sin título de revista"
                # role: por ahora genérico, afinable consultando provider con
                # get_members_by_issn y matching ORCID
                role = "editor"
                key = (publisher, editor, issn, role)
                crosses[key] += 1
                titles[key] = title
    out = [
        EditorialCrossRef(
            publisher_orcid=publisher,
            editor_orcid=editor,
            issn=issn,
            journal_title=titles[(publisher, editor, issn, role)],
            editor_role=role,
            pub_count=count,
        )
        for (publisher, editor, issn, role), count in crosses.items()
    ]
    out.sort(key=lambda c: (-c.pub_count, c.journal_title))
    return out


__all__ = ["compare_researchers"]
