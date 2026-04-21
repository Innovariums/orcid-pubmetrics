import { useState, CSSProperties, ReactNode } from "react";
import { useMeasure } from "../hooks/useMeasure";
import type { QuartileTotals, TopJournal, YearQuartileBucket, YearScorePoint } from "../types";

export const CHART_COLORS = {
  q1: "#1F9D55",
  q2: "#2663E4",
  q3: "#D4A017",
  q4: "#C8372D",
  unindexed: "#7E8795",
  grid: "#E4E7EC",
  axis: "#8A94A6",
  accent: "#1F4FD1",
} as const;

type Layer = "q1" | "q2" | "q3" | "q4" | "unindexed";
const LAYERS: Layer[] = ["q1", "q2", "q3", "q4", "unindexed"];

/* Wrapper que mide el ancho del contenedor y pasa al child */
function Responsive({
  height,
  children,
  minHeight,
}: {
  height: number;
  children: (w: number) => ReactNode;
  minHeight?: number;
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="op-chart-wrap"
      style={{ height, minHeight: minHeight ?? height, position: "relative" }}
    >
      {width > 0 ? children(width) : null}
    </div>
  );
}

/* Stacked bar: publicaciones por año × cuartil */
export function StackedBarChart({ data, height = 260 }: { data: YearQuartileBucket[]; height?: number }) {
  return (
    <Responsive height={height}>
      {(width) => <StackedBarCore data={data} width={width} height={height} />}
    </Responsive>
  );
}

