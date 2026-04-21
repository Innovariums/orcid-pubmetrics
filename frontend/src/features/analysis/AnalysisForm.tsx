import { FormEvent, useState } from "react";
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
  const [startYear, setStartYear] = useState("2010");
  const [endYear, setEndYear] = useState(String(CURRENT_YEAR));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = orcid.trim();
    if (!ORCID_RE.test(trimmed)) {
      setError("ORCID inválido. Formato: 0000-0000-0000-0000");
      return;
    }
    const s = Number(startYear);
    const eY = Number(endYear);
    if (!Number.isInteger(s) || !Number.isInteger(eY) || s > eY) {
      setError("Rango de años inválido.");
      return;
    }
    setError(null);
    onSubmit({ orcid: trimmed, start_year: s, end_year: eY });
  };

  return (
    <form className="card" onSubmit={handleSubmit} aria-label="Formulario de análisis">
      <h2>Analizar un investigador</h2>
      <div className="form-row">
        <div className="field">
          <label htmlFor="orcid">ORCID</label>
          <input
            id="orcid"
            type="text"
            placeholder="0000-0002-0170-462X"
            value={orcid}
            onChange={(e) => setOrcid(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label htmlFor="start-year">Desde</label>
          <input
            id="start-year"
            type="number"
            min="1900"
            max="2100"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="end-year">Hasta</label>
          <input
            id="end-year"
            type="number"
            min="1900"
            max="2100"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Analizando…" : "Analizar"}
        </button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
    </form>
  );
}
