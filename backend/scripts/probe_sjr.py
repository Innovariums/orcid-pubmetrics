"""
Probe manual: cruzar las publicaciones del profesor Oswaldo Langs con el
cuartil SJR de la revista donde salieron.

Uso: python scripts/probe_sjr.py
"""
from __future__ import annotations

import sys
from collections import Counter

if sys.stdout.encoding.lower() not in {"utf-8", "utf8"}:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]

from app.adapters.openalex import OpenAlexPublicationProvider
from app.adapters.sjr_csv import ScimagoSjrProvider
from app.infra.settings import settings

PROFESSOR_ORCID = "0000-0002-0170-462X"


def main() -> None:
    openalex = OpenAlexPublicationProvider(mailto=settings.openalex_mailto)
    sjr = ScimagoSjrProvider(data_dir=settings.sjr_data_dir)

    works = openalex.get_works_by_orcid(PROFESSOR_ORCID, 2010, 2026)
    print(f"Works: {len(works)}  con ISSN: {sum(1 for w in works if w.issn)}\n")

    quartile_counter: Counter[str] = Counter()
    for w in works:
        header = f"({w.pub_year}) {w.journal_title or '?'}"
        if not w.issn:
            print(f"  [NO-ISSN]  {header}")
            quartile_counter["sin-issn"] += 1
            continue
        metrics = sjr.get_metrics(w.issn, w.pub_year)
        if not metrics:
            print(f"  [not-in-SJR]  {header}  issn={w.issn}")
            quartile_counter["not-in-sjr"] += 1
            continue
        # Mostrar mejor cuartil entre todas las categorías de la revista
        best = min(metrics, key=lambda m: m.quartile)
        rule_note = "" if best.year_rule == "exact" else f" [{best.year_rule}]"
        print(
            f"  [{best.quartile}]  {header}  issn={w.issn}  "
            f"cat=\"{best.category}\"{rule_note}"
        )
        quartile_counter[best.quartile] += 1

    print("\nResumen:")
    for k in ("Q1", "Q2", "Q3", "Q4", "not-in-sjr", "sin-issn"):
        if k in quartile_counter:
            print(f"  {k}: {quartile_counter[k]}")


if __name__ == "__main__":
    main()
