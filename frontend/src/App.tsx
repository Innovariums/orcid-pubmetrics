import { useEffect, useRef, useState } from "react";
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
import {
  clearUrl,
  pushAnalysisUrl,
  pushCompareUrl,
  pushTabUrl,
  readUrlState,
  Tab,
} from "./urlParams";

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

export default function App() {
  const initial = readUrlState();
  const [tab, setTab] = useState<Tab>(initial.tab);
  const [stage, setStage] = useState<AnalysisStage>({ kind: "form" });
  const [cmp, setCmp] = useState<CompareStage>({ kind: "form" });
  const [detail, setDetail] = useState<EnrichedWork | null>(null);
  const bootstrapped = useRef(false);

  /* Auto-ejecutar si la URL ya viene con params válidos. */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (initial.tab === "analysis" && initial.analysis) {
      runAnalysis(
        {
          orcid: initial.analysis.orcid,
          start_year: initial.analysis.from,
          end_year: initial.analysis.to,
        },
        { pushHistory: false },
      );
    } else if (initial.tab === "compare" && initial.compare) {
      runCompare(
        {
          orcids: initial.compare.orcids,
          start_year: initial.compare.from,
          end_year: initial.compare.to,
        },
        { pushHistory: false },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Back/forward: re-leer la URL y ajustar estado. */
  useEffect(() => {
    const onPop = () => {
      const u = readUrlState();
      setTab(u.tab);
      if (u.tab === "analysis") {
        if (u.analysis) {
          runAnalysis(
            {
              orcid: u.analysis.orcid,
              start_year: u.analysis.from,
              end_year: u.analysis.to,
            },
            { pushHistory: false },
          );
        } else {
          setStage({ kind: "form" });
          setDetail(null);
        }
      } else {
        if (u.compare) {
          runCompare(
            {
              orcids: u.compare.orcids,
              start_year: u.compare.from,
              end_year: u.compare.to,
            },
            { pushHistory: false },
          );
        } else {
          setCmp({ kind: "form" });
        }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTab = (t: Tab) => {
    setTab(t);
    pushTabUrl(t);
  };

  const runAnalysis = async (
    req: AnalysisRequest,
    opts: { pushHistory?: boolean } = { pushHistory: true },
  ) => {
    setStage({ kind: "loading", request: req });
    if (opts.pushHistory !== false) {
      pushAnalysisUrl({ orcid: req.orcid, from: req.start_year, to: req.end_year });
    }
    try {
      const result = await api.analyze(req);
      setStage({ kind: "results", result });
    } catch (e) {
      setStage({ kind: "error", message: toMsg(e), lastRequest: req });
    }
  };

  const runCompare = async (
    req: ComparisonRequest,
    opts: { pushHistory?: boolean } = { pushHistory: true },
  ) => {
    setCmp({ kind: "loading", request: req });
    if (opts.pushHistory !== false) {
      pushCompareUrl({ orcids: req.orcids, from: req.start_year, to: req.end_year });
    }
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
    clearUrl("analysis");
  };
  const resetCompare = () => {
    setCmp({ kind: "form" });
    clearUrl("compare");
  };

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
