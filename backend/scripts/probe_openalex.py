"""
Probe manual: llama OpenAlex real con el ORCID del profesor Oswaldo Langs
y muestra un resumen. No es un test automatizado (hace I/O de red).

Uso:
    python scripts/probe_openalex.py
"""
from __future__ import annotations

import sys
from collections import Counter

if sys.stdout.encoding.lower() not in {"utf-8", "utf8"}:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]

from app.adapters.openalex import OpenAlexPublicationProvider
from app.infra.settings import settings

PROFESSOR_ORCID = "0000-0002-0170-462X"


def main() -> None:
    provider = OpenAlexPublicationProvider(mailto=settings.openalex_mailto)
    works = provider.get_works_by_orcid(PROFESSOR_ORCID, 2010, 2026)

    print(f"ORCID: {PROFESSOR_ORCID}")
    print(f"Total works: {len(works)}")
    print(f"Con ISSN: {sum(1 for w in works if w.issn)}")
    print(f"Con DOI : {sum(1 for w in works if w.doi)}")
    print()

    by_year = Counter(w.pub_year for w in works)
    print("Por año:")
    for y in sorted(by_year):
        print(f"  {y}: {by_year[y]}")

    print()
    by_journal = Counter(w.journal_title for w in works if w.journal_title)
    print("Top revistas:")
    for j, n in by_journal.most_common(10):
        print(f"  {n}x  {j}")

    print()
    no_issn = [w for w in works if not w.issn][:3]
    if no_issn:
        print("Muestra de works sin ISSN:")
        for w in no_issn:
            print(f"  - ({w.pub_year}) {w.title[:80]}")


if __name__ == "__main__":
    main()
