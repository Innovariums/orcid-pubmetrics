import { useState } from "react";
import { Btn, Icon } from "./primitives";

/**
 * Copia window.location.href al clipboard. Normalizado visualmente con
 * el resto de los botones del toolbar: variant secondary, icono share,
 * label "Compartir" (se oculta en móvil via clase .tb-btn).
 *
 * Feedback: el ícono cambia a check verde durante 1.8s tras copiar.
 */
export function ShareButton() {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const onClick = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
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
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  const icon = state === "ok" ? Icon.check() : Icon.share();
  const label = state === "ok" ? "Copiado" : state === "err" ? "Error" : "Compartir";

  return (
    <Btn
      variant="secondary"
      className="tb-btn"
      onClick={onClick}
      iconLeft={icon}
      title="Copiar enlace"
      aria-label="Compartir enlace"
      style={state === "ok" ? { color: "var(--q1)", borderColor: "var(--q1)" } : undefined}
    >
      <span className="tb-label">{label}</span>
    </Btn>
  );
}