function StackedBarCore({
  data,
  width,
  height,
}: {
  data: YearQuartileBucket[];
  width: number;
  height: number;
}) {
  const pad = { t: 16, r: 12, b: 28, l: 28 };
  const innerW = Math.max(width - pad.l - pad.r, 1);
  const innerH = Math.max(height - pad.t - pad.b, 1);
  const nonZero = data.filter((d) => d.q1 + d.q2 + d.q3 + d.q4 + d.unindexed > 0);
  const years = nonZero.length ? nonZero : data;
  const maxTotal = Math.max(...years.map((d) => d.q1 + d.q2 + d.q3 + d.q4 + d.unindexed), 3);
  const step = innerW / years.length;
  const barW = Math.min(step * 0.65, 28);
  const ticks = [0, Math.ceil(maxTotal / 2), maxTotal];
  const yScale = (v: number) => innerH - (v / maxTotal) * innerH;
  const [hover, setHover] = useState<{ d: YearQuartileBucket; cx: number } | null>(null);

  return (
    <>
      <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
        <g transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke={CHART_COLORS.grid} />
              <text
                x={-8}
                y={yScale(t) + 3}
                textAnchor="end"
                fontSize="10.5"
                fill={CHART_COLORS.axis}
                fontFamily="var(--f-mono)"
              >
                {t}
              </text>
            </g>
          ))}
          {years.map((d, i) => {
            let cum = 0;
            const cx = i * step + step / 2;
            const tickEvery = Math.max(1, Math.ceil(years.length / 9));
            return (
              <g
                key={d.year}
                transform={`translate(${cx - barW / 2},0)`}
                onMouseEnter={() => setHover({ d, cx: cx + pad.l })}
                onMouseLeave={() => setHover(null)}
              >
                <rect x={0} y={0} width={barW} height={innerH} fill="transparent" />
                {LAYERS.map((l) => {
                  const v = d[l];
                  if (!v) return null;
                  const h = (v / maxTotal) * innerH;
                  const y = innerH - h - (cum / maxTotal) * innerH;
                  cum += v;
                  return <rect key={l} x={0} y={y} width={barW} height={h} fill={CHART_COLORS[l]} rx={1} />;
                })}
                {(i === 0 || i === years.length - 1 || i % tickEvery === 0) && (
                  <text
                    x={barW / 2}
                    y={innerH + 16}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill={CHART_COLORS.axis}
                    fontFamily="var(--f-mono)"
                  >
                    {d.year}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {hover && (
        <div
          className="op-tt"
          style={{
            position: "absolute",
            left: hover.cx,
            top: pad.t - 8,
            transform: "translate(-50%,-100%)",
            pointerEvents: "none",
            minWidth: 150,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{hover.d.year}</div>
          {LAYERS.map((l) =>
            hover.d[l] ? (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ opacity: 0.8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: CHART_COLORS[l],
                      marginRight: 6,
                    }}
                  />
                  {l === "unindexed" ? "Sin indexar" : l.toUpperCase()}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{hover.d[l]}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </>
  );
}

/* Doughnut */
export function DoughnutChart({ totals, size = 200 }: { totals: QuartileTotals; size?: number }) {
  const data = (
    [
      { k: "q1", v: totals.q1, c: CHART_COLORS.q1, l: "Q1" },
      { k: "q2", v: totals.q2, c: CHART_COLORS.q2, l: "Q2" },
      { k: "q3", v: totals.q3, c: CHART_COLORS.q3, l: "Q3" },
      { k: "q4", v: totals.q4, c: CHART_COLORS.q4, l: "Q4" },
      { k: "unindexed", v: totals.unindexed, c: CHART_COLORS.unindexed, l: "Sin indexar" },
    ] as const
  ).filter((d) => d.v > 0);

  const total = data.reduce((a, d) => a + d.v, 0);
  const r = size / 2 - 2;
  const rInner = r * 0.62;
  const cx = size / 2,
    cy = size / 2;
  let cum = 0;
  const [hover, setHover] = useState<string | null>(null);

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

  const emptyMsg: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--ink-400)",
    fontSize: 13,
    height: size,
  };
  if (total === 0) return <div style={emptyMsg}>Sin datos</div>;

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size}>
        {arcs.map((a) => (
          <path
            key={a.k}
            d={a.path}
            fill={a.c}
            opacity={hover && hover !== a.k ? 0.35 : 1}
            onMouseEnter={() => setHover(a.k)}
            onMouseLeave={() => setHover(null)}
            style={{ transition: "opacity .12s", cursor: "pointer" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="var(--f-serif)" fontSize="28" fill="var(--ink-900)">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--ink-500)" letterSpacing="1">
          PUBLICACIONES
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
        {arcs.map((a) => (
          <div
            key={a.k}
            style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}
            onMouseEnter={() => setHover(a.k)}
            onMouseLeave={() => setHover(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 2, background: a.c }} />
            <span style={{ flex: 1 }}>{a.l}</span>
            <span className="mono" style={{ color: "var(--ink-500)", fontSize: 12 }}>
              {a.v} · {a.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Horizontal bars — top journals */
export function HBarChart({ rows }: { rows: TopJournal[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(140px, 1fr) minmax(60px, 2fr) 28px",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
          }}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--ink-700)",
            }}
            title={r.title}
          >
            {r.title === "Unknown" ? (
              <span style={{ color: "var(--ink-400)", fontStyle: "italic" }}>Sin título de revista</span>
            ) : (
              r.title
            )}
          </div>
          <div
            style={{
              height: 10,
              background: "var(--ink-100)",
              borderRadius: 2,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(r.count / max) * 100}%`,
                height: "100%",
                background: "var(--ink-900)",
                borderRadius: 2,
                transition: "width .4s",
              }}
            />
          </div>
          <div className="mono" style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>
            {r.count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Line chart — evolución SJR/JIF */
export function LineChart({
  data,
  height = 210,
  scoreLabel = "SJR",
}: {
  data: YearScorePoint[];
  height?: number;
  scoreLabel?: string;
}) {
  return (
    <Responsive height={height}>
      {(w) => <LineCore data={data} width={w} height={height} scoreLabel={scoreLabel} />}
    </Responsive>
  );
}

function LineCore({
  data,
  width,
  height,
  scoreLabel,
}: {
  data: YearScorePoint[];
  width: number;
  height: number;
  scoreLabel: string;
}) {
  const pad = { t: 16, r: 16, b: 28, l: 36 };
  const innerW = Math.max(width - pad.l - pad.r, 1);
  const innerH = Math.max(height - pad.t - pad.b, 1);
  const [hover, setHover] = useState<{ d: YearScorePoint; p: [number, number] } | null>(null);

  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)", fontSize: 13 }}>
        Sin métricas indexadas en el rango
      </div>
    );
  }

  const years = data.map((d) => d.year);
  const yMin = Math.floor(Math.min(...years));
  const yMax = Math.ceil(Math.max(...years));
  const scoreMax = Math.max(...data.map((d) => d.avg_score), 0.01) * 1.15;
  const xScale = (y: number) => ((y - yMin) / (yMax - yMin || 1)) * innerW;
  const yScale = (s: number) => innerH - (s / scoreMax) * innerH;
  const ticks = [0, scoreMax / 2, scoreMax];
  const pts: [number, number][] = data.map((d) => [xScale(d.year), yScale(d.avg_score)]);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ");
  const area =
    pts.length > 0
      ? `${path} L ${pts[pts.length - 1][0]} ${innerH} L ${pts[0][0]} ${innerH} Z`
      : "";

  return (
    <>
      <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="lnfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity="0.16" />
            <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke={CHART_COLORS.grid} />
              <text
                x={-8}
                y={yScale(t) + 3}
                textAnchor="end"
                fontSize="10.5"
                fill={CHART_COLORS.axis}
                fontFamily="var(--f-mono)"
              >
                {t.toFixed(2)}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#lnfill)" />
          <path
            d={path}
            fill="none"
            stroke={CHART_COLORS.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() =>
                setHover({ d: data[i], p: [p[0] + pad.l, p[1] + pad.t] })
              }
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={p[0]} cy={p[1]} r={10} fill="transparent" />
              <circle cx={p[0]} cy={p[1]} r={3.5} fill="#fff" stroke={CHART_COLORS.accent} strokeWidth="1.6" />
            </g>
          ))}
          {yMin !== yMax &&
            [yMin, yMax].map((y) => (
              <text
                key={y}
                x={xScale(y)}
                y={innerH + 16}
                textAnchor="middle"
                fontSize="10.5"
                fill={CHART_COLORS.axis}
                fontFamily="var(--f-mono)"
              >
                {y}
              </text>
            ))}
        </g>
      </svg>
      {hover && (
        <div
          className="op-tt"
          style={{
            position: "absolute",
            left: hover.p[0],
            top: hover.p[1] - 6,
            transform: "translate(-50%,-100%)",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600 }}>{hover.d.year}</div>
          <div>
            {scoreLabel} prom. <strong>{hover.d.avg_score.toFixed(3)}</strong>
          </div>
          <div style={{ opacity: 0.7 }}>{hover.d.count} pub.</div>
        </div>
      )}
    </>
  );
}
