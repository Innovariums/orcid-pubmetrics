import {
  Document,
  Font,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
  Circle,
  G,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import type { AnalysisResult, EnrichedWork, TopJournal, YearQuartileBucket, YearScorePoint } from "../../types";

/* --- Fonts (Inter + Newsreader desde Google Fonts) --- */
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50ojIa2ZL7W0Q5nw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50ojIa1ZL7W0Q5nw.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50ojIa3pL7W0Q5nw.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50ojIa0JL7W0Q5nw.ttf", fontWeight: 700 },
  ],
});
Font.register({
  family: "Newsreader",
  fonts: [
    { src: "https://fonts.gstatic.com/s/newsreader/v21/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438weI_ADg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/newsreader/v21/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF4zwweI_ADg.ttf", fontWeight: 500 },
  ],
});

/* --- Paleta (espejo del CSS del sitio) --- */
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
  q1: "#1F9D55",
  q1Tint: "#E5F3EB",
  q2: "#2663E4",
  q2Tint: "#E6EEFC",
  q3: "#D4A017",
  q3Tint: "#FAF1DC",
  q4: "#C8372D",
  q4Tint: "#FBE7E5",
  qn: "#7E8795",
  qnTint: "#ECEEF1",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.ink900,
    fontFamily: "Inter",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },
  /* Header strip */
  headerStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.ink200,
  },
  tiny: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: C.ink500,
    textTransform: "uppercase",
    fontWeight: 500,
  },
  hero: { fontFamily: "Newsreader", fontSize: 26, fontWeight: 500, lineHeight: 1.15, marginBottom: 8 },
  h2: { fontSize: 13, fontWeight: 600, marginBottom: 10, color: C.ink900 },
  h3: { fontSize: 9.5, letterSpacing: 1, color: C.ink500, textTransform: "uppercase", marginBottom: 6, fontWeight: 500 },
  body: { fontSize: 10, color: C.ink700, lineHeight: 1.55 },
  muted: { color: C.ink500 },
  mono: { fontFamily: "Courier", fontSize: 9.5 },
  orcidChip: {
    fontFamily: "Courier",
    fontSize: 9.5,
    color: C.ink700,
    backgroundColor: C.ink100,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  metaItem: { fontSize: 9.5, color: C.ink500, marginRight: 10 },

  /* Stats */
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 18 },
  kpi: {
    width: "13.8%",
    borderWidth: 1,
    borderColor: C.ink200,
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 7.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: C.ink500,
    fontWeight: 500,
    marginBottom: 6,
  },
  kpiLabelDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  kpiValue: { fontFamily: "Newsreader", fontSize: 22, lineHeight: 1 },
  kpiHint: { fontSize: 8, color: C.ink500, marginTop: 3 },

  /* Chart blocks */
  cardTitle: { fontSize: 11.5, fontWeight: 600, marginBottom: 4 },
  cardSubtitle: { fontSize: 9, color: C.ink500, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: C.ink200,
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
  },

  /* Tables */
  table: { marginTop: 4 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.ink50,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.ink200,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeadCell: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.ink500,
    fontWeight: 500,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: C.ink100,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableCell: { fontSize: 9, color: C.ink900, lineHeight: 1.35 },
  tableMeta: { fontSize: 8, color: C.ink500, marginTop: 1 },

  /* Chips */
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  chipDot: { width: 4, height: 4, borderRadius: 2, marginRight: 3 },
  chipText: { fontSize: 8, fontWeight: 600, letterSpacing: 0.5 },

  /* Disclaimer */
  disclaimer: {
    borderLeftWidth: 2,
    borderLeftColor: C.q3,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 6,
    backgroundColor: C.paper,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: C.ink200,
    marginBottom: 18,
    fontSize: 9,
    color: C.ink700,
    lineHeight: 1.5,
  },

  /* Legend */
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, fontSize: 8.5, color: C.ink500 },
  legendSwatch: { width: 8, height: 8, borderRadius: 1, marginRight: 3 },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.ink400,
    borderTopWidth: 1,
    borderColor: C.ink200,
    paddingTop: 8,
  },

  /* Row-ish helpers */
  row: { flexDirection: "row" },
  grid2: { flexDirection: "row", gap: 14, marginBottom: 14 },
  col: { flexDirection: "column" },
});

