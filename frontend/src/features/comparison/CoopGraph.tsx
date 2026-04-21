import { CHART_COLORS } from "../../components/charts";
import type { JournalOverlap, ResearcherSummary } from "../../types";
import { TONES } from "./CompareForm";

interface Props {
  researchers: ResearcherSummary[];
  overlaps: JournalOverlap[];
}

/**
 * Grafo bipartito: investigadores (izquierda) ↔ revistas compartidas (derecha).
 *
 * Codificación visual:
 * - Revistas coloreadas por cuartil (verde Q1 → rojo Q4, gris sin indexar)
 * - Grosor de arista = frecuencia de publicación del investigador en la revista
 * - Revistas con `has_editorial_conflict` reciben un badge rojo "EDITORIAL"
 *   y un borde rojo distinto — son las "sospechosas" que pidió el profesor.
 */
export function CoopGraph({ researchers, overlaps }: Props) {
  if (overlaps.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-500)" }}>
        Sin revistas compartidas en el rango consultado.
      </div>
    );
  }

  const rowH = 56;
  const authorCol = 180;
  const journalCol = 560;
  const pad = 24;
  const height = Math.max(researchers.length * 80, overlaps.length * rowH) + pad * 2;
  const width = authorCol + journalCol + 140;

  const authorY = (i: number) =>
    pad + (i + 0.5) * (height - pad * 2) / researchers.length;
  const journalY = (i: number) => pad + (i + 0.5) * rowH;

  const qColor = (q: string | null | undefined) => {
    if (!q) return CHART_COLORS.unindexed;
    switch (q) {
      case "Q1":
        return CHART_COLORS.q1;
      case "Q2":
        return CHART_COLORS.q2;
      case "Q3":
        return CHART_COLORS.q3;
      case "Q4":
        return CHART_COLORS.q4;
    }
    return CHART_COLORS.unindexed;
  };

  const SUSPICIOUS = "#C8372D"; // rojo más intenso para sospechosas

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", minWidth: 700 }}
        role="img"
        aria-label="Grafo de cooperación entre investigadores y revistas compartidas"
      >
        {/* Edges */}
        {overlaps.map((ov, ji) => {
          const jy = journalY(ji);
          return researchers.map((r, ai) => {
            const pubs = ov.pubs_by_orcid[r.orcid] ?? 0;
            if (!pubs) return null;
            const ay = authorY(ai);
            const strokeW = Math.min(1 + Math.sqrt(pubs) * 1.4, 6);
            const color = ov.has_editorial_conflict ? SUSPICIOUS : TONES[ai % TONES.length];
            const opacity = ov.has_editorial_conflict ? 0.55 : 0.3;
            return (
              <path
                key={`${ai}-${ji}`}
                d={`M ${authorCol - 12} ${ay} C ${authorCol + 100} ${ay}, ${journalCol - 40} ${jy}, ${journalCol} ${jy}`}
                fill="none"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth={strokeW}
              />
            );
          });
        })}

        {/* Journal nodes */}
        {overlaps.map((ov, ji) => {
          const jy = journalY(ji);
          const isSuspicious = ov.has_editorial_conflict;
          return (
            <g key={`j-${ji}`}>
              <rect
                x={journalCol}
                y={jy - 14}
                width={560}
                height={28}
                rx={4}
                fill="#fff"
                stroke={isSuspicious ? SUSPICIOUS : "var(--ink-200)"}
                strokeWidth={isSuspicious ? 1.5 : 1}
              />
              <circle cx={journalCol + 14} cy={jy} r={6} fill={qColor(ov.best_quartile)} />
              <text
                x={journalCol + 28}
                y={jy + 4}
                fontSize="12"
                fill="var(--ink-900)"
                style={{ fontWeight: 500 }}
              >
                {truncate(ov.journal_title, 44)}
              </text>
              {ov.issn && (
                <text
                  x={journalCol + 460}
                  y={jy + 4}
                  fontSize="10.5"
                  fontFamily="var(--f-mono)"
                  fill="var(--ink-400)"
                  textAnchor="end"
                >
                  {formatIssn(ov.issn)}
                </text>
              )}
              {isSuspicious && (
                <g transform={`translate(${journalCol + 470} ${jy - 9})`}>
                  <rect
                    x={0}
                    y={0}
                    width={78}
                    height={18}
                    rx={3}
                    fill={SUSPICIOUS}
                  />
                  <text
                    x={39}
                    y={12}
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#fff"
                    textAnchor="middle"
                    letterSpacing="0.5"
                  >
                    COMITÉ {labelEditors(ov, researchers)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Author nodes */}
        {researchers.map((r, i) => {
          const y = authorY(i);
          const tone = TONES[i % TONES.length];
          return (
            <g key={`a-${i}`}>
              <circle cx={authorCol - 40} cy={y} r={24} fill={tone} />
              <text
                x={authorCol - 40}
                y={y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                fill="#fff"
              >
                {String.fromCharCode(65 + i)}
              </text>
              <text
                x={authorCol - 10}
                y={y - 4}
                fontSize="12"
                fill="var(--ink-900)"
                fontWeight={500}
              >
                {r.researcher_name ?? `Investigador ${String.fromCharCode(65 + i)}`}
              </text>
              <text
                x={authorCol - 10}
                y={y + 12}
                fontSize="10.5"
                fontFamily="var(--f-mono)"
                fill="var(--ink-500)"
              >
                {r.orcid}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${pad}, ${height - 8})`}>
          <text fontSize="10.5" fill="var(--ink-500)">
            Color de revista = cuartil SJR · borde rojo = un investigador del grupo está en el comité editorial
          </text>
        </g>
      </svg>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function formatIssn(issn: string) {
  return issn.length === 8 ? `${issn.slice(0, 4)}-${issn.slice(4)}` : issn;
}

function labelEditors(ov: JournalOverlap, researchers: ResearcherSummary[]): string {
  const letters = ov.editors_orcids.map((o) => {
    const idx = researchers.findIndex((r) => r.orcid === o);
    return idx >= 0 ? String.fromCharCode(65 + idx) : "?";
  });
  return letters.join("+");
}
