import {
  Document,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
  Circle,
  G,
  Rect,
  Path,
} from "@react-pdf/renderer";
import type { ComparisonResult, JournalOverlap, ResearcherSummary } from "../../types";

const FF_SANS = "Helvetica";
const FF_SERIF = "Times-Roman";
const FF_MONO = "Courier";

const C = {
  ink900: "#0E1116",
  ink700: "#2B313B",
  ink500: "#5A6372",
  ink400: "#8A94A6",
  ink300: "#BDC4D1",
  ink200: "#E4E7EC",
  ink100: "#EEF0F3",
  ink50: "#F6F7F8",
  paper: "#FFFFFF",
  accent: "#1F4FD1",
  q1: "#1F9D55", q1T: "#E5F3EB",
  q2: "#2663E4", q2T: "#E6EEFC",
  q3: "#D4A017", q3T: "#FAF1DC",
  q4: "#C8372D", q4T: "#FBE7E5",
  qn: "#7E8795", qnT: "#ECEEF1",
  suspect: "#C8372D",
};

const TONES = ["#1F4FD1", "#A24BD9", "#D18A1F", "#0B7A6A", "#C8372D"];

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.ink900,
    fontFamily: FF_SANS,
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },
  headerStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.ink200,
  },
  tiny: { fontSize: 8, letterSpacing: 1.2, color: C.ink500, textTransform: "uppercase" },
  hero: { fontFamily: FF_SERIF, fontSize: 24, marginBottom: 6 },
  subtitle: { fontSize: 10, color: C.ink500, marginBottom: 18, lineHeight: 1.5 },
  h2: { fontSize: 12, fontWeight: 600, marginBottom: 8, color: C.ink900 },
  h3: { fontSize: 9, letterSpacing: 1, color: C.ink500, textTransform: "uppercase", marginBottom: 6 },
  card: { borderWidth: 1, borderColor: C.ink200, borderRadius: 6, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: 600, marginBottom: 4 },
  cardSubtitle: { fontSize: 9, color: C.ink500, marginBottom: 8 },

  researcherGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  researcherCard: {
    width: "32%",
    borderWidth: 1,
    borderColor: C.ink200,
    borderRadius: 6,
    padding: 10,
  },
  researcherLetter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  factRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  factCard: { flex: 1, padding: 10, backgroundColor: C.ink50, borderRadius: 6 },
  factCardSuspect: { flex: 1, padding: 10, backgroundColor: C.q4T, borderRadius: 6 },
  factValue: { fontFamily: FF_SERIF, fontSize: 26 },
  factValueSuspect: { fontFamily: FF_SERIF, fontSize: 26, color: C.q4 },
  factLabel: { fontSize: 8.5, color: C.ink700, marginTop: 3, lineHeight: 1.4 },

  tableHead: {
    flexDirection: "row",
    backgroundColor: C.ink50,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: C.ink200,
    paddingVertical: 6, paddingHorizontal: 6,
  },
  tableHeadCell: { fontSize: 7, letterSpacing: 0.8, textTransform: "uppercase", color: C.ink500 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: C.ink100,
    paddingVertical: 6, paddingHorizontal: 6,
  },
  tableRowSuspect: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: C.ink100,
    paddingVertical: 6, paddingHorizontal: 6,
    backgroundColor: C.q4T,
  },
  tableCell: { fontSize: 8.5, color: C.ink900 },
  tableMeta: { fontSize: 7.5, color: C.ink500 },
  mono: { fontFamily: FF_MONO, fontSize: 8 },
  muted: { color: C.ink500 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 1, paddingHorizontal: 5,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  chipDot: { width: 4, height: 4, borderRadius: 2, marginRight: 2 },
  chipText: { fontSize: 7.5, fontWeight: 600, letterSpacing: 0.3 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 44, right: 44,
    flexDirection: "row", justifyContent: "space-between",
    fontSize: 7.5, color: C.ink400,
    borderTopWidth: 1, borderColor: C.ink200,
    paddingTop: 8,
  },
});

function qBits(q: string | null | undefined) {
  switch (q) {
    case "Q1": return { bg: C.q1T, dot: C.q1, t: "#0E6B3A" };
    case "Q2": return { bg: C.q2T, dot: C.q2, t: "#183F9E" };
    case "Q3": return { bg: C.q3T, dot: C.q3, t: "#7A5B0B" };
    case "Q4": return { bg: C.q4T, dot: C.q4, t: "#8B241C" };
    default: return { bg: C.qnT, dot: C.qn, t: C.ink700 };
  }
}

