import { FormEvent, useState } from "react";
import { Btn, Icon } from "../../components/primitives";
import type { AnalysisRequest } from "../../types";

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  initialOrcid?: string;
  loading: boolean;
  onSubmit: (req: AnalysisRequest) => void;
}

export function AnalysisForm({ initialOrcid, loading, onSubmit }: Props) {
  const [orcid, setOrcid] = useState(initialOrcid ?? "");
  const [from, setFrom] = useState("2010");
  const [to, setTo] = useState(String(CURRENT_YEAR));
  const [err, setErr] = useState<string | null>(null);

  const validate = (): string | null => {
    const trimmed = orcid.trim();
    if (!ORCID_RE.test(trimmed)) return "Formato ORCID inválido. Debe ser 0000-0000-0000-0000.";
    const f = Number(from),
      t = Number(to);
    if (!Number.isInteger(f) || !Number.isInteger(t)) return "Los años deben ser enteros.";
    if (f > t) return "El año inicial no puede ser mayor al final.";
    if (f < 1900 || t > 2100) return "Rango de años fuera de límites razonables.";
    return null;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    onSubmit({ orcid: orcid.trim(), start_year: Number(from), end_year: Number(to) });
  };

  return (
    <div className="container-md">
      <div style={{ marginBottom: 44 }}>
        <div className="t-tiny" style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--q1)" }}>●</span> Fuente activa · SJR 2024
        </div>
        <h1 className="t-hero" style={{ margin: 0, maxWidth: 620 }}>
          Análisis bibliométrico por{" "}
          <em style={{ fontStyle: "italic", color: "var(--ink-700)" }}>ORCID</em>, cuartil y comité editorial.
        </h1>
        <p
          className="t-body op-muted"
          style={{ marginTop: 14, maxWidth: 560, fontSize: 15, lineHeight: 1.55 }}
        >
          Ingresa un identificador ORCID y un rango de años. Verás sus publicaciones indexadas
          agrupadas por cuartil SJR, evolución del score promedio y la lista completa de trabajos
          con trazabilidad por categoría.
        </p>
      </div>

      <form className="op-card" onSubmit={submit} style={{ padding: 24 }} aria-label="Formulario de análisis">
        <div className="form-row">
          <div className="op-field">
            <label className="op-label" htmlFor="orcid">
              ORCID
            </label>
            <input
              id="orcid"
              className="op-input op-input--mono"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0001-2345-6789"
              aria-invalid={!!err}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div className="op-field">
            <label className="op-label" htmlFor="from">
              Desde
            </label>
            <input
              id="from"
              className="op-input op-input--mono"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="op-field">
            <label className="op-label" htmlFor="to">
              Hasta
            </label>
            <input
              id="to"
              className="op-input op-input--mono"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <Btn variant="primary" size="lg" type="submit" disabled={loading} iconRight={Icon.arrowRight()}>
            {loading ? "Analizando…" : "Analizar"}
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

      <div
        style={{
          marginTop: 14,
          padding: "12px 16px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--ink-200)",
          background: "var(--paper)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          fontSize: 12.5,
          color: "var(--ink-500)",
          lineHeight: 1.5,
        }}
      >
        <span style={{ marginTop: 2, color: "var(--ink-400)" }}>{Icon.info()}</span>
        <div style={{ flex: 1 }}>
          Los cuartiles mostrados provienen de{" "}
          <strong style={{ color: "var(--ink-700)" }}>Scimago Journal Rank (SJR)</strong>, no de
          JCR/Clarivate. Solo se analizan publicaciones públicas indexadas en OpenAlex.
        </div>
      </div>
    </div>
  );
}