const qColor = (q: string | null | undefined) => {
  switch (q) {
    case "Q1":
      return { bg: C.q1Tint, dot: C.q1, text: "#0E6B3A" };
    case "Q2":
      return { bg: C.q2Tint, dot: C.q2, text: "#183F9E" };
    case "Q3":
      return { bg: C.q3Tint, dot: C.q3, text: "#7A5B0B" };
    case "Q4":
      return { bg: C.q4Tint, dot: C.q4, text: "#8B241C" };
    default:
      return { bg: C.qnTint, dot: C.qn, text: C.ink700 };
  }
};

function Chip({ q }: { q: "Q1" | "Q2" | "Q3" | "Q4" | null | undefined }) {
  const c = qColor(q);
  return (
    <View style={[s.chip, { backgroundColor: c.bg }]}>
      <View style={[s.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[s.chipText, { color: c.text }]}>{q ?? "Sin indexar"}</Text>
    </View>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "q1" | "q2" | "q3" | "q4" | "none";
}) {
  const tonecolor =
    tone === "q1" ? C.q1 :
    tone === "q2" ? C.q2 :
    tone === "q3" ? C.q3 :
    tone === "q4" ? C.q4 :
    tone === "none" ? C.qn : C.ink900;
  return (
    <View style={s.kpi}>
      <View style={s.kpiLabelDot}>
        {tone && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tonecolor }} />}
        <Text style={s.kpiLabel}>{label}</Text>
      </View>
      <Text style={[s.kpiValue, { color: tonecolor }]}>{value}</Text>
      {hint && <Text style={s.kpiHint}>{hint}</Text>}
    </View>
  );
}

/* ============================== CHARTS ============================== */

