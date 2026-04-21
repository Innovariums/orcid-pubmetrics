import { useMemo, useState } from "react";
import { CHART_COLORS, DoughnutChart, HBarChart, LineChart, StackedBarChart } from "../../components/charts";
import { Btn, Card, Chip, Icon, StatCard } from "../../components/primitives";
import type { AnalysisResult, EnrichedWork } from "../../types";
import { downloadCsv } from "./exportCsv";

type FilterKey = "all" | "q1" | "q2" | "q3" | "q4" | "unindexed";

export function ResultsView({
  result,
  onOpenWork,
  onNewQuery,
}: {
  result: AnalysisResult;
  onOpenWork: (w: EnrichedWork) => void;
  onNewQuery: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const works = useMemo(() => {
    const sorted = [...result.works].sort(
      (a, b) => b.work.pub_year - a.work.pub_year || a.work.title.localeCompare(b.work.title),
    );
    if (filter === "all") return sorted;
    if (filter === "unindexed") return sorted.filter((w) => w.metric === null);
    return sorted.filter((w) => w.metric?.quartile.toLowerCase() === filter);
  }, [result.works, filter]);

  const pct = (n: number) => (result.total_works ? Math.round((n / result.total_works) * 100) : 0);
  const indexedPct = result.total_works ? Math.round((result.indexed_works / result.total_works) * 100) : 0;
  const source = result.metrics_source.toUpperCase();

  const headerTitle = result.researcher_name ?? result.orcid;

  return (
    <div className="container-lg">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          fontSize: 13,
          color: "var(--ink-500)",
        }}
      >
        <button className="op-link" style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, color: "var(--ink-500)" }} onClick={onNewQuery}>
          Análisis
        </button>
        <span style={{ color: "var(--ink-300)" }}>/</span>
        <span style={{ color: "var(--ink-900)" }}>Resultados</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="t-h1" style={{ margin: 0, overflowWrap: "anywhere" }}>{headerTitle}</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              fontSize: 13,
              color: "var(--ink-500)",
              flexWrap: "wrap",
            }}
          >
            <span
              className="mono"
              style={{
                color: "var(--ink-700)",
                background: "var(--ink-100)",
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: 12,
              }}
            >
              {result.orcid}
            </span>
            {result.affiliation && (
              <>
                <span>·</span>
                <span>{result.affiliation}</span>
              </>
            )}
            <span>·</span>
            <span>
              Rango {result.start_year}–{result.end_year}
            </span>
            <span>·</span>
            <span>
              Fuente{" "}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--ink-900)",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--q1)" }} />{" "}
                {source} 2024
              </span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <Btn variant="ghost" iconLeft={Icon.download()} onClick={() => downloadCsv(result)}>
            CSV
          </Btn>
          <Btn variant="secondary" onClick={onNewQuery}>
            Nueva consulta
          </Btn>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="TOTAL PUBLICACIONES"
          value={result.total_works}
          hint={`${result.end_year - result.start_year + 1} años analizados`}
        />
        <StatCard
          label={`INDEXADAS EN ${source}`}
          value={result.indexed_works}
          hint={`${indexedPct}% del total`}
        />
        <StatCard label="Q1" tone="q1" value={result.quartile_totals.q1} hint={`${pct(result.quartile_totals.q1)}%`} />
        <StatCard label="Q2" tone="q2" value={result.quartile_totals.q2} hint={`${pct(result.quartile_totals.q2)}%`} />
        <StatCard label="Q3" tone="q3" value={result.quartile_totals.q3} hint={`${pct(result.quartile_totals.q3)}%`} />
        <StatCard label="Q4" tone="q4" value={result.quartile_totals.q4} hint={`${pct(result.quartile_totals.q4)}%`} />
        <StatCard
          label="SIN INDEXAR"
          tone="none"
          value={result.quartile_totals.unindexed}
          hint={`${pct(result.quartile_totals.unindexed)}%`}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "var(--paper)",
          border: "1px solid var(--ink-200)",
          borderLeft: "3px solid var(--q3)",
          borderRadius: "var(--r-sm)",
          marginBottom: 20,
          fontSize: 12.5,
          color: "var(--ink-700)",
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: "var(--q3)", flexShrink: 0 }}>{Icon.info()}</span>
        <span style={{ flex: 1 }}>
          Cuartiles calculados con <strong>{source} 2024 (Scimago/Scopus)</strong>. Pueden diferir en
          una Q respecto a JCR.{" "}
          {result.quartile_totals.unindexed > 0 && (
            <>
              {result.quartile_totals.unindexed}{" "}
              {result.quartile_totals.unindexed === 1 ? "publicación quedó" : "publicaciones quedaron"} sin cuartil
              resoluble — ver tabla abajo.
            </>
          )}
        </span>
      </div>

      <div className="charts-row-1">
        <Card title="Publicaciones por año" subtitle="apiladas por cuartil SJR">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 8,
              fontSize: 12,
              color: "var(--ink-500)",
              flexWrap: "wrap",
            }}
          >
            {(["q1", "q2", "q3", "q4"] as const).map((q) => (
              <span key={q} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[q] }} />{" "}
                {q.toUpperCase()}
              </span>
            ))}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS.unindexed }}
              />{" "}
              Sin indexar
            </span>
          </div>
          <StackedBarChart data={result.by_year_quartile} height={260} />
        </Card>
        <Card
          title="Distribución por cuartil"
          subtitle={`${result.total_works} trabajos · ${result.start_year}–${result.end_year}`}
        >
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <DoughnutChart totals={result.quartile_totals} size={200} />
          </div>
        </Card>
      </div>

      <div className="charts-row-2">
        <Card title="Revistas más frecuentes" subtitle="Top 10 por número de publicaciones">
          <HBarChart rows={result.top_journals.slice(0, 10)} />
        </Card>
        <Card
          title={`Evolución del ${source} promedio`}
          subtitle="Score por año con datos indexados"
        >
          <LineChart data={result.score_evolution} height={220} scoreLabel={source} />
        </Card>
      </div>

      <div className="op-card">
        <div
          style={{
            padding: "16px 18px 12px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="t-h2" style={{ margin: 0 }}>
              Publicaciones
            </h3>
            <div className="t-small">
              Click en una fila para ver detalle completo y categorías adicionales
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  { k: "all" as const, l: "Todas", n: result.works.length },
                  { k: "q1" as const, l: "Q1", n: result.quartile_totals.q1 },
                  { k: "q2" as const, l: "Q2", n: result.quartile_totals.q2 },
                  { k: "q3" as const, l: "Q3", n: result.quartile_totals.q3 },
                  { k: "q4" as const, l: "Q4", n: result.quartile_totals.q4 },
                  { k: "unindexed" as const, l: "Sin indexar", n: result.quartile_totals.unindexed },
                ] satisfies { k: FilterKey; l: string; n: number }[]
              ).map((f) => (
                <button
                  key={f.k}
                  className={`op-pill ${filter === f.k ? "op-pill--active" : ""}`}
                  onClick={() => setFilter(f.k)}
                >
                  {f.l} <span className="op-pill__count">{f.n}</span>
                </button>
              ))}
            </div>
            <span className="t-small mono" style={{ fontSize: 11.5 }}>
              {works.length} / {result.works.length}
            </span>
          </div>
        </div>
        <div className="op-table-wrap">
          <table className="op-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Año</th>
                <th style={{ width: 120 }}>Cuartil</th>
                <th>Título</th>
                <th style={{ width: 220 }}>Revista · Categoría</th>
                <th style={{ width: 90, textAlign: "right" }}>{source}</th>
                <th style={{ width: 170 }}>DOI</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {works.map((w, i) => (
                <PublicationRow
                  key={w.work.openalex_id ?? w.work.doi ?? i}
                  ew={w}
                  source={source}
                  onOpen={() => onOpenWork(w)}
                />
              ))}
              {works.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-400)", padding: 32 }}>
                    Sin publicaciones que coincidan con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PublicationRow({
  ew,
  onOpen,
}: {
  ew: EnrichedWork;
  source: string;
  onOpen: () => void;
}) {
  const m = ew.metric;
  const q = m ? m.quartile : "unindexed";
  const hasMulti = ew.all_metrics.length > 1;
  const workTypeLabel =
    ew.work.work_type === "book-chapter"
      ? "Capítulo de libro"
      : ew.work.work_type === "article"
      ? "Artículo"
      : ew.work.work_type;

  const reasonLabel =
    ew.not_found_reason === "no_issn"
      ? "Sin ISSN en OpenAlex"
      : ew.not_found_reason === "not_in_source"
      ? "No presente en SJR"
      : ew.not_found_reason === "incomplete_metadata"
      ? "Metadata incompleta"
      : "";

  return (
    <tr onClick={onOpen}>
      <td style={{ color: "var(--ink-500)", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
        {ew.work.pub_year}
      </td>
      <td>
        <Chip q={q} />
      </td>
      <td>
        <div className="op-table__title" style={{ fontSize: 13.5 }}>
          {ew.work.title}
        </div>
        <div className="op-table__meta" style={{ marginTop: 2 }}>
          {ew.work.authors.length} autor{ew.work.authors.length !== 1 ? "es" : ""}
          {Icon.dot()}
          {workTypeLabel}
          {m && m.year_rule !== "exact" && (
            <>
              {Icon.dot()}
              <span style={{ color: "var(--q3)" }} title={`Métrica tomada de ${m.year}`}>
                año aprox.
              </span>
            </>
          )}
        </div>
      </td>
      <td style={{ fontSize: 13 }}>
        <div
          style={{
            color: ew.work.journal_title ? "var(--ink-900)" : "var(--ink-400)",
            fontStyle: ew.work.journal_title ? "normal" : "italic",
          }}
        >
          {ew.work.journal_title || "sin título de revista"}
        </div>
        <div className="op-table__meta" style={{ marginTop: 2 }}>
          {m ? m.category : reasonLabel}
          {hasMulti && (
            <span style={{ marginLeft: 6, fontSize: 11, color: "var(--accent)" }}>
              +{ew.all_metrics.length - 1} cat.
            </span>
          )}
        </div>
      </td>
      <td
        style={{
          textAlign: "right",
          fontFamily: "var(--f-mono)",
          fontSize: 12.5,
          color: m ? "var(--ink-900)" : "var(--ink-300)",
        }}
      >
        {m ? m.score.toFixed(3) : "—"}
      </td>
      <td>
        {ew.work.doi ? (
          <a
            className="op-link mono"
            href={`https://doi.org/${ew.work.doi}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11.5 }}
          >
            {ew.work.doi.length > 22 ? ew.work.doi.slice(0, 22) + "…" : ew.work.doi}
          </a>
        ) : (
          <span className="op-muted" style={{ fontSize: 11.5 }}>
            —
          </span>
        )}
      </td>
      <td style={{ color: "var(--ink-300)" }}>{Icon.arrowRight(14)}</td>
    </tr>
  );
}