function Chip({ q }: { q: "Q1" | "Q2" | "Q3" | "Q4" | null | undefined }) {
  const b = qBits(q);
  return (
    <View style={[s.chip, { backgroundColor: b.bg }]}>
      <View style={[s.chipDot, { backgroundColor: b.dot }]} />
      <Text style={[s.chipText, { color: b.t }]}>{q ?? "Sin indexar"}</Text>
    </View>
  );
}

function AuthorBadge({ i }: { i: number }) {
  if (i < 0) return <Text style={s.muted}>?</Text>;
  const tone = TONES[i % TONES.length];
  return (
    <View
      style={{
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: tone,
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ color: C.paper, fontSize: 8, fontWeight: 600 }}>
        {String.fromCharCode(65 + i)}
      </Text>
    </View>
  );
}

function formatDate(d: Date) {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function Footer({ source, generatedOn }: { source: string; generatedOn: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Fuente de cuartil: {source} · orcid-pubmetrics.innovarium.site</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}  ·  Generado ${generatedOn}`} />
    </View>
  );
}

function ResearcherCard({ r, i }: { r: ResearcherSummary; i: number }) {
  const tone = TONES[i % TONES.length];
  const t = r.quartile_totals;
  const total = r.total_works || 1;
  const segs: Array<[string, number, string]> = [
    ["q1", t.q1, C.q1],
    ["q2", t.q2, C.q2],
    ["q3", t.q3, C.q3],
    ["q4", t.q4, C.q4],
    ["none", t.unindexed, C.qn],
  ];
  return (
    <View style={[s.researcherCard, { borderTopWidth: 3, borderTopColor: tone }]}>
      <View style={s.researcherLetter}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tone, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.paper, fontSize: 8, fontWeight: 600 }}>{String.fromCharCode(65 + i)}</Text>
        </View>
        <Text style={{ fontSize: 7.5, color: C.ink500, letterSpacing: 0.5 }}>
          INVESTIGADOR {String.fromCharCode(65 + i)}
        </Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
        {r.researcher_name ?? r.orcid}
      </Text>
      <Text style={[s.mono, { marginBottom: 6 }]}>{r.orcid}</Text>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
        <View>
          <Text style={{ fontSize: 7, color: C.ink500 }}>TOTAL</Text>
          <Text style={{ fontFamily: FF_SERIF, fontSize: 18 }}>{r.total_works}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 7, color: C.ink500 }}>IDX</Text>
          <Text style={{ fontFamily: FF_SERIF, fontSize: 18 }}>{r.indexed_works}</Text>
        </View>
      </View>
      {/* MiniQDist */}
      <Svg width={140} height={6}>
        {(() => {
          let cum = 0;
          return segs.map((seg, j) => {
            const [, v, c] = seg;
            if (!v) return null;
            const x = (cum / total) * 140;
            const w = (v / total) * 140;
            cum += v;
            return <Rect key={j} x={x} y={0} width={w} height={6} fill={c} />;
          });
        })()}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        {segs.map(([k, v]) => (
          <Text key={k} style={{ fontSize: 6.5, color: C.ink500, fontFamily: FF_MONO }}>
            {k === "none" ? `— ${v}` : `${k.toUpperCase()} ${v}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function OverlapRow({ ov, orcids }: { ov: JournalOverlap; orcids: string[] }) {
  const editors = ov.editors_orcids;
  const rowStyle = ov.has_editorial_conflict ? s.tableRowSuspect : s.tableRow;
  return (
    <View style={rowStyle} wrap={false}>
      <View style={{ flex: 1 }}>
        <Text style={s.tableCell}>{ov.journal_title}</Text>
        {ov.issn && <Text style={s.tableMeta}>{ov.issn}</Text>}
      </View>
      <View style={{ width: 48 }}>
        <Chip q={ov.best_quartile ?? null} />
      </View>
      {orcids.map((orc, idx) => {
        const n = ov.pubs_by_orcid[orc] ?? 0;
        return (
          <View key={orc} style={{ width: 32, alignItems: "center" }}>
            {n > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: TONES[idx % TONES.length] }} />
                <Text style={s.mono}>{n}</Text>
              </View>
            ) : (
              <Text style={[s.mono, s.muted]}>—</Text>
            )}
          </View>
        );
      })}
      <View style={{ width: 110 }}>
        {editors.length > 0 ? (
          <View style={{ flexDirection: "row", gap: 3, flexWrap: "wrap" }}>
            {editors.map((eo) => {
              const idx = orcids.indexOf(eo);
              return (
                <View key={eo} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.ink900, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: TONES[idx % TONES.length] }} />
                  <Text style={{ fontSize: 7.5, color: C.paper, fontWeight: 600 }}>
                    {String.fromCharCode(65 + idx)} en comité
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[s.mono, s.muted]}>—</Text>
        )}
      </View>
    </View>
  );
}

