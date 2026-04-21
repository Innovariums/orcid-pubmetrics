import { useEffect, useState } from "react";
import { Icon } from "../../components/primitives";

interface Step {
  k: string;
  label: string;
  meta?: string;
  done?: boolean;
  active?: boolean;
}

const STAGES: Step[] = [
  { k: "orcid", label: "Verificando ORCID" },
  { k: "pubs", label: "Obteniendo publicaciones desde OpenAlex" },
  { k: "sjr", label: "Resolviendo cuartiles SJR por ISSN" },
  { k: "aggr", label: "Calculando agregados y series temporales" },
  { k: "render", label: "Generando gráficos" },
];

/**
 * Muestra el progreso simulado durante la llamada síncrona al backend.
 * El backend aún no envía progreso real, así que simulamos avance cada ~1.5s.
 */
export function LoadingView({ orcid, range }: { orcid: string; range: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, STAGES.length - 1)), 1500);
    return () => clearInterval(t);
  }, []);

  const steps = STAGES.map((s, i) => ({
    ...s,
    done: i < idx,
    active: i === idx,
  }));

  return (
    <div className="container-lg" style={{ paddingTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
          fontSize: 13,
          color: "var(--ink-500)",
          flexWrap: "wrap",
        }}
      >
        <span>Análisis</span>
        <span style={{ color: "var(--ink-300)" }}>/</span>
        <span className="mono" style={{ color: "var(--ink-700)" }}>
          {orcid}
        </span>
        <span style={{ color: "var(--ink-300)" }}>/</span>
        <span>{range}</span>
      </div>

      <div className="loading-grid">
        <div className="op-card" style={{ padding: 22, position: "sticky", top: 24 }}>
          <div className="t-h3" style={{ marginBottom: 6 }}>
            Procesando
          </div>
          <div className="t-small" style={{ marginBottom: 20 }}>
            Puede tardar 5–30 segundos según el volumen de publicaciones.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {steps.map((s, i) => (
              <StepItem key={s.k} step={s} index={i + 1} />
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              padding: 12,
              background: "var(--ink-50)",
              borderRadius: "var(--r-sm)",
              fontSize: 12,
              color: "var(--ink-500)",
              lineHeight: 1.5,
            }}
          >
            Las publicaciones sin ISSN no tendrán cuartil resoluble y aparecerán marcadas como tal
            en los resultados.
          </div>
        </div>

        <SkeletonResults />
      </div>
    </div>
  );
}

function StepItem({ step, index }: { step: Step; index: number }) {
  const bg = step.done
    ? "var(--q1)"
    : step.active
    ? "var(--ink-900)"
    : "var(--ink-100)";
  const fg = step.done || step.active ? "#fff" : "var(--ink-400)";
  const labelColor = step.active
    ? "var(--ink-900)"
    : step.done
    ? "var(--ink-700)"
    : "var(--ink-400)";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: fg,
          marginTop: 1,
        }}
      >
        {step.done ? (
          Icon.check(11)
        ) : step.active ? (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "#fff",
              animation: "op-pulse 1s ease-in-out infinite",
            }}
          />
        ) : (
          <span style={{ fontSize: 11, fontFamily: "var(--f-mono)" }}>{index}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            color: labelColor,
            fontWeight: step.active ? 500 : 400,
          }}
        >
          {step.label}
        </div>
        {step.meta && (
          <div
            className="mono t-small"
            style={{
              fontSize: 11.5,
              marginTop: 2,
              color: step.active ? "var(--accent)" : "var(--ink-500)",
            }}
          >
            {step.meta}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonResults() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="op-card" style={{ padding: 16 }}>
            <div className="op-skel" style={{ width: 40, height: 10, marginBottom: 14 }} />
            <div className="op-skel" style={{ width: 48, height: 28 }} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 20,
        }}
      >
        <div className="op-card" style={{ padding: 18, height: 320 }}>
          <div className="op-skel" style={{ width: 180, height: 14, marginBottom: 20 }} />
          <div className="op-skel" style={{ width: "100%", height: 220 }} />
        </div>
        <div className="op-card" style={{ padding: 18, height: 320 }}>
          <div className="op-skel" style={{ width: 140, height: 14, marginBottom: 20 }} />
          <div
            className="op-skel"
            style={{ width: 180, height: 180, borderRadius: "50%", margin: "0 auto" }}
          />
        </div>
      </div>
      <div className="op-card" style={{ padding: 18, height: 200 }}>
        <div className="op-skel" style={{ width: 160, height: 14, marginBottom: 20 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="op-skel" style={{ width: `${90 - i * 12}%`, height: 10, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );
}
