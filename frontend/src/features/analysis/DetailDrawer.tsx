import { useEffect } from "react";
import { Btn, Chip, Icon } from "../../components/primitives";
import type { EnrichedWork } from "../../types";

export function DetailDrawer({ work, onClose }: { work: EnrichedWork; onClose: () => void }) {
  const m = work.metric;
  const allCats = work.all_metrics;
  const workTypeLabel =
    work.work.work_type === "book-chapter"
      ? "Capítulo de libro"
      : work.work.work_type === "article"
      ? "Artículo"
      : work.work.work_type;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="detail-drawer__overlay" onClick={onClose} />
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label="Detalle de publicación">
        <header
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--ink-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Chip q={m ? m.quartile : "unindexed"} />
            <span className="t-small" style={{ fontSize: 12.5 }}>
              {work.work.pub_year} · {workTypeLabel}
            </span>
          </div>
          <button
            type="button"
            className="op-btn op-btn--ghost op-btn--sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            {Icon.close()}
          </button>
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 32px" }}>
          <h2 className="t-h1" style={{ fontSize: 22, margin: 0, lineHeight: 1.25 }}>
            {work.work.title}
          </h2>
          <div
            style={{
              marginTop: 14,
              color: "var(--ink-700)",
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
            {work.work.journal_title ?? (
              <em className="op-muted">Sin título de revista</em>
            )}
          </div>

          <section style={{ marginTop: 24 }}>
            <div className="t-h3" style={{ marginBottom: 10 }}>
              Cuartil por categoría
            </div>
            {allCats.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {allCats.map((c, i) => (
                  <div
                    key={`${c.category}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      border: "1px solid var(--ink-200)",
                      borderRadius: "var(--r-sm)",
                      background: i === 0 ? "var(--ink-50)" : "var(--paper)",
                    }}
                  >
                    <Chip q={c.quartile} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "var(--ink-900)" }}>{c.category}</div>
                      <div
                        className="t-small mono"
                        style={{ fontSize: 11.5, marginTop: 2 }}
                      >
                        {c.category_rank != null && c.category_total != null ? (
                          <>Rank {c.category_rank}/{c.category_total}</>
                        ) : (
                          <>Rank sin datos</>
                        )}
                        {c.year_rule !== "exact" && (
                          <span style={{ color: "var(--q3)" }}> · {c.year_rule}</span>
                        )}
                      </div>
                    </div>
                    <div className="t-stat-sm mono" style={{ fontSize: 18 }}>
                      {c.score.toFixed(3)}
                    </div>
                  </div>
                ))}
                {m && m.year_rule !== "exact" && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "var(--q3-tint)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 12.5,
                      color: "#7A5B0B",
                    }}
                  >
                    <strong>Nota:</strong> no hay datos SJR exactos para {m.year}. Se usó el año
                    más cercano con trazabilidad registrada ({m.year_rule}).
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: 14,
                  background: "var(--q-none-tint)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13,
                  color: "var(--ink-700)",
                }}
              >
                <strong>Sin cuartil resoluble.</strong> Razón:{" "}
                <span
                  className="mono"
                  style={{ background: "var(--paper)", padding: "1px 5px", borderRadius: 2 }}
                >
                  {work.not_found_reason ?? "desconocida"}
                </span>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12.5,
                    color: "var(--ink-500)",
                    lineHeight: 1.5,
                  }}
                >
                  {work.not_found_reason === "no_issn"
                    ? "OpenAlex no expone ISSN para este trabajo, por lo que no es posible cruzar con SJR."
                    : work.not_found_reason === "not_in_source"
                    ? "La revista no está indexada en Scimago para el rango consultado. Esto es una señal relevante."
                    : "Los metadatos de OpenAlex están incompletos para este trabajo."}
                </div>
              </div>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <div className="t-h3" style={{ marginBottom: 10 }}>
              Autores ({work.work.authors.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {work.work.authors.map((a, i) => (
                <div
                  key={`${a.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    background:
                      a.orcid === work.work.orcid ? "var(--accent-tint)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: "var(--ink-100)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink-500)",
                      flexShrink: 0,
                    }}
                  >
                    {a.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5 }}>
                      {a.name}
                      {a.orcid === work.work.orcid && (
                        <span
                          style={{ color: "var(--accent)", fontSize: 11, marginLeft: 4 }}
                        >
                          autor consultado
                        </span>
                      )}
                    </div>
                    {a.orcid && (
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>
                        {a.orcid}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <div className="t-h3" style={{ marginBottom: 10 }}>
              Identificadores
            </div>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: "10px 12px",
                margin: 0,
                fontSize: 13,
              }}
            >
              <dt className="op-muted">DOI</dt>
              <dd style={{ margin: 0 }}>
                {work.work.doi ? (
                  <a
                    className="op-link mono"
                    href={`https://doi.org/${work.work.doi}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {work.work.doi}
                  </a>
                ) : (
                  <span className="op-muted">—</span>
                )}
              </dd>
              <dt className="op-muted">ISSN</dt>
              <dd
                className="mono"
                style={{
                  margin: 0,
                  color: work.work.issn ? "var(--ink-900)" : "var(--ink-400)",
                }}
              >
                {work.work.issn ?? "sin ISSN"}
              </dd>
              <dt className="op-muted">eISSN</dt>
              <dd
                className="mono"
                style={{
                  margin: 0,
                  color: work.work.eissn ? "var(--ink-900)" : "var(--ink-400)",
                }}
              >
                {work.work.eissn ?? "—"}
              </dd>
              <dt className="op-muted">OpenAlex</dt>
              <dd style={{ margin: 0 }}>
                {work.work.openalex_id ? (
                  <a
                    className="op-link mono"
                    href={work.work.openalex_id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {work.work.openalex_id.replace("https://openalex.org/", "")}
                  </a>
                ) : (
                  <span className="op-muted">—</span>
                )}
              </dd>
            </dl>
          </section>

          <div style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {work.work.openalex_id && (
              <Btn variant="secondary" size="sm" iconRight={Icon.external()} onClick={() => window.open(work.work.openalex_id!, "_blank")}>
                OpenAlex
              </Btn>
            )}
            <Btn
              variant="ghost"
              size="sm"
              iconRight={Icon.external()}
              onClick={() =>
                window.open(
                  `https://scholar.google.com/scholar?q=${encodeURIComponent(work.work.title)}`,
                  "_blank",
                )
              }
            >
              Google Scholar
            </Btn>
          </div>
        </div>
      </aside>
    </>
  );
}
