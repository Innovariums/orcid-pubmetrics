import type { ComparisonResult } from "../../types";

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function build(result: ComparisonResult): string {
  const orcids = result.orcids;
  const lines: string[] = [];

  // Sección 1 — investigadores
  lines.push("# Investigadores");
  lines.push(["orcid", "researcher_name", "total_works", "indexed_works", "q1", "q2", "q3", "q4", "unindexed"].join(","));
  for (const r of result.researchers) {
    lines.push(
      [
        r.orcid,
        r.researcher_name ?? "",
        r.total_works,
        r.indexed_works,
        r.quartile_totals.q1,
        r.quartile_totals.q2,
        r.quartile_totals.q3,
        r.quartile_totals.q4,
        r.quartile_totals.unindexed,
      ]
        .map(esc)
        .join(","),
    );
  }
  lines.push("");

  // Sección 2 — solapamiento revistas
  lines.push("# Solapamiento de revistas");
  const overlapHeader = ["issn", "journal_title", "best_quartile", ...orcids.map((o) => `pubs_${o}`), "editorial_conflict", "editors"];
  lines.push(overlapHeader.join(","));
  for (const o of result.journal_overlap) {
    const row = [
      o.issn ?? "",
      o.journal_title,
      o.best_quartile ?? "",
      ...orcids.map((orc) => String(o.pubs_by_orcid[orc] ?? 0)),
      o.has_editorial_conflict ? "yes" : "no",
      o.editors_orcids.join("|"),
    ];
    lines.push(row.map(esc).join(","));
  }
  lines.push("");

  // Sección 3 — cruces editoriales
  lines.push("# Cruces editoriales (publica ↔ comité)");
  lines.push(["publisher_orcid", "editor_orcid", "issn", "journal_title", "editor_role", "pub_count"].join(","));
  for (const c of result.editorial_cross) {
    lines.push(
      [c.publisher_orcid, c.editor_orcid, c.issn ?? "", c.journal_title, c.editor_role, c.pub_count]
        .map(esc)
        .join(","),
    );
  }
  lines.push("");

  // Sección 4 — coautorías
  lines.push("# Coautorías entre investigadores del grupo");
  lines.push(["year", "quartile", "title", "journal_title", "doi", "orcids"].join(","));
  for (const ca of result.coauthorships) {
    const w = ca.work;
    lines.push(
      [
        w.work.pub_year,
        w.metric?.quartile ?? "",
        w.work.title,
        w.work.journal_title ?? "",
        w.work.doi ?? "",
        ca.orcids.join("|"),
      ]
        .map(esc)
        .join(","),
    );
  }

  return lines.join("\n");
}

export function downloadComparisonCsv(result: ComparisonResult): void {
  const csv = build(result);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comparacion-${result.orcids.length}-orcids-${result.start_year}-${result.end_year}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
