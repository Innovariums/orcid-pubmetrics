import { useState } from "react";
import { Btn, Card, Chip, Icon } from "../../components/primitives";
import { ShareButton } from "../../components/ShareButton";
import { DetailDrawer } from "../analysis/DetailDrawer";
import type { ComparisonResult, EnrichedWork } from "../../types";
import { TONES } from "./CompareForm";
import { CoopGraph } from "./CoopGraph";
import { downloadComparisonCsv } from "./exportCsv";
import { downloadComparisonPdfReport } from "./pdfReport";

interface Props {
  result: ComparisonResult;
  onNewQuery: () => void;
}

export function CompareView({ result, onNewQuery }: Props) {
  const rs = result.researchers;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [drawerWork, setDrawerWork] = useState<{
    work: EnrichedWork;
    coauthorOrcids: string[];
  } | null>(null);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadComparisonPdfReport(result);
    } finally {
      setPdfLoading(false);
    }
  };
  const totalOverlaps = result.journal_overlap.length;
  const suspiciousOverlaps = result.journal_overlap.filter((o) => o.has_editorial_conflict).length;
  const editorialCrossCount = result.editorial_cross.length;
  const coauthCount = result.coauthorships.length;

  return (
    <div className="container-lg">
      <div className="crumbs">
        <button
          className="op-link"
          onClick={onNewQuery}
          style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, color: "var(--ink-500)" }}
        >
          Comparación
        </button>
        <span className="crumbs__sep">/</span>
        <span className="crumbs__active">Resultados</span>
      </div>

      <div className="page-head">
        <div className="page-head__title">
          <h1 className="t-h1">Comparación de {rs.length} investigadores</h1>
          <div className="meta-row">
            <span>Rango {result.start_year}–{result.end_year}</span>
            <span>Fuente {result.metrics_source.toUpperCase()} 2024</span>
          </div>
        </div>
        <div className="page-head__actions">
          <ShareButton />
          <Btn
            variant="secondary"
            className="tb-btn tb-btn--keep-label"
            iconLeft={Icon.download()}
            onClick={() => downloadComparisonCsv(result)}
            title="Descargar CSV"
          >
            CSV
          </Btn>
          <Btn
            variant="secondary"
            className="tb-btn tb-btn--keep-label"
            iconLeft={Icon.download()}
            onClick={handlePdf}
            disabled={pdfLoading}
            title="Descargar informe PDF"
          >
            {pdfLoading ? "…" : "PDF"}
          </Btn>
          <Btn
            variant="secondary"
            className="tb-btn"
            iconLeft={Icon.refresh()}
            onClick={onNewQuery}
            title="Nueva comparación"
          >
            <span className="tb-label">Nueva comparación</span>
          </Btn>
        </div>
      </div>

      {/* Researcher cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {rs.map((r, i) => (
          <div
            key={r.orcid}
            className="op-card"
            style={{
              padding: 18,
              borderTop: `3px solid ${TONES[i % TONES.length]}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: TONES[i % TONES.length],
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="t-tiny">INVESTIGADOR {String.fromCharCode(65 + i)}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink-900)", overflowWrap: "anywhere" }}>
              {r.researcher_name ?? r.orcid}
            </div>
            <div className="mono t-small" style={{ fontSize: 11.5 }}>{r.orcid}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <div className="t-tiny">TOTAL</div>
                <div className="t-stat-sm">{r.total_works}</div>
              </div>
              <div>
                <div className="t-tiny">INDEXADAS</div>
                <div className="t-stat-sm">{r.indexed_works}</div>
              </div>
            </div>
            <MiniQDist q={r.quartile_totals} total={r.total_works} />
          </div>
        ))}
      </div>

      {/* Key findings */}
      <Card title="Observaciones factuales" subtitle="Cifras sin interpretación">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <FactCard value={totalOverlaps} label="revistas donde publican 2+ investigadores del grupo" />
          <FactCard value={suspiciousOverlaps} label="de esas revistas también tienen a alguien del grupo en el comité" tone={suspiciousOverlaps ? "warning" : "neutral"} />
          <FactCard value={editorialCrossCount} label="cruces investigador↔comité (A publica en revista donde B es editor)" tone={editorialCrossCount ? "warning" : "neutral"} />
          <FactCard value={coauthCount} label="publicaciones conjuntas (dos o más del grupo como coautores)" />
        </div>
      </Card>

      <div style={{ height: 20 }} />

      {/* Overlap table */}
      <Card
        title="Solapamiento de revistas"
        subtitle="Revistas donde publican dos o más investigadores del grupo, con el número de publicaciones por cada uno y el cruce con comités editoriales."
      >
        {result.journal_overlap.length === 0 ? (
          <div style={{ padding: "24px", color: "var(--ink-500)", textAlign: "center" }}>
            Sin revistas compartidas entre los investigadores del grupo.
          </div>
        ) : (
          <div className="op-table-wrap">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Revista</th>
                  <th style={{ width: 100 }}>Cuartil</th>
                  {rs.map((_, i) => (
                    <th key={i} style={{ width: 80, textAlign: "center" }}>
                      {String.fromCharCode(65 + i)} pub.
                    </th>
                  ))}
                  <th style={{ width: 180 }}>Comité editorial</th>
                </tr>
              </thead>
              <tbody>
                {result.journal_overlap.map((ov, i) => (
                  <tr key={`${ov.issn ?? ov.journal_title}-${i}`} style={{ cursor: "default" }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{ov.journal_title}</div>
                      {ov.issn && <div className="mono t-small" style={{ fontSize: 11.5 }}>{ov.issn}</div>}
                    </td>
                    <td>
                      <Chip q={ov.best_quartile ?? "unindexed"} />
                    </td>
                    {rs.map((r, idx) => {
                      const n = ov.pubs_by_orcid[r.orcid] ?? 0;
                      return (
                        <td key={r.orcid} style={{ textAlign: "center" }}>
                          {n > 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                              <span style={{ width: 6, height: 6, borderRadius: 3, background: TONES[idx % TONES.length] }} />
                              <span className="mono" style={{ fontSize: 13 }}>{n}</span>
                            </span>
                          ) : (
                            <span className="op-muted" style={{ fontSize: 12 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      {ov.editors_orcids.length > 0 ? (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {ov.editors_orcids.map((oe) => {
                            const idx = rs.findIndex((r) => r.orcid === oe);
                            if (idx < 0) return null;
                            return (
                              <span
                                key={oe}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "3px 8px",
                                  background: "var(--ink-900)",
                                  color: "#fff",
                                  borderRadius: 3,
                                  fontSize: 11.5,
                                  fontWeight: 500,
                                }}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: 3, background: TONES[idx % TONES.length] }} />
                                {String.fromCharCode(65 + idx)} en comité
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="op-muted" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />

      {/* Editorial cross table */}
      {result.editorial_cross.length > 0 && (
        <>
          <Card
            title="Cruces investigador ↔ comité editorial"
            subtitle="Patrones donde un investigador del grupo publica en una revista donde otro del grupo figura en el comité editorial. La interpretación es del lector."
          >
            <div className="op-table-wrap">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Publica</th>
                    <th>Editor</th>
                    <th>Revista</th>
                    <th style={{ width: 90 }}>Rol</th>
                    <th style={{ width: 80, textAlign: "right" }}>Pubs.</th>
                  </tr>
                </thead>
                <tbody>
                  {result.editorial_cross.map((c, i) => {
                    const pubIdx = rs.findIndex((r) => r.orcid === c.publisher_orcid);
                    const edIdx = rs.findIndex((r) => r.orcid === c.editor_orcid);
                    return (
                      <tr key={i} style={{ cursor: "default" }}>
                        <td>
                          <AuthorBadge index={pubIdx} researchers={rs} />
                        </td>
                        <td>
                          <AuthorBadge index={edIdx} researchers={rs} />
                        </td>
                        <td>
                          <div>{c.journal_title}</div>
                          {c.issn && <div className="mono t-small" style={{ fontSize: 11.5 }}>{c.issn}</div>}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>{c.editor_role}</td>
                        <td style={{ textAlign: "right" }} className="mono">{c.pub_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div style={{ height: 20 }} />
        </>
      )}

      {/* Coauthorships */}
      {result.coauthorships.length > 0 && (
        <>
          <Card
            title="Publicaciones conjuntas"
            subtitle="Click en una fila para ver el detalle del trabajo y resaltado de coautores del grupo."
          >
            <div className="op-table-wrap">
              <table className="op-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Año</th>
                    <th style={{ width: 120 }}>Autores del grupo</th>
                    <th>Título</th>
                    <th style={{ width: 200 }}>Revista</th>
                    <th style={{ width: 80 }}>Cuartil</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {result.coauthorships.map((ca, i) => {
                    const w = ca.work;
                    return (
                      <tr
                        key={i}
                        onClick={() =>
                          setDrawerWork({ work: w, coauthorOrcids: ca.orcids })
                        }
                      >
                        <td className="mono">{w.work.pub_year}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            {ca.orcids.map((o) => {
                              const idx = rs.findIndex((r) => r.orcid === o);
                              return idx >= 0 ? (
                                <AuthorBadge key={o} index={idx} researchers={rs} compact />
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td>
                          <div className="op-table__title" style={{ fontSize: 13.5 }}>
                            {w.work.title}
                          </div>
                          <div className="op-table__meta" style={{ marginTop: 2 }}>
                            {w.work.authors.length} autor
                            {w.work.authors.length !== 1 ? "es" : ""}
                            {w.work.work_type &&
                              ` · ${
                                w.work.work_type === "book-chapter"
                                  ? "Capítulo de libro"
                                  : w.work.work_type === "article"
                                  ? "Artículo"
                                  : w.work.work_type
                              }`}
                          </div>
                        </td>
                        <td>
                          {w.work.journal_title ?? (
                            <span className="op-muted">sin título de revista</span>
                          )}
                        </td>
                        <td>
                          <Chip q={w.metric?.quartile ?? "unindexed"} size="sm" />
                        </td>
                        <td style={{ color: "var(--ink-300)" }}>{Icon.arrowRight(14)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div style={{ height: 20 }} />
        </>
      )}

      {/* Grafo */}
      <Card
        title="Diagrama de cooperación"
        subtitle="Investigadores ↔ revistas compartidas. Grosor del lazo ∝ frecuencia de publicación. Borde rojo en la revista = uno del grupo está en su comité editorial."
      >
        <CoopGraph researchers={rs} overlaps={result.journal_overlap} />
      </Card>

      <div style={{ height: 20 }} />

      {/* Fuente y alcance — al final, con el mismo estilo del header individual */}
      <Card title="Fuente y alcance">
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: "10px 16px",
            margin: 0,
            fontSize: 13,
          }}
        >
          <dt className="op-muted">Cuartil</dt>
          <dd style={{ margin: 0 }}>
            {result.metrics_source.toUpperCase()} 2024 (Scimago Journal Rank, basado en Scopus).
          </dd>
          <dt className="op-muted">Publicaciones</dt>
          <dd style={{ margin: 0 }}>
            OpenAlex. Solo publicaciones públicas del registro ORCID.
          </dd>
          {result.editorial_source && (
            <>
              <dt className="op-muted">Comités editoriales</dt>
              <dd style={{ margin: 0 }}>
                Open Editors Plus 2026: dataset público que cubre 26 editoriales grandes
                (Elsevier, Springer, Wiley, Taylor &amp; Francis, SAGE y otras). Revistas de
                editoriales pequeñas o regionales pueden no estar incluidas.
              </dd>
            </>
          )}
          <dt className="op-muted">Interpretación</dt>
          <dd style={{ margin: 0 }}>
            Los datos provienen de fuentes públicas. La interpretación es responsabilidad del
            lector. No se emiten juicios sobre conducta; solo se exponen patrones factuales de
            coincidencia.
          </dd>
        </dl>
      </Card>

      {drawerWork && (
        <DetailDrawer
          work={drawerWork.work}
          onClose={() => setDrawerWork(null)}
          compareContext={{
            orcids: result.orcids,
            coauthorOrcids: drawerWork.coauthorOrcids,
            tones: TONES,
          }}
        />
      )}
    </div>
  );
}

function MiniQDist({ q, total }: { q: ResearcherSummaryLocalQ; total: number }) {
  if (total === 0) {
    return <div className="t-small" style={{ marginTop: 12 }}>Sin publicaciones en rango</div>;
  }
  const segs: Array<{ k: "q1" | "q2" | "q3" | "q4" | "unindexed"; v: number; color: string }> = [
    { k: "q1", v: q.q1, color: "var(--q1)" },
    { k: "q2", v: q.q2, color: "var(--q2)" },
    { k: "q3", v: q.q3, color: "var(--q3)" },
    { k: "q4", v: q.q4, color: "var(--q4)" },
    { k: "unindexed", v: q.unindexed, color: "var(--q-none)" },
  ];
  return (
    <div style={{ marginTop: 14 }}>
      <div className="t-tiny" style={{ marginBottom: 6 }}>DISTRIBUCIÓN</div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--ink-100)" }}>
        {segs.map((s) => s.v > 0 ? (
          <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.color }} title={`${s.k}: ${s.v}`} />
        ) : null)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--f-mono)" }}>
        <span>Q1 {q.q1}</span><span>Q2 {q.q2}</span><span>Q3 {q.q3}</span><span>Q4 {q.q4}</span><span>— {q.unindexed}</span>
      </div>
    </div>
  );
}

type ResearcherSummaryLocalQ = {
  q1: number; q2: number; q3: number; q4: number; unindexed: number;
};

function AuthorBadge({
  index,
  researchers,
  compact,
}: {
  index: number;
  researchers: { orcid: string; researcher_name: string | null }[];
  compact?: boolean;
}) {
  if (index < 0) return <span className="op-muted">?</span>;
  const r = researchers[index];
  const tone = TONES[index % TONES.length];
  if (compact) {
    return (
      <span
        title={r.researcher_name ?? r.orcid}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: tone,
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {String.fromCharCode(65 + index)}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: tone,
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <span style={{ fontSize: 12.5 }}>{r.researcher_name ?? r.orcid.slice(-7)}</span>
    </span>
  );
}

function FactCard({ value, label, tone }: { value: number; label: string; tone?: "warning" | "neutral" }) {
  const bg = tone === "warning" && value > 0 ? "var(--q4-tint)" : "var(--ink-50)";
  const color = tone === "warning" && value > 0 ? "var(--q4)" : "var(--ink-900)";
  return (
    <div style={{ padding: 14, background: bg, borderRadius: "var(--r-sm)" }}>
      <div className="t-stat-sm" style={{ fontSize: 26, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--ink-700)", marginTop: 4 }}>{label}</div>
    </div>
  );
}
