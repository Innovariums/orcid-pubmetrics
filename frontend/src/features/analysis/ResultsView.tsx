import type { AnalysisResult } from "../../types";
import { QuartileTotalsChart } from "./QuartileTotalsChart";
import { QuartileYearChart } from "./QuartileYearChart";
import { PublicationsTable } from "./PublicationsTable";
import { ScoreEvolutionChart } from "./ScoreEvolutionChart";
import { TopJournalsChart } from "./TopJournalsChart";
import { downloadCsv } from "./exportCsv";

export function ResultsView({ result }: { result: AnalysisResult }) {
  const t = result.quartile_totals;
  const source = result.metrics_source.toUpperCase();

  return (
    <>
      <div className="toolbar">
        <div>
          <span className="source-badge">Fuente: {source}</span>{" "}
          <span style={{ color: "var(--muted)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
            ORCID {result.orcid} · {result.start_year}–{result.end_year}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={() => downloadCsv(result)}>
          Exportar CSV
        </button>
      </div>

      <div className="summary" role="region" aria-label="Resumen">
        <div className="stat">
          <div className="value">{result.total_works}</div>
          <span className="label">Total</span>
        </div>
        <div className="stat">
          <div className="value">{result.indexed_works}</div>
          <span className="label">Indexadas</span>
        </div>
        <div className="stat q1">
          <div className="value">{t.q1}</div>
          <span className="label">Q1</span>
        </div>
        <div className="stat q2">
          <div className="value">{t.q2}</div>
          <span className="label">Q2</span>
        </div>
        <div className="stat q3">
          <div className="value">{t.q3}</div>
          <span className="label">Q3</span>
        </div>
        <div className="stat q4">
          <div className="value">{t.q4}</div>
          <span className="label">Q4</span>
        </div>
        <div className="stat unindexed">
          <div className="value">{t.unindexed}</div>
          <span className="label">Sin indexar</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2>Publicaciones por año y cuartil</h2>
          <div className="chart-box">
            <QuartileYearChart result={result} />
          </div>
        </div>
        <div className="card">
          <h2>Distribución por cuartil</h2>
          <div className="chart-box">
            <QuartileTotalsChart result={result} />
          </div>
        </div>
      </div>

      <div className="charts-grid-secondary">
        <div className="card">
          <h2>Top revistas</h2>
          <div className="chart-box">
            <TopJournalsChart result={result} />
          </div>
        </div>
        <div className="card">
          <h2>Evolución del {source} promedio</h2>
          <div className="chart-box">
            <ScoreEvolutionChart result={result} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Publicaciones</h2>
        <PublicationsTable result={result} />
      </div>
    </>
  );
}
