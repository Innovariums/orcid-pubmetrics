import { useMemo, useState } from "react";
import type { AnalysisResult, EnrichedWork, Quartile } from "../../types";
import { QUARTILE_LABELS } from "../../types";

type FilterKey = "all" | Quartile | "unindexed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "Q1", label: QUARTILE_LABELS.Q1 },
  { key: "Q2", label: QUARTILE_LABELS.Q2 },
  { key: "Q3", label: QUARTILE_LABELS.Q3 },
  { key: "Q4", label: QUARTILE_LABELS.Q4 },
  { key: "unindexed", label: QUARTILE_LABELS.unindexed },
];

export function PublicationsTable({ result }: { result: AnalysisResult }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const rows = useMemo(() => {
    const sorted = [...result.works].sort(
      (a, b) => b.work.pub_year - a.work.pub_year || a.work.title.localeCompare(b.work.title),
    );
    if (filter === "all") return sorted;
    if (filter === "unindexed") return sorted.filter((w) => w.metric === null);
    return sorted.filter((w) => w.metric?.quartile === filter);
  }, [result.works, filter]);

  return (
    <div>
      <div className="table-controls">
        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Filtrar:</span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`btn btn-secondary${filter === f.key ? " btn-secondary-active" : ""}`}
            style={
              filter === f.key
                ? { background: "#e0e7ff", borderColor: "#c7d2fe", fontWeight: 600 }
                : undefined
            }
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--muted)" }}>
          Mostrando {rows.length} de {result.works.length}
        </span>
      </div>
      <div className="table-wrap">
        <table className="publications">
          <thead>
            <tr>
              <th>Año</th>
              <th>Cuartil</th>
              <th>Título</th>
              <th>Revista</th>
              <th>Categoría</th>
              <th>Score</th>
              <th>DOI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w, i) => (
              <PublicationRow key={w.work.openalex_id ?? i} ew={w} source={result.metrics_source} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PublicationRow({ ew, source }: { ew: EnrichedWork; source: string }) {
  const m = ew.metric;
  const chipKey = m?.quartile ?? "unindexed";
  const chipLabel = m?.quartile ?? reasonLabel(ew.not_found_reason);

  return (
    <tr>
      <td>{ew.work.pub_year}</td>
      <td>
        <span className={`quartile-chip chip-${chipKey}`}>{chipLabel}</span>
        {m && m.year_rule !== "exact" && (
          <span
            className="tag"
            title={`Métrica tomada de ${m.year}`}
            style={{ marginLeft: "0.4rem" }}
          >
            {m.year_rule}
          </span>
        )}
      </td>
      <td>{ew.work.title}</td>
      <td>{ew.work.journal_title ?? <em>—</em>}</td>
      <td>{m?.category ?? <em>—</em>}</td>
      <td>{m ? `${m.score.toFixed(3)} ${source.toUpperCase()}` : <em>—</em>}</td>
      <td>
        {ew.work.doi ? (
          <a href={`https://doi.org/${ew.work.doi}`} target="_blank" rel="noreferrer">
            {ew.work.doi}
          </a>
        ) : (
          <em>—</em>
        )}
      </td>
    </tr>
  );
}

function reasonLabel(r: EnrichedWork["not_found_reason"]): string {
  switch (r) {
    case "no_issn":
      return "sin ISSN";
    case "not_in_source":
      return "no indexada";
    case "incomplete_metadata":
      return "metadata incompleta";
    default:
      return "sin indexar";
  }
}
