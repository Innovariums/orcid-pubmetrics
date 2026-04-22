"""
Descarga el dataset Publindex vigente desde la API pública del portal de
MinCiencias. Genera dos archivos en data/publindex/:

- publindex_current.json  — revistas vigentes con homepage_url, email, etc.
- publindex.json          — histórico A1/A2/B/C por (issn, año) conservado
                            para la feature Publindex en el drawer.

API:
  GET https://scienti.minciencias.gov.co/publindex/api/publico/
      revistasPublindex/categorias/{A1|A2|B|C}

Devuelve registros con id, idRevistaDetalle, txtNombre, txtPaginaWeb,
txtEmail, txtDireccion, issns[], instituciones[], clasificaciones (null en
este endpoint — pero ocasionalmente poblado en /verArchivo/{id}).

El dataset histórico anterior (6.276 filas 2004-2022, 665 ISSNs) se
preserva con los datos nuevos mergeados: la clasificación vigente 2024
entra como año más reciente, y el campo homepage_url se escribe por ISSN.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "publindex"
USER_AGENT = "orcid-pubmetrics/1.0 (jgasparlopez29@gmail.com)"
API_BASE = "https://scienti.minciencias.gov.co/publindex/api/publico"

# Año de la clasificación vigente expuesta por el portal. Se marca explícito
# porque la API no lo devuelve en el payload por categoría (todos los
# registros son de la última convocatoria vigente).
CURRENT_CLASSIFICATION_YEAR = 2024


def _fetch_json(path: str) -> Any:
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
            "Origin": "https://scienti.minciencias.gov.co",
            "Referer": "https://scienti.minciencias.gov.co/publindex/",
        },
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _normalize_url(raw: str | None) -> str | None:
    """Normaliza URLs que el portal devuelve sin esquema (www.revista.edu.co).

    Algunos registros del portal Publindex traen múltiples URLs separadas
    por `;` o `,` (típicamente el sitio OJS + una réplica en SciELO). Se
    prefiere la primera que contenga `/index.php/` (OJS, con comité
    editorial auto-derivable). Si ninguna la tiene, se queda con la
    primera bien formada. HTTPS por defecto si no se declara esquema.
    """
    if not raw:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None

    candidates: list[str] = []
    for part in cleaned.replace(",", ";").split(";"):
        p = part.strip()
        if p:
            candidates.append(p)
    if not candidates:
        return None

    def _with_scheme(u: str) -> str:
        return u if u.startswith(("http://", "https://")) else "https://" + u

    # Preferir URLs con /index.php/ (OJS) — permiten derivar comité editorial
    for c in candidates:
        if "/index.php/" in c:
            return _with_scheme(c)
    return _with_scheme(candidates[0])


def _normalize_issn(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip().replace("-", "").upper()
    if len(cleaned) != 8:
        return None
    if not cleaned[:7].isdigit() or not (cleaned[7].isdigit() or cleaned[7] == "X"):
        return None
    return cleaned


def fetch_vigente() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for cat in ("A1", "A2", "B", "C"):
        payload = _fetch_json(f"/revistasPublindex/categorias/{cat}")
        for row in payload:
            out.append(
                {
                    "id": row.get("id"),
                    "name": (row.get("txtNombre") or "").strip() or None,
                    "homepage_url": _normalize_url(row.get("txtPaginaWeb")),
                    "email": (row.get("txtEmail") or "").strip() or None,
                    "address": (row.get("txtDireccion") or "").strip() or None,
                    "phone": (row.get("txtTelefono") or "").strip() or None,
                    "issns": [
                        _normalize_issn(i) for i in (row.get("issns") or []) if i
                    ],
                    "institutions": [
                        (i or "").strip()
                        for i in (row.get("instituciones") or [])
                        if i
                    ],
                    "current_category": cat,
                    "current_year": CURRENT_CLASSIFICATION_YEAR,
                }
            )
        print(f"  {cat}: {sum(1 for r in out if r['current_category'] == cat)} revistas")
        time.sleep(0.3)
    return out


def merge_history(vigente: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Combina la clasificación vigente 2024 con el histórico 2004-2022.

    El fichero slim anterior (publindex.json) se mantiene como fuente
    histórica por (issn, año). La clasificación vigente 2024 se inyecta
    como una fila adicional por cada ISSN de las revistas vigentes.
    """
    histpath = DATA_DIR / "publindex.json"
    if histpath.exists():
        history = json.loads(histpath.read_text(encoding="utf-8"))
    else:
        history = []

    # Indexar histórico por (issn_norm, year) para evitar duplicados
    seen: set[tuple[str, int]] = set()
    for row in history:
        for key in ("issn_p", "issn_l"):
            val = _normalize_issn(row.get(key))
            if val and row.get("year"):
                seen.add((val, int(row["year"])))

    # Añadir filas sintéticas para 2024 por cada ISSN vigente
    added = 0
    for rev in vigente:
        if not rev["issns"]:
            continue
        for issn in rev["issns"]:
            key = (issn, CURRENT_CLASSIFICATION_YEAR)
            if key in seen:
                continue
            seen.add(key)
            # Formato igual al histórico 2004-2022 para compatibilidad
            history.append(
                {
                    "issn_p": issn[:4] + "-" + issn[4:]
                    if len(issn) == 8
                    else issn,
                    "issn_l": None,
                    "name": rev["name"],
                    "year": CURRENT_CLASSIFICATION_YEAR,
                    "category": rev["current_category"],
                    "area": None,
                    "big_area": None,
                    "country": "Colombia",
                }
            )
            added += 1

    # Reordenar para diffs estables
    history.sort(
        key=lambda x: (
            (x.get("issn_p") or x.get("issn_l") or ""),
            x.get("year", 0),
        )
    )
    print(f"  + {added} filas nuevas para {CURRENT_CLASSIFICATION_YEAR}")
    return history


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print("Descargando revistas vigentes por categoría...")
    vigente = fetch_vigente()
    print(f"Total vigentes: {len(vigente)}")

    vigpath = DATA_DIR / "publindex_current.json"
    with vigpath.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(vigente, f, ensure_ascii=False, indent=2)
    print(f"Escrito: {vigpath} ({vigpath.stat().st_size} bytes)")

    print("Mergeando con histórico...")
    history = merge_history(vigente)
    histpath = DATA_DIR / "publindex.json"
    with histpath.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(history, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrito: {histpath} ({histpath.stat().st_size} bytes)")

    # Estadísticas rápidas
    with_url = sum(1 for r in vigente if r["homepage_url"])
    with_email = sum(1 for r in vigente if r["email"])
    print()
    print(f"Cobertura homepage_url: {with_url}/{len(vigente)}")
    print(f"Cobertura email:        {with_email}/{len(vigente)}")


if __name__ == "__main__":
    main()
