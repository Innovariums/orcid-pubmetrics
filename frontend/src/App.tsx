import { useState } from "react";
import { api, ApiError } from "./api/client";
import { Shell } from "./components/Shell";
import { Btn } from "./components/primitives";
import { AnalysisForm } from "./features/analysis/AnalysisForm";
import { DetailDrawer } from "./features/analysis/DetailDrawer";
import { ErrorState } from "./features/analysis/ErrorState";
import { LoadingView } from "./features/analysis/LoadingView";
import { ResultsView } from "./features/analysis/ResultsView";
import type { AnalysisRequest, AnalysisResult, EnrichedWork } from "./types";

type Stage =
  | { kind: "form" }
  | { kind: "loading"; request: AnalysisRequest }
  | { kind: "results"; result: AnalysisResult }
  | { kind: "error"; message: string; lastRequest: AnalysisRequest | null };

export default function App() {
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [detail, setDetail] = useState<EnrichedWork | null>(null);

  const run = async (req: AnalysisRequest) => {
    setStage({ kind: "loading", request: req });
    try {
      const result = await api.analyze(req);
      setStage({ kind: "results", result });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? `${e.detail} (HTTP ${e.status})`
          : e instanceof Error
          ? e.message
          : String(e);
      setStage({ kind: "error", message: msg, lastRequest: req });
    }
  };

  const reset = () => {
    setDetail(null);
    setStage({ kind: "form" });
  };

  const headerRight =
    stage.kind === "results" ? (
      <Btn variant="ghost" size="sm" onClick={reset}>
        Nueva consulta
      </Btn>
    ) : undefined;

  return (
    <Shell right={headerRight}>
      {stage.kind === "form" && <AnalysisForm onSubmit={run} loading={false} />}
      {stage.kind === "loading" && (
        <LoadingView
          orcid={stage.request.orcid}
          range={`${stage.request.start_year}–${stage.request.end_year}`}
        />
      )}
      {stage.kind === "results" && (
        <ResultsView
          result={stage.result}
          onOpenWork={setDetail}
          onNewQuery={reset}
        />
      )}
      {stage.kind === "error" && (
        <ErrorState
          message={stage.message}
          onRetry={() => stage.lastRequest && run(stage.lastRequest)}
          onCancel={reset}
        />
      )}
      {detail && <DetailDrawer work={detail} onClose={() => setDetail(null)} />}
    </Shell>
  );
}
