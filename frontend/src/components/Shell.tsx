import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="op-root app-shell">
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
