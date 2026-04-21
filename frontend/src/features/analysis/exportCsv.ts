import type { AnalysisResult } from "../../types";

function escape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(result: AnalysisResult): string {
  const header = [
    "year",
    "quartile",
    "title",
    "journal",
    "issn",
    "category",
    "score",
    "score_label",
    "source",
    "year_rule",
    "doi",
    "openalex_id",
    "not_found_reason",
  ];
  const lines = [header.join(",")];
  for (const ew of result.works) {
    const m = ew.metric;
    lines.push(
      [
        ew.work.pub_year,
        m?.quartile ?? "",
        ew.work.title,
        ew.work.journal_title ?? "",
        ew.work.issn ?? "",
        m?.category ?? "",
        m?.score ?? "",
        m?.score_label ?? "",
        result.metrics_source,
        m?.year_rule ?? "",
        ew.work.doi ?? "",
        ew.work.openalex_id ?? "",
        ew.not_found_reason ?? "",
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(result: AnalysisResult): void {
  const csv = buildCsv(result);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orcid-${result.orcid}-${result.start_year}-${result.end_year}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
