import { useState } from "react";
import { api, ApiError } from "./api/client";
import { AnalysisForm } from "./features/analysis/AnalysisForm";
import "./features/analysis/chartSetup";
import { ResultsView } from "./features/analysis/ResultsView";
import type { AnalysisRequest, AnalysisResult } from "./types";

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (req: AnalysisRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.analyze(req);
      setResult(r);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.status}: ${e.detail}`);
      } else {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>orcid-pubmetrics</h1>
          <div className="subtitle">
            Análisis bibliométrico por ORCID · cuartil, revistas, evolución
          </div>
        </div>
      </header>

      <AnalysisForm
        initialOrcid="0000-0002-0170-462X"
        loading={loading}
        onSubmit={handleSubmit}
      />

      {error && (
        <div className="error" role="alert">
          Error al analizar: {error}
        </div>
      )}

      {loading && <div className="loading">Consultando OpenAlex y resolviendo cuartil SJR…</div>}

      {result && (
        <div style={{ marginTop: "1.5rem" }}>
          <ResultsView result={result} />
        </div>
      )}
    </main>
  );
}
