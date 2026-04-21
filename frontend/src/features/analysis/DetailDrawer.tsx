import { useEffect } from "react";
import { Btn, Chip, Icon } from "../../components/primitives";
import type { EnrichedWork, PublindexEntry } from "../../types";

export interface CompareContext {
  /** ORCIDs del grupo comparado, en el orden A, B, C... */
  orcids: string[];
  /** ORCIDs del grupo que son coautores de este work (subset de orcids). */
  coauthorOrcids: string[];
  /** Paleta tonal para los badges de investigador A/B/C/... */
  tones: string[];
}

interface Props {
  work: EnrichedWork;
  onClose: () => void;
  compareContext?: CompareContext;
  /** Entrada Publindex (MinCiencias) asociada al ISSN. Feature secundaria de
   * exploración: se muestra *sólo* cuando el work no tiene cuartil SJR, para
   * reforzar que JCR/SJR sigue siendo la señal principal. */
  publindexEntry?: PublindexEntry | null;
}

export function DetailDrawer({ work, onClose, compareContext, publindexEntry }: Props) {
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

    // Bloquear scroll del fondo mientras el drawer está abierto
    const scrollable = document.querySelector<HTMLElement>(".app-shell__main");
    const prev = scrollable?.style.overflow;
    if (scrollable) scrollable.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      if (scrollable) scrollable.style.overflow = prev ?? "";
    };
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

          {compareContext && compareContext.coauthorOrcids.length >= 2 && (
            <CooperationPanel context={compareContext} />
          )}

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
                <PublindexBlock
                  entry={publindexEntry ?? null}
                  pubYear={work.work.pub_year}
                  hasIssn={Boolean(work.work.issn || work.work.eissn)}
                />
              </div>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <div className="t-h3" style={{ marginBottom: 10 }}>
              Autores ({work.work.authors.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {work.work.authors.map((a, i) => {
                const isConsulted = a.orcid === work.work.orcid;
                const compareIdx = compareContext
                  ? compareContext.orcids.indexOf(a.orcid ?? "")
                  : -1;
                const isInGroup = compareIdx >= 0;
                const tone = isInGroup ? compareContext!.tones[compareIdx % compareContext!.tones.length] : null;
                const bg = isInGroup
                  ? tone + "22" // 13% opacity variation via hex alpha
                  : isConsulted
                  ? "var(--accent-tint)"
                  : "transparent";
                return (
                  <div
                    key={`${a.name}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--r-sm)",
                      background: bg,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: isInGroup ? tone! : "var(--ink-100)",
                        color: isInGroup ? "#fff" : "var(--ink-500)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {isInGroup
                        ? String.fromCharCode(65 + compareIdx)
                        : a.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5 }}>
                        {a.name}
                        {isInGroup && (
                          <span style={{ color: tone!, fontSize: 11, marginLeft: 6, fontWeight: 600 }}>
                            Investigador {String.fromCharCode(65 + compareIdx)}
                          </span>
                        )}
                        {isConsulted && !compareContext && (
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
                );
              })}
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

function PublindexBlock({
  entry,
  pubYear,
  hasIssn,
}: {
  entry: PublindexEntry | null;
  pubYear: number;
  hasIssn: boolean;
}) {
  // 3 estados: encontrada / sin match pero con ISSN / sin ISSN (no consultable).
  const badgeLabel = entry
    ? `PUBLINDEX · ${entry.history.find((h) => h.year === pubYear)?.category ?? entry.latest_category}`
    : "PUBLINDEX · —";

  let bodyNode: JSX.Element;

  if (entry) {
    const exact = entry.history.find((h) => h.year === pubYear);
    const shown = exact ?? { year: entry.latest_year, category: entry.latest_category };
    bodyNode = (
      <>
        <div style={{ marginBottom: 6 }}>
          Esta revista aparece en <strong>Publindex</strong> como{" "}
          <strong>categoría {shown.category}</strong>
          {exact ? ` en ${shown.year}` : ` en ${shown.year} (último registro disponible)`}
          {entry.area ? `, área ${entry.area}` : ""}. Publindex es un índice nacional
          (MinCiencias Colombia) y <em>no reemplaza</em> la señal principal de este
          informe: lo que importa para la evaluación bibliométrica internacional sigue
          siendo el cuartil <strong>JCR/SJR</strong>.
        </div>
        {entry.history.length > 1 && (
          <details style={{ marginTop: 6 }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 11.5,
                color: "var(--ink-500)",
                userSelect: "none",
              }}
            >
              Histórico Publindex ({entry.history.length} años)
            </summary>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {entry.history.map((h) => (
                <span
                  key={h.year}
                  className="mono"
                  style={{
                    fontSize: 11,
                    padding: "1px 6px",
                    background: "var(--ink-50)",
                    border: "1px solid var(--ink-200)",
                    borderRadius: 3,
                  }}
                >
                  {h.year}:{h.category}
                </span>
              ))}
            </div>
          </details>
        )}
      </>
    );
  } else if (hasIssn) {
    bodyNode = (
      <div>
        Esta revista <strong>no está registrada</strong> en Publindex (Índice Nacional
        MinCiencias Colombia). Publindex se consulta de forma complementaria sólo
        como contraste; la señal principal del informe sigue siendo el cuartil{" "}
        <strong>JCR/SJR</strong>.
      </div>
    );
  } else {
    bodyNode = (
      <div>
        Publindex (Índice Nacional MinCiencias Colombia) no se pudo consultar: este
        trabajo no expone ISSN. El cuartil <strong>JCR/SJR</strong> sigue siendo la
        señal principal del informe.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        border: "1px dashed var(--ink-300)",
        borderRadius: "var(--r-sm)",
        background: "var(--paper)",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "var(--ink-700)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.3,
            padding: "2px 6px",
            background: entry ? "var(--ink-900)" : "var(--ink-400)",
            color: "var(--paper)",
            borderRadius: 3,
          }}
        >
          {badgeLabel}
        </span>
        <span className="op-muted" style={{ fontSize: 11.5 }}>
          {entry
            ? `Índice Nacional (MinCiencias Colombia) · ${entry.history.find((h) => h.year === pubYear)?.year ?? entry.latest_year}${entry.history.find((h) => h.year === pubYear) ? "" : " (más reciente)"}`
            : "Índice Nacional (MinCiencias Colombia) — sin coincidencia"}
        </span>
      </div>
      {bodyNode}
    </div>
  );
}

function CooperationPanel({ context }: { context: CompareContext }) {
  const coauthors = context.coauthorOrcids
    .map((o) => ({ orcid: o, idx: context.orcids.indexOf(o) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  return (
    <section
      style={{
        marginTop: 20,
        padding: "14px 14px",
        border: "1px solid var(--ink-200)",
        borderRadius: "var(--r-sm)",
        background: "var(--ink-50)",
      }}
    >
      <div className="t-h3" style={{ marginBottom: 8 }}>
        Cooperación del grupo
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-700)", marginBottom: 10 }}>
        Este trabajo tiene a <strong>{coauthors.length}</strong> investigadores del grupo
        comparado como coautores directos.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {coauthors.map(({ orcid, idx }) => {
          const tone = context.tones[idx % context.tones.length];
          return (
            <span
              key={orcid}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px 3px 3px",
                background: "var(--paper)",
                border: `1px solid ${tone}33`,
                borderRadius: "var(--r-pill)",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: tone,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-700)" }}>
                {orcid}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