function StackedBarPdf({ data, width = 460, height = 170 }: { data: YearQuartileBucket[]; width?: number; height?: number }) {
  const pad = { t: 12, r: 8, b: 22, l: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const nonZero = data.filter((d) => d.q1 + d.q2 + d.q3 + d.q4 + d.unindexed > 0);
  const years = nonZero.length ? nonZero : data;
  const maxTotal = Math.max(...years.map((d) => d.q1 + d.q2 + d.q3 + d.q4 + d.unindexed), 3);
  const step = innerW / years.length;
  const barW = Math.min(step * 0.65, 20);
  const ticks = [0, Math.ceil(maxTotal / 2), maxTotal];
  const yScale = (v: number) => innerH - (v / maxTotal) * innerH;
  const layers: Array<{ k: "q1" | "q2" | "q3" | "q4" | "unindexed"; c: string }> = [
    { k: "q1", c: C.q1 },
    { k: "q2", c: C.q2 },
    { k: "q3", c: C.q3 },
    { k: "q4", c: C.q4 },
    { k: "unindexed", c: C.qn },
  ];

  return (
    <Svg width={width} height={height}>
      <G transform={`translate(${pad.l},${pad.t})`}>
        {ticks.map((t) => (
          <G key={t}>
            <Line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke={C.ink200} strokeWidth={0.5} />
            <Text x={-6} y={yScale(t) + 2} style={{ fontSize: 7.5, fill: C.ink400 }}>
              {String(t)}
            </Text>
          </G>
        ))}
        {years.map((d, i) => {
          let cum = 0;
          const cx = i * step + step / 2;
          const tickEvery = Math.max(1, Math.ceil(years.length / 8));
          const elems: React.ReactNode[] = [];
          layers.forEach((l) => {
            const v = d[l.k];
            if (!v) return;
            const h = (v / maxTotal) * innerH;
            const y = innerH - h - (cum / maxTotal) * innerH;
            cum += v;
            elems.push(
              <Rect
                key={`${d.year}-${l.k}`}
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={h}
                fill={l.c}
              />,
            );
          });
          if (i === 0 || i === years.length - 1 || i % tickEvery === 0) {
            elems.push(
              <Text
                key={`lbl-${d.year}`}
                x={cx - 10}
                y={innerH + 12}
                style={{ fontSize: 7, fill: C.ink400 }}
              >
                {d.year}
              </Text>,
            );
          }
          return <G key={d.year}>{elems}</G>;
        })}
      </G>
    </Svg>
  );
}

function DoughnutPdf({ totals, size = 120 }: { totals: AnalysisResult["quartile_totals"]; size?: number }) {
  const data = (
    [
      { k: "q1", v: totals.q1, c: C.q1, l: "Q1" },
      { k: "q2", v: totals.q2, c: C.q2, l: "Q2" },
      { k: "q3", v: totals.q3, c: C.q3, l: "Q3" },
      { k: "q4", v: totals.q4, c: C.q4, l: "Q4" },
      { k: "unindexed", v: totals.unindexed, c: C.qn, l: "Sin idx." },
    ] as const
  ).filter((d) => d.v > 0);
  const total = data.reduce((a, d) => a + d.v, 0);
  if (total === 0) {
    return <Text style={s.muted}>Sin datos indexados.</Text>;
  }
  const r = size / 2 - 2;
  const rInner = r * 0.6;
  const cx = size / 2;
  const cy = size / 2;
  let cum = 0;
  const arcs = data.map((d) => {
    const a0 = (cum / total) * Math.PI * 2 - Math.PI / 2;
    cum += d.v;
    const a1 = (cum / total) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0),
      y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1),
      y1 = cy + r * Math.sin(a1);
    const xi0 = cx + rInner * Math.cos(a0),
      yi0 = cy + rInner * Math.sin(a0);
    const xi1 = cx + rInner * Math.cos(a1),
      yi1 = cy + rInner * Math.sin(a1);
    const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rInner} ${rInner} 0 ${large} 0 ${xi0} ${yi0} Z`;
    return { ...d, path, pct: Math.round((d.v / total) * 100) };
  });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Svg width={size} height={size}>
        {arcs.map((a) => (
          <Path key={a.k} d={a.path} fill={a.c} />
        ))}
        <Text x={cx - 10} y={cy - 2} style={{ fontFamily: "Newsreader", fontSize: 16, fill: C.ink900 }}>
          {total}
        </Text>
        <Text x={cx - 17} y={cy + 10} style={{ fontSize: 6.5, fill: C.ink500, letterSpacing: 0.5 }}>
          PUBS.
        </Text>
      </Svg>
      <View style={{ flexDirection: "column", gap: 5 }}>
        {arcs.map((a) => (
          <View key={a.k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: a.c }} />
            <Text style={{ fontSize: 9, width: 56 }}>{a.l}</Text>
            <Text style={{ fontFamily: "Courier", fontSize: 8, color: C.ink500 }}>
              {a.v} · {a.pct}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HBarPdf({ rows, width = 460 }: { rows: TopJournal[]; width?: number }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const labelW = 200;
  const countW = 22;
  const barW = width - labelW - countW - 16;
  return (
    <View style={{ flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              width: labelW,
              fontSize: 9,
              color: r.title === "Unknown" ? C.ink400 : C.ink700,
              fontStyle: r.title === "Unknown" ? "italic" : "normal",
            }}
          >
            {truncate(r.title === "Unknown" ? "Sin título de revista" : r.title, 44)}
          </Text>
          <View
            style={{
              height: 7,
              width: barW,
              backgroundColor: C.ink100,
              borderRadius: 2,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: (barW * r.count) / max,
                backgroundColor: C.ink900,
              }}
            />
          </View>
          <Text style={{ fontFamily: "Courier", fontSize: 8, color: C.ink500, width: countW, textAlign: "right" }}>
            {r.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LineChartPdf({
  data,
  width = 460,
  height = 140,
  scoreLabel = "SJR",
}: {
  data: YearScorePoint[];
  width?: number;
  height?: number;
  scoreLabel?: string;
}) {
  if (data.length === 0)
    return <Text style={s.muted}>Sin métricas indexadas en el rango.</Text>;
  const pad = { t: 10, r: 10, b: 22, l: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const years = data.map((d) => d.year);
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);
  const scoreMax = Math.max(...data.map((d) => d.avg_score), 0.01) * 1.15;
  const xScale = (y: number) => ((y - yMin) / (yMax - yMin || 1)) * innerW;
  const yScale = (sv: number) => innerH - (sv / scoreMax) * innerH;
  const ticks = [0, scoreMax / 2, scoreMax];
  const pts = data.map((d) => [xScale(d.year), yScale(d.avg_score)] as const);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + `${p[0]} ${p[1]}`).join(" ");
  const area =
    pts.length > 0
      ? `${path} L ${pts[pts.length - 1][0]} ${innerH} L ${pts[0][0]} ${innerH} Z`
      : "";

  return (
    <View>
      <Text style={[s.cardSubtitle, { marginBottom: 6 }]}>
        {scoreLabel} promedio anual (máx {Math.max(...data.map((d) => d.avg_score)).toFixed(3)})
      </Text>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lnfill" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0%" stopColor={C.accent} stopOpacity="0.16" />
            <Stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <G transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((t) => (
            <G key={t}>
              <Line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke={C.ink200} strokeWidth={0.5} />
              <Text x={-6} y={yScale(t) + 2} style={{ fontSize: 7, fill: C.ink400 }}>
                {t.toFixed(2)}
              </Text>
            </G>
          ))}
          <Path d={area} fill="url(#lnfill)" />
          <Path d={path} fill="none" stroke={C.accent} strokeWidth={1.4} />
          {pts.map((p, i) => (
            <Circle key={i} cx={p[0]} cy={p[1]} r={2.2} fill={C.paper} stroke={C.accent} strokeWidth={1.2} />
          ))}
          {yMin !== yMax &&
            [yMin, yMax].map((y) => (
              <Text key={y} x={xScale(y) - 10} y={innerH + 12} style={{ fontSize: 7, fill: C.ink400 }}>
                {String(y)}
              </Text>
            ))}
        </G>
      </Svg>
    </View>
  );
}

/* ============================== DOCUMENT ============================== */

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function formatDate(d: Date): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function Footer({ source, generatedOn }: { source: string; generatedOn: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>
        Fuente de cuartil: {source} · orcid-pubmetrics.innovarium.site
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}  ·  Generado ${generatedOn}`}
      />
    </View>
  );
}

