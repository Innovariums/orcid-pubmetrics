import { useEffect, useState } from "react";

type Health = {
  status: string;
  app: string;
  metrics_provider: string;
  editorial_provider: string;
};

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 720 }}>
      <h1>orcid-pubmetrics</h1>
      <p>Scaffold Fase 0. Backend connection check:</p>
      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
      {health && (
        <ul>
          <li>Status: {health.status}</li>
          <li>App: {health.app}</li>
          <li>Metrics provider: {health.metrics_provider}</li>
          <li>Editorial provider: {health.editorial_provider}</li>
        </ul>
      )}
      {!health && !error && <p>Cargando…</p>}
    </main>
  );
}
