import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { EnrichedWork, PublindexEntry } from "../types";

function normalizeIssn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/-/g, "").toUpperCase();
  if (cleaned.length !== 8) return null;
  if (!/^\d{7}[\dX]$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Lookup bulk contra Publindex para todas las publicaciones sin cuartil SJR.
 * Se dispara automáticamente cuando cambia la lista de works.
 *
 * Devuelve un map indexado por ISSN normalizado (sin guión). El consumidor
 * usa `lookupByIssn(work.work.issn)` para encontrar la entrada.
 *
 * Es una feature *secundaria*: si la llamada falla, los works siguen
 * marcados como "no indexada" sin ruido en la UI.
 */
export function usePublindex(works: EnrichedWork[]) {
  const [entries, setEntries] = useState<Record<string, PublindexEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Claves ISSN candidatas: works *sin cuartil SJR* que sí exponen ISSN.
  const unindexedIssns = Array.from(
    new Set(
      works
        .filter((w) => !w.metric)
        .flatMap((w) => [w.work.issn, w.work.eissn])
        .map(normalizeIssn)
        .filter((s): s is string => s !== null),
    ),
  );
  const key = unindexedIssns.sort().join(",");

  useEffect(() => {
    if (unindexedIssns.length === 0) {
      setEntries({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .publindexLookup(unindexedIssns)
      .then((resp) => {
        if (!cancelled) setEntries(resp.entries);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function lookup(issn: string | null | undefined): PublindexEntry | null {
    const norm = normalizeIssn(issn);
    if (!norm) return null;
    return entries[norm] ?? null;
  }

  function lookupWork(work: EnrichedWork): PublindexEntry | null {
    return lookup(work.work.issn) ?? lookup(work.work.eissn);
  }

  return {
    entries,
    loading,
    error,
    lookup,
    lookupWork,
    foundCount: Object.keys(entries).length,
    unindexedCount: unindexedIssns.length,
  };
}