function PublicationRow({ ew, idx }: { ew: EnrichedWork; idx: number }) {
  const m = ew.metric;
  const reason =
    ew.not_found_reason === "no_issn"
      ? "Sin ISSN en OpenAlex"
      : ew.not_found_reason === "not_in_source"
      ? "No presente en SJR"
      : ew.not_found_reason === "incomplete_metadata"
      ? "Metadata incompleta"
      : "";
  const workTypeLabel =
    ew.work.work_type === "book-chapter"
      ? "Capítulo de libro"
      : ew.work.work_type === "article"
      ? "Artículo"
      : ew.work.work_type;

  return (
    <View
      style={[s.tableRow, { backgroundColor: idx % 2 === 0 ? C.paper : C.ink50 }]}
      wrap={false}
    >
      <View style={{ width: 34 }}>
        <Text style={s.tableCell}>{ew.work.pub_year}</Text>
      </View>
      <View style={{ width: 58 }}>
        <Chip q={m?.quartile ?? null} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={s.tableCell}>{truncate(ew.work.title, 120)}</Text>
        <Text style={s.tableMeta}>
          {ew.work.authors.length} autor{ew.work.authors.length !== 1 ? "es" : ""} · {workTypeLabel}
          {m && m.year_rule !== "exact" && ` · año aprox.`}
        </Text>
      </View>
      <View style={{ width: 140, paddingRight: 6 }}>
        <Text style={[s.tableCell, { color: ew.work.journal_title ? C.ink900 : C.ink400, fontStyle: ew.work.journal_title ? "normal" : "italic" }]}>
          {ew.work.journal_title ?? "Sin título de revista"}
        </Text>
        <Text style={s.tableMeta}>{m ? truncate(m.category, 40) : reason}</Text>
      </View>
      <View style={{ width: 40, alignItems: "flex-end" }}>
        <Text style={[s.tableCell, { fontFamily: "Courier", color: m ? C.ink900 : C.ink300 }]}>
          {m ? m.score.toFixed(3) : "—"}
        </Text>
      </View>
    </View>
  );
}

