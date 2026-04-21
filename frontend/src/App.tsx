import { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import { Shell } from "./components/Shell";
import { AnalysisForm } from "./features/analysis/AnalysisForm";
import { DetailDrawer } from "./features/analysis/DetailDrawer";
import { ErrorState } from "./features/analysis/ErrorState";
import { LoadingView } from "./features/analysis/LoadingView";
import { ResultsView } from "./features/analysis/ResultsView";
import { CompareForm } from "./features/comparison/CompareForm";
import { CompareView } from "./features/comparison/CompareView";
import type {
  AnalysisRequest,
  AnalysisResult,
  ComparisonRequest,
  ComparisonResult,
  EnrichedWork,
} from "./types";

type Tab = "analysis" | "compare";

type AnalysisStage =
  | { kind: "form" }
  | { kind: "loading"; request: AnalysisRequest }
  | { kind: "results"; result: AnalysisResult }
  | { kind: "error"; message: string; lastRequest: AnalysisRequest | null };

type CompareStage =
  | { kind: "form" }
  | { kind: "loading"; request: ComparisonRequest }
  | { kind: "results"; result: ComparisonResult }
  | { kind: "error"; message: string; lastRequest: ComparisonRequest | null };

function parseHashTab(): Tab {
  const h = window.location.hash.replace("#", "").toLowerCase();
  return h === "compare" ? "compare" : "analysis";
}

export default function App() {
  const [tab, setTab] = useState<Tab>(parseHashTab());
  const [stage, setStage] = useState<AnalysisStage>({ kind: "form" });
  const [cmp, setCmp] = useState<CompareStage>({ kind: "form" });
  const [detail, setDetail] = useState<EnrichedWork | null>(null);

  useEffect(() => {
    const onHash = () => setTab(parseHashTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = (t: Tab) => {
    window.location.hash = t;
    setTab(t);
  };

  const runAnalysis = async (req: AnalysisRequest) => {
    setStage({ kind: "loading", request: req });
    try {
      const result = await api.analyze(req);
      setStage({ kind: "results", result });
    } catch (e) {
      setStage({ kind: "error", message: toMsg(e), lastRequest: req });
    }
  };

  const runCompare = async (req: ComparisonRequest) => {
    setCmp({ kind: "loading", request: req });
    try {
      const result = await api.compare(req);
      setCmp({ kind: "results", result });
    } catch (e) {
      setCmp({ kind: "error", message: toMsg(e), lastRequest: req });
    }
  };

  const resetAnalysis = () => {
    setDetail(null);
    setStage({ kind: "form" });
  };
  const resetCompare = () => setCmp({ kind: "form" });

  return (
    <Shell tab={tab} onTab={goTab}>
      {tab === "analysis" && (
        <>
          {stage.kind === "form" && <AnalysisForm onSubmit={runAnalysis} loading={false} />}
          {stage.kind === "loading" && (
            <LoadingView
              orcid={stage.request.orcid}
              range={`${stage.request.start_year}–${stage.request.end_year}`}
            />
          )}
          {stage.kind === "results" && (
            <ResultsView result={stage.result} onOpenWork={setDetail} onNewQuery={resetAnalysis} />
          )}
          {stage.kind === "error" && (
            <ErrorState
              message={stage.message}
              onRetry={() => stage.lastRequest && runAnalysis(stage.lastRequest)}
              onCancel={resetAnalysis}
            />
          )}
          {detail && <DetailDrawer work={detail} onClose={() => setDetail(null)} />}
        </>
      )}

      {tab === "compare" && (
        <>
          {cmp.kind === "form" && <CompareForm onSubmit={runCompare} loading={false} />}
          {cmp.kind === "loading" && (
            <LoadingView
              orcid={cmp.request.orcids.join(" · ")}
              range={`${cmp.request.start_year}–${cmp.request.end_year}`}
            />
          )}
          {cmp.kind === "results" && (
            <CompareView result={cmp.result} onNewQuery={resetCompare} />
          )}
          {cmp.kind === "error" && (
            <ErrorState
              message={cmp.message}
              onRetry={() => cmp.lastRequest && runCompare(cmp.lastRequest)}
              onCancel={resetCompare}
            />
          )}
        </>
      )}
    </Shell>
  );
}

function toMsg(e: unknown): string {
  if (e instanceof ApiError) return `${e.detail} (HTTP ${e.status})`;
  if (e instanceof Error) return e.message;
  return String(e);
}
