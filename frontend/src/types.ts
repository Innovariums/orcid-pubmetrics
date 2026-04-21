// TS mirror del modelo Pydantic del backend (app.domain.models).
// Mantener en sync si cambia el dominio.

export type Quartile = "Q1" | "Q2" | "Q3" | "Q4";
export type MetricsSource = "sjr" | "jcr";
export type YearRule = "exact" | "fallback-1" | "fallback+1" | "fallback-any";
export type NotFoundReason = "no_issn" | "not_in_source" | "incomplete_metadata";

export interface JournalMetric {
  issn: string;
  year: number;
  source: MetricsSource;
  score: number;
  score_label: string;
  quartile: Quartile;
  category: string;
  category_rank: number | null;
  category_total: number | null;
  year_rule: YearRule;
}

export interface Author {
  name: string;
  orcid: string | null;
}

export interface Work {
  orcid: string;
  doi: string | null;
  title: string;
  journal_title: string | null;
  issn: string | null;
  eissn: string | null;
  pub_year: number;
  work_type: string;
  authors: Author[];
  openalex_id: string | null;
}

export interface EnrichedWork {
  work: Work;
  metric: JournalMetric | null;
  all_metrics: JournalMetric[];
  not_found_reason: NotFoundReason | null;
}

export interface YearQuartileBucket {
  year: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  unindexed: number;
}

export interface QuartileTotals {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  unindexed: number;
}

export interface YearScorePoint {
  year: number;
  avg_score: number;
  count: number;
}

export interface TopJournal {
  title: string;
  issn: string | null;
  count: number;
}

export interface AnalysisResult {
  orcid: string;
  researcher_name: string | null;
  affiliation: string | null;
  start_year: number;
  end_year: number;
  metrics_source: MetricsSource;
  total_works: number;
  indexed_works: number;
  quartile_totals: QuartileTotals;
  by_year_quartile: YearQuartileBucket[];
  score_evolution: YearScorePoint[];
  top_journals: TopJournal[];
  works: EnrichedWork[];
}

export interface AnalysisRequest {
  orcid: string;
  start_year: number;
  end_year: number;
}

/* --- Fase 2: comparación --- */

export interface ResearcherSummary {
  orcid: string;
  researcher_name: string | null;
  total_works: number;
  indexed_works: number;
  quartile_totals: QuartileTotals;
}

export interface JournalOverlap {
  issn: string | null;
  journal_title: string;
  best_quartile: Quartile | null;
  pubs_by_orcid: Record<string, number>;
  has_editorial_conflict: boolean;
  editors_orcids: string[];
}

export interface Coauthorship {
  /** Subconjunto del grupo comparado que co-autora el work. */
  orcids: string[];
  /** EnrichedWork completo para poder reutilizar el drawer de detalle. */
  work: EnrichedWork;
}

export interface EditorialCrossRef {
  publisher_orcid: string;
  editor_orcid: string;
  issn: string | null;
  journal_title: string;
  editor_role: string;
  pub_count: number;
}

export interface ComparisonResult {
  orcids: string[];
  start_year: number;
  end_year: number;
  metrics_source: MetricsSource;
  editorial_source: string | null;
  researchers: ResearcherSummary[];
  journal_overlap: JournalOverlap[];
  coauthorships: Coauthorship[];
  editorial_cross: EditorialCrossRef[];
}

export interface ComparisonRequest {
  orcids: string[];
  start_year: number;
  end_year: number;
}

// Paleta consistente para toda la UI
export const QUARTILE_COLORS: Record<Quartile | "unindexed", string> = {
  Q1: "#22c55e", // verde
  Q2: "#3b82f6", // azul
  Q3: "#eab308", // amarillo
  Q4: "#ef4444", // rojo
  unindexed: "#94a3b8", // gris
};

export const QUARTILE_LABELS: Record<Quartile | "unindexed", string> = {
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
  unindexed: "Sin indexar",
};