function NetworkGraph({ result }: { result: ComparisonResult }) {
  const rs = result.researchers;
  const overlaps = result.journal_overlap.slice(0, 10); // Top 10 solapamientos
  if (overlaps.length === 0) {
    return <Text style={{ fontSize: 9, color: C.ink500 }}>Sin revistas compartidas en el rango.</Text>;
  }
  const W = 510;
  const rowH = 24;
  const authorCol = 90;
  const journalCol = 210;
  const H = Math.max(rs.length * 60, overlaps.length * rowH) + 20;

  const authorY = (i: number) => 20 + i * 60;
  const journalY = (i: number) => 10 + i * rowH + rowH / 2;

  return (
    <Svg width={W} height={H}>
      {/* Edges */}
      {overlaps.map((ov, ji) => {
        const jy = journalY(ji);
        return rs.map((r, ai) => {
          const n = ov.pubs_by_orcid[r.orcid] ?? 0;
          if (!n) return null;
          const ay = authorY(ai);
          const color = ov.has_editorial_conflict ? C.suspect : TONES[ai % TONES.length];
          const sw = Math.min(0.8 + Math.sqrt(n) * 0.8, 3);
          return (
            <Path
              key={`${ai}-${ji}`}
              d={`M ${authorCol} ${ay} C ${authorCol + 40} ${ay}, ${journalCol - 40} ${jy}, ${journalCol} ${jy}`}
              stroke={color}
              strokeOpacity={ov.has_editorial_conflict ? 0.5 : 0.3}
              strokeWidth={sw}
              fill="none"
            />
          );
        });
      })}
      {/* Journals */}
      {overlaps.map((ov, ji) => {
        const jy = journalY(ji);
        const q = ov.best_quartile ?? null;
        const qColor = qBits(q).dot;
        return (
          <G key={`j-${ji}`}>
            <Rect
              x={journalCol}
              y={jy - 9}
              width={290}
              height={18}
              rx={3}
              fill={C.paper}
              stroke={ov.has_editorial_conflict ? C.suspect : C.ink200}
              strokeWidth={ov.has_editorial_conflict ? 1.2 : 0.8}
            />
            <Circle cx={journalCol + 10} cy={jy} r={4} fill={qColor} />
            <Text x={journalCol + 20} y={jy + 3} style={{ fontSize: 7.5, fill: C.ink900 }}>
              {truncate(ov.journal_title, 42)}
            </Text>
          </G>
        );
      })}
      {/* Authors */}
      {rs.map((r, i) => {
        const ay = authorY(i);
        const tone = TONES[i % TONES.length];
        return (
          <G key={`a-${i}`}>
            <Circle cx={authorCol - 22} cy={ay} r={14} fill={tone} />
            <Text x={authorCol - 27} y={ay + 3} style={{ fontSize: 9, fill: C.paper, fontWeight: 600 }}>
              {String.fromCharCode(65 + i)}
            </Text>
            <Text x={authorCol - 12} y={ay - 18} style={{ fontSize: 7, fill: C.ink700 }}>
              {truncate(r.researcher_name ?? `Inv. ${String.fromCharCode(65 + i)}`, 22)}
            </Text>
            <Text x={authorCol - 12} y={ay - 8} style={{ fontSize: 6.5, fill: C.ink500, fontFamily: FF_MONO }}>
              {r.orcid.slice(-11)}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function ComparisonReport({ result }: { result: ComparisonResult }) {
  const generatedOn = formatDate(new Date());
  const source = result.metrics_source.toUpperCase();
  const rs = result.researchers;
  const orcids = result.orcids;

  const suspicious = result.journal_overlap.filter((o) => o.has_editorial_conflict).length;
  const crossCount = result.editorial_cross.length;
  const coauthCount = result.coauthorships.length;

  return (
    <Document
      title={`Comparación bibliométrica — ${rs.length} investigadores`}
      author="orcid-pubmetrics (Innovarium)"
      subject={`Comparación de ${rs.map((r) => r.orcid).join(", ")}, ${result.start_year}-${result.end_year}`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.headerStrip}>
          <Text style={s.tiny}>orcid-pubmetrics · Comparación de investigadores</Text>
          <Text style={s.tiny}>Fuente {source} 2024 · {generatedOn}</Text>
        </View>

        <Text style={s.hero}>
          Comparación de {rs.length} investigadores
        </Text>
        <Text style={s.subtitle}>
          Rango {result.start_year}–{result.end_year}. Datos provenientes de OpenAlex + Scimago JR
          {result.editorial_source ? ` + ${result.editorial_source} (comités editoriales)` : ""}.
          Este documento presenta los hallazgos en frío; la interpretación es responsabilidad del lector.
        </Text>

        <Text style={s.h3}>Investigadores</Text>
        <View style={s.researcherGrid}>
          {rs.map((r, i) => (
            <ResearcherCard key={r.orcid} r={r} i={i} />
          ))}
        </View>

        <Text style={s.h3}>Observaciones factuales</Text>
        <View style={s.factRow}>
          <View style={s.factCard}>
            <Text style={s.factValue}>{result.journal_overlap.length}</Text>
            <Text style={s.factLabel}>revistas donde publican 2+ investigadores del grupo</Text>
          </View>
          <View style={suspicious > 0 ? s.factCardSuspect : s.factCard}>
            <Text style={suspicious > 0 ? s.factValueSuspect : s.factValue}>{suspicious}</Text>
            <Text style={s.factLabel}>de esas también tienen a alguien del grupo en el comité</Text>
          </View>
          <View style={crossCount > 0 ? s.factCardSuspect : s.factCard}>
            <Text style={crossCount > 0 ? s.factValueSuspect : s.factValue}>{crossCount}</Text>
            <Text style={s.factLabel}>cruces investigador ↔ comité (A publica donde B es editor)</Text>
          </View>
          <View style={s.factCard}>
            <Text style={s.factValue}>{coauthCount}</Text>
            <Text style={s.factLabel}>coautorías entre investigadores del grupo</Text>
          </View>
        </View>

        <Footer source={`${source} 2024`} generatedOn={generatedOn} />
      </Page>

      {/* Page 2 — Overlap table + graph */}
      <Page size="A4" style={s.page}>
        <View style={s.headerStrip}>
          <Text style={s.tiny}>Comparación · {rs.length} investigadores · {result.start_year}–{result.end_year}</Text>
          <Text style={s.tiny}>{generatedOn}</Text>
        </View>

        <Text style={s.h2}>Solapamiento de revistas</Text>
        <Text style={s.cardSubtitle}>
          Revistas donde publican 2+ investigadores del grupo. Filas resaltadas en rojo =
          uno del grupo está en el comité editorial.
        </Text>

        {result.journal_overlap.length === 0 ? (
          <Text style={[s.muted, { fontSize: 10, marginTop: 10 }]}>
            Sin revistas compartidas en el rango consultado.
          </Text>
        ) : (
          <View>
            <View style={s.tableHead} fixed>
              <View style={{ flex: 1 }}><Text style={s.tableHeadCell}>Revista</Text></View>
              <View style={{ width: 48 }}><Text style={s.tableHeadCell}>Cuartil</Text></View>
              {orcids.map((_, i) => (
                <View key={i} style={{ width: 32, alignItems: "center" }}>
                  <Text style={s.tableHeadCell}>{String.fromCharCode(65 + i)}</Text>
                </View>
              ))}
              <View style={{ width: 110 }}><Text style={s.tableHeadCell}>Comité</Text></View>
            </View>
            {result.journal_overlap.map((ov, i) => (
              <OverlapRow key={`${ov.issn ?? ov.journal_title}-${i}`} ov={ov} orcids={orcids} />
            ))}
          </View>
        )}

        <View style={{ marginTop: 14 }}>
          <Text style={s.h2}>Diagrama de cooperación</Text>
          <Text style={s.cardSubtitle}>
            Top 10 revistas. Grosor del lazo ∝ frecuencia de publicación.
            Borde rojo = revista con miembro del grupo en su comité.
          </Text>
          <NetworkGraph result={result} />
        </View>

        <Footer source={`${source} 2024`} generatedOn={generatedOn} />
      </Page>

      {/* Page 3 — Editorial cross + coauthorships */}
      {(result.editorial_cross.length > 0 || result.coauthorships.length > 0) && (
        <Page size="A4" style={s.page}>
          <View style={s.headerStrip}>
            <Text style={s.tiny}>Comparación · Cruces editoriales y coautorías</Text>
            <Text style={s.tiny}>{generatedOn}</Text>
          </View>

          {result.editorial_cross.length > 0 && (
            <>
              <Text style={s.h2}>Cruces investigador ↔ comité editorial</Text>
              <Text style={s.cardSubtitle}>
                Patrones donde A publica en una revista donde B figura en el comité editorial.
              </Text>
              <View style={s.tableHead}>
                <View style={{ width: 36 }}><Text style={s.tableHeadCell}>Pub.</Text></View>
                <View style={{ width: 36 }}><Text style={s.tableHeadCell}>Ed.</Text></View>
                <View style={{ flex: 1 }}><Text style={s.tableHeadCell}>Revista</Text></View>
                <View style={{ width: 70 }}><Text style={s.tableHeadCell}>Rol</Text></View>
                <View style={{ width: 36, alignItems: "flex-end" }}><Text style={s.tableHeadCell}>Pubs.</Text></View>
              </View>
              {result.editorial_cross.map((c, i) => {
                const pi = orcids.indexOf(c.publisher_orcid);
                const ei = orcids.indexOf(c.editor_orcid);
                return (
                  <View key={i} style={s.tableRow} wrap={false}>
                    <View style={{ width: 36 }}><AuthorBadge i={pi} /></View>
                    <View style={{ width: 36 }}><AuthorBadge i={ei} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tableCell}>{c.journal_title}</Text>
                      {c.issn && <Text style={s.tableMeta}>{c.issn}</Text>}
                    </View>
                    <View style={{ width: 70 }}><Text style={s.mono}>{c.editor_role}</Text></View>
                    <View style={{ width: 36, alignItems: "flex-end" }}>
                      <Text style={s.mono}>{c.pub_count}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {result.coauthorships.length > 0 && (
            <>
              <Text style={[s.h2, { marginTop: 18 }]}>Publicaciones conjuntas</Text>
              <Text style={s.cardSubtitle}>
                Works donde ≥2 investigadores del grupo figuran como coautores.
              </Text>
              <View style={s.tableHead}>
                <View style={{ width: 32 }}><Text style={s.tableHeadCell}>Año</Text></View>
                <View style={{ width: 60 }}><Text style={s.tableHeadCell}>Autores</Text></View>
                <View style={{ flex: 1 }}><Text style={s.tableHeadCell}>Título</Text></View>
                <View style={{ width: 40 }}><Text style={s.tableHeadCell}>Q</Text></View>
              </View>
              {result.coauthorships.map((ca, i) => {
                const w = ca.work;
                return (
                  <View key={i} style={s.tableRow} wrap={false}>
                    <View style={{ width: 32 }}><Text style={s.mono}>{w.work.pub_year}</Text></View>
                    <View style={{ width: 60, flexDirection: "row", gap: 2 }}>
                      {ca.orcids.map((o) => (
                        <AuthorBadge key={o} i={orcids.indexOf(o)} />
                      ))}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tableCell}>{w.work.title}</Text>
                      {w.work.journal_title && <Text style={s.tableMeta}>{w.work.journal_title}</Text>}
                    </View>
                    <View style={{ width: 40 }}>
                      <Chip q={w.metric?.quartile ?? null} />
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <Footer source={`${source} 2024`} generatedOn={generatedOn} />
        </Page>
      )}
    </Document>
  );
}

export async function downloadComparisonPdfReport(result: ComparisonResult): Promise<void> {
  const blob = await pdf(<ComparisonReport result={result} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comparacion-${result.orcids.length}-orcids-${result.start_year}-${result.end_year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
