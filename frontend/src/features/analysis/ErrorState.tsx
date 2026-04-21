import { Btn } from "../../components/primitives";

export function ErrorState({
  message,
  onRetry,
  onCancel,
}: {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        padding: "56px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: "var(--q4-tint)",
          color: "var(--q4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="9" />
          <path d="M11 7v5M11 15v.01" />
        </svg>
      </div>
      <div>
        <h2 className="t-h1" style={{ fontSize: 20, margin: 0 }}>
          No se pudo completar el análisis
        </h2>
        <p className="t-small" style={{ marginTop: 8, maxWidth: 440 }}>
          {message}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onCancel}>
          Volver
        </Btn>
        <Btn variant="primary" onClick={onRetry}>
          Reintentar
        </Btn>
      </div>
    </div>
  );
}
