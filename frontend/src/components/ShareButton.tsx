import { useState } from "react";
import { Btn, Icon } from "./primitives";

const icon = (size = 14) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4.5L7 1.5L4 4.5" />
    <path d="M7 1.5V9" />
    <path d="M2 9V11.5C2 12.05 2.45 12.5 3 12.5H11C11.55 12.5 12 12.05 12 11.5V9" />
  </svg>
);

/**
 * Copia el window.location.href al clipboard y muestra feedback "Copiado ✓"
 * durante 2 segundos. Fallback a window.prompt si la Clipboard API no está
 * disponible (navegadores viejos, http sin localhost).
 */
export function ShareButton({ variant = "secondary", label = "Copiar enlace" }: {
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const onClick = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback sin Clipboard API
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setState("ok");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  return (
    <Btn
      variant={variant}
      onClick={onClick}
      iconLeft={state === "ok" ? Icon.check() : icon()}
      style={state === "ok" ? { color: "var(--q1)", borderColor: "var(--q1)" } : undefined}
    >
      {state === "ok" ? "Copiado" : state === "err" ? "No se pudo copiar" : label}
    </Btn>
  );
}
