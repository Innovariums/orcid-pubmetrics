import type { AnalysisRequest, AnalysisResult } from "../types";

/**
 * Base de la API. En dev usa el proxy `/api` → backend local (vite.config.ts).
 * En prod se inyecta VITE_API_BASE al build (docker-compose ARG).
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`[${status}] ${detail}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // leave detail as statusText
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; app: string; metrics_provider: string }>("/health"),
  analyze: (req: AnalysisRequest) =>
    request<AnalysisResult>("/analysis", { method: "POST", body: JSON.stringify(req) }),
};
