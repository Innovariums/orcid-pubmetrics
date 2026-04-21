import { ReactNode } from "react";

type Tab = "analysis" | "compare";

export function Shell({
  tab,
  onTab,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  return (
    <div className="op-root app-shell">
      <div className="app-tabs" role="tablist" aria-label="Modo de análisis">
        <button
          role="tab"
          aria-selected={tab === "analysis"}
          className={`app-tab${tab === "analysis" ? " is-active" : ""}`}
          onClick={() => onTab("analysis")}
        >
          Un investigador
        </button>
        <button
          role="tab"
          aria-selected={tab === "compare"}
          className={`app-tab${tab === "compare" ? " is-active" : ""}`}
          onClick={() => onTab("compare")}
        >
          Comparar
          <span className="app-tab__badge">nuevo</span>
        </button>
      </div>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