export function AnalysisReport({ result }: { result: AnalysisResult }) {
  const source = result.metrics_source.toUpperCase();
  const generatedOn = formatDate(new Date());
  const t = result.quartile_totals;
  const pct = (n: number) => (result.total_works ? Math.round((n / result.total_works) * 100) + "%" : "0%");
  const indexedPct = result.total_works
    ? Math.round((result.indexed_works / result.total_works) * 100) + "%"
    : "0%";
  const headerTitle = result.researcher_name ?? result.orcid;

  const sortedWorks = [...result.works].sort(
    (a, b) => b.work.pub_year - a.work.pub_year || a.work.title.localeCompare(b.work.title),
  );

  return (
    <Document
      title={`Informe bibliométrico — ${headerTitle}`}
      author="orcid-pubmetrics (Innovarium)"
      subject={`Análisis ORCID ${result.orcid}, ${result.start_year}–${result.end_year}`}
    >
      {/* Page 1 — Portada + resumen + gráficos principales */}
      <Page size="A4" style={s.page}>
        <View style={s.headerStrip}>
          <Text style={s.tiny}>orcid-pubmetrics · Informe bibliométrico</Text>
          <Text style={s.tiny}>Fuente {source} 2024 · Generado {generatedOn}</Text>
        </View>

        <Text style={s.hero}>{headerTitle}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 2 }}>
          <Text style={s.orcidChip}>{result.orcid}</Text>
          {result.affiliation && <Text style={s.metaItem}>· {result.affiliation}</Text>}
          <Text style={s.metaItem}>· Rango {result.start_year}–{result.end_year}</Text>
        </View>

        <Text style={s.h3} >Resumen ejecutivo</Text>
        <Text style={[s.body, { marginBottom: 6 }]}>
          El investigador registra <Text style={{ fontWeight: 600 }}>{result.total_works}</Text>{" "}
          publicaciones en el rango {result.start_year}–{result.end_year}, de las cuales{" "}
          <Text style={{ fontWeight: 600 }}>{result.indexed_works}</Text> están indexadas en {source} ({indexedPct}).
          Distribución: Q1={t.q1} ({pct(t.q1)}) · Q2={t.q2} ({pct(t.q2)}) · Q3={t.q3} ({pct(t.q3)}) · Q4={t.q4} ({pct(t.q4)}) · Sin indexar={t.unindexed} ({pct(t.unindexed)}).
        </Text>

        <View style={s.kpiGrid}>
          <KpiCard label="TOTAL" value={result.total_works} hint={`${result.end_year - result.start_year + 1} años`} />
          <KpiCard label={`IDX ${source}`} value={result.indexed_works} hint={indexedPct} />
          <KpiCard label="Q1" tone="q1" value={t.q1} hint={pct(t.q1)} />
          <KpiCard label="Q2" tone="q2" value={t.q2} hint={pct(t.q2)} />
          <KpiCard label="Q3" tone="q3" value={t.q3} hint={pct(t.q3)} />
          <KpiCard label="Q4" tone="q4" value={t.q4} hint={pct(t.q4)} />
          <KpiCard label="SIN IDX" tone="none" value={t.unindexed} hint={pct(t.unindexed)} />
        </View>

        <Text style={s.disclaimer}>
          Cuartiles calculados con {source} (Scimago/Scopus); pueden diferir en una Q respecto a JCR. Las
          publicaciones sin ISSN o sobre revistas no indexadas en {source} quedan marcadas abajo con su
          razón específica (campo «motivo» en la tabla de publicaciones).
        </Text>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>Publicaciones por año</Text>
          <Text style={s.cardSubtitle}>Apiladas por cuartil {source}</Text>
          <View style={s.legendRow}>
            {[
              { k: "Q1", c: C.q1 },
              { k: "Q2", c: C.q2 },
              { k: "Q3", c: C.q3 },
              { k: "Q4", c: C.q4 },
              { k: "Sin indexar", c: C.qn },
            ].map((it) => (
              <View key={it.k} style={s.legendItem}>
                <View style={[s.legendSwatch, { backgroundColor: it.c }]} />
                <Text>{it.k}</Text>
              </View>
            ))}
          </View>
          <StackedBarPdf data={result.by_year_quartile} width={508} height={170} />
        </View>

        <Footer source={`${source} 2024`} generatedOn={generatedOn} />
      </Page>

      {/* Page 2 — distribución + top revistas + evolución */}
      <Page size="A4" style={s.page}>
        <View style={s.headerStrip}>
          <Text style={s.tiny}>{headerTitle} · {result.orcid}</Text>
          <Text style={s.tiny}>Rango {result.start_year}–{result.end_year}</Text>
        </View>

        <View style={[s.card]} wrap={false}>
          <Text style={s.cardTitle}>Distribución por cuartil</Text>
          <Text style={s.cardSubtitle}>
            {result.total_works} trabajos · {result.start_year}–{result.end_year}
          </Text>
          <DoughnutPdf totals={result.quartile_totals} size={130} />
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>Revistas más frecuentes</Text>
          <Text style={s.cardSubtitle}>Top 10 por número de publicaciones</Text>
          <HBarPdf rows={result.top_journals.slice(0, 10)} width={508} />
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>Evolución del {source} promedio</Text>
          <Text style={s.cardSubtitle}>Score por año con publicaciones indexadas</Text>
          <LineChartPdf data={result.score_evolution} width={508} height={150} scoreLabel={source} />
        </View>

        <Footer source={`${source} 2024`} generatedOn={generatedOn} />
      </Page>

      {/* Pages 3+ — publicaciones */}
      <Page size="A4" style={s.page}>
        <View style={s.headerStrip}>
          <Text style={s.tiny}>{headerTitle} · Publicaciones ({sortedWorks.length})</Text>
          <Text style={s.tiny}>Click en el DOI para abrir en doi.org</Text>
        </View>

        <Text style={s.h2}>Publicaciones</Text>
        <View style={s.table}>
          <View style={s.tableHead} fixed>
            <View style={{ width: 34 }}>
              <Text style={s.tableHeadCell}>Año</Text>
            </View>
            <View style={{ width: 58 }}>
              <Text style={s.tableHeadCell}>Cuartil</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tableHeadCell}>Título · Motivo</Text>
            </View>
            <View style={{ width: 140 }}>
              <Text style={s.tableHeadCell}>Revista · Categoría</Text>
            </View>
            <View style={{ width: 40, alignItems: "flex-end" }}>
              <Text style={s.tableHeadCell}>{source}</Text>
            </View>
          </View>
          {sortedWorks.map((w, i) => (
            <PublicationRow key={w.work.openalex_id ?? w.work.doi ?? i} ew={w} idx={i} />
          ))}
        </View>

        <Footer source={`${source} 2024`} generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

export async function downloadPdfReport(result: AnalysisResult): Promise<void> {
  const blob = await pdf(<AnalysisReport result={result} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orcid-${result.orcid}-${result.start_year}-${result.end_year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
