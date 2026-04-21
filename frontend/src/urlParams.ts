/**
 * Serialización bidireccional entre el estado de la app y la URL.
 *
 * Patrones de URL:
 *   /?tab=analysis&orcid=0000-0002-0170-462X&from=2010&to=2026
 *   /?tab=compare&orcids=0000-...,0000-...&from=2010&to=2026
 *
 * Compartir un resultado = copiar window.location.href. Al abrir la URL
 * el formulario se pre-llena y la consulta se ejecuta automáticamente.
 */

export type Tab = "analysis" | "compare";

export interface AnalysisUrlState {
  orcid: string;
  from: number;
  to: number;
}

export interface CompareUrlState {
  orcids: string[];
  from: number;
  to: number;
}

export interface AppUrlState {
  tab: Tab;
  analysis: AnalysisUrlState | null;
  compare: CompareUrlState | null;
}

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

function parseYear(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : fallback;
}

export function readUrlState(): AppUrlState {
  const sp = new URLSearchParams(window.location.search);
  const tab: Tab = sp.get("tab") === "compare" ? "compare" : "analysis";
  const currentYear = new Date().getFullYear();
  const from = parseYear(sp.get("from"), 2010);
  const to = parseYear(sp.get("to"), currentYear);

  let analysis: AnalysisUrlState | null = null;
  const orcid = sp.get("orcid")?.trim() ?? "";
  if (ORCID_RE.test(orcid)) {
    analysis = { orcid, from, to };
  }

  let compare: CompareUrlState | null = null;
  const raw = sp.get("orcids")?.trim() ?? "";
  if (raw) {
    const orcids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (orcids.length >= 2 && orcids.length <= 5 && orcids.every((o) => ORCID_RE.test(o))) {
      const uniq = new Set(orcids);
      if (uniq.size === orcids.length) {
        compare = { orcids, from, to };
      }
    }
  }

  return { tab, analysis, compare };
}

export function buildAnalysisUrl(state: AnalysisUrlState): string {
  const sp = new URLSearchParams();
  sp.set("tab", "analysis");
  sp.set("orcid", state.orcid);
  sp.set("from", String(state.from));
  sp.set("to", String(state.to));
  return `${window.location.pathname}?${sp.toString()}`;
}

export function buildCompareUrl(state: CompareUrlState): string {
  const sp = new URLSearchParams();
  sp.set("tab", "compare");
  sp.set("orcids", state.orcids.join(","));
  sp.set("from", String(state.from));
  sp.set("to", String(state.to));
  return `${window.location.pathname}?${sp.toString()}`;
}

export function pushAnalysisUrl(state: AnalysisUrlState): void {
  const url = buildAnalysisUrl(state);
  window.history.pushState({}, "", url);
}

export function pushCompareUrl(state: CompareUrlState): void {
  const url = buildCompareUrl(state);
  window.history.pushState({}, "", url);
}

export function pushTabUrl(tab: Tab): void {
  const sp = new URLSearchParams();
  sp.set("tab", tab);
  window.history.pushState({}, "", `${window.location.pathname}?${sp.toString()}`);
}

export function clearUrl(tab: Tab): void {
  pushTabUrl(tab);
}
