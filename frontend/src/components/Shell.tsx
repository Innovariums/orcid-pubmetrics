import { ReactNode } from "react";
import { Icon } from "./primitives";

export function Shell({ right, children }: { right?: ReactNode; children: ReactNode }) {
  return (
    <div className="op-root app-shell">
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon.logo(22)}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
              orcid-pubmetrics
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--ink-500)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              análisis bibliométrico
            </div>
          </div>
        </div>
        <nav className="app-header__nav" aria-label="Navegación principal">
          <a href="#" className="is-active">Análisis</a>
          <a href="#" aria-disabled="true" title="Fase 2">Comparación</a>
          <a href="#" aria-disabled="true">Historial</a>
          <a
            href="https://github.com/anthropics/orcid-pubmetrics"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </nav>
        <div style={{ flex: 1 }} />
        <div className="app-header__right">
          <span
            className="op-pill"
            style={{ height: 26, fontSize: 11.5, padding: "0 10px", cursor: "default" }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 3, background: "var(--q1)" }} /> SJR
            2024
          </span>
          {right}
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
