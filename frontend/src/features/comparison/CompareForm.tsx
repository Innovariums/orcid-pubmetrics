import { FormEvent, useState } from "react";
import { Btn, Icon } from "../../components/primitives";
import type { ComparisonRequest } from "../../types";

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const CURRENT_YEAR = new Date().getFullYear();
const MAX_ORCIDS = 5;

interface Props {
  loading: boolean;
  onSubmit: (req: ComparisonRequest) => void;
}

export function CompareForm({ loading, onSubmit }: Props) {
  const [orcids, setOrcids] = useState<string[]>(["", ""]);
  const [from, setFrom] = useState("2010");
  const [to, setTo] = useState(String(CURRENT_YEAR));
  const [err, setErr] = useState<string | null>(null);

  const setOrcid = (i: number, v: string) =>
    setOrcids((cur) => cur.map((o, idx) => (idx === i ? v : o)));
  const addOrcid = () =>
    orcids.length < MAX_ORCIDS && setOrcids((cur) => [...cur, ""]);
  const removeOrcid = (i: number) =>
    orcids.length > 2 && setOrcids((cur) => cur.filter((_, idx) => idx !== i));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = orcids.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      setErr("Ingresa al menos 2 ORCIDs para comparar.");
      return;
    }
    for (const o of cleaned) {
      if (!ORCID_RE.test(o)) {
        setErr(`Formato ORCID inválido: ${o}`);
        return;
      }
    }
    if (new Set(cleaned).size !== cleaned.length) {
      setErr("Hay ORCIDs duplicados en la lista.");
      return;
    }
    const f = Number(from),
      t = Number(to);
    if (!Number.isInteger(f) || !Number.isInteger(t) || f > t) {
      setErr("Rango de años inválido.");
      return;
    }
    setErr(null);
    onSubmit({ orcids: cleaned, start_year: f, end_year: t });
  };

  return (
    <div className="container-md">
      <div style={{ marginBottom: 36 }}>
        <div className="t-tiny" style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>●</span> Fase 2 · Comparación entre investigadores
        </div>
        <h1 className="t-hero" style={{ margin: 0, maxWidth: 640 }}>
          Compara <em style={{ fontStyle: "italic", color: "var(--ink-700)" }}>2–5 ORCIDs</em> y detecta solapamientos de publicación y comité editorial.
        </h1>
        <p className="t-body op-muted" style={{ marginTop: 14, maxWidth: 600, fontSize: 15, lineHeight: 1.55 }}>
          Revistas donde publican varios del grupo, coautorías directas y
          cruces con comités editoriales (dataset Open Editors) — presentado
          como datos, sin juicios.
        </p>
      </div>

      <form className="op-card" onSubmit={submit} style={{ padding: 24 }} aria-label="Formulario de comparación">
        <div className="op-field" style={{ marginBottom: 14 }}>
          <label className="op-label">ORCIDs</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orcids.map((v, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  className="op-input op-input--mono"
                  value={v}
                  onChange={(e) => setOrcid(i, e.target.value)}
                  placeholder={`0000-0000-0000-000${i}`}
                  spellCheck={false}
                  autoComplete="off"
                />
                {orcids.length > 2 && (
                  <button
                    type="button"
                    className="op-btn op-btn--ghost op-btn--sm"
                    onClick={() => removeOrcid(i)}
                    aria-label={`Quitar ORCID ${i + 1}`}
                  >
                    {Icon.close()}
                  </button>
                )}
              </div>
            ))}
            {orcids.length < MAX_ORCIDS && (
              <button
                type="button"
                className="op-btn op-btn--ghost op-btn--sm"
                onClick={addOrcid}
                style={{ alignSelf: "flex-start" }}
              >
                {Icon.plus()} Añadir ORCID
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, alignItems: "end" }}>
          <div className="op-field">
            <label className="op-label" htmlFor="from-c">Desde</label>
            <input id="from-c" className="op-input op-input--mono" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="op-field">
            <label className="op-label" htmlFor="to-c">Hasta</label>
            <input id="to-c" className="op-input op-input--mono" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Btn variant="primary" size="lg" type="submit" disabled={loading} iconRight={Icon.arrowRight()}>
            {loading ? "Comparando…" : "Comparar"}
          </Btn>
        </div>

        {err && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--q4-tint)",
              borderRadius: "var(--r-sm)",
              color: "#8B241C",
              fontSize: 13,
            }}
          >
            {err}
          </div>
        )}
      </form>
    </div>
  );
}

export const TONES = ["#1F4FD1", "#A24BD9", "#D18A1F", "#0B7A6A", "#C8372D"];
