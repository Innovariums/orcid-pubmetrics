"""
Open Graph dinámico para compartir enlaces de la app.

Dos endpoints por tipo de consulta (analysis / compare):
  * GET /og/preview?... → HTML mínimo con meta tags og:* personalizados
    + <script> que redirige a los humanos a la SPA del frontend. Pensado
    para que los bots sociales (facebookexternalhit, twitterbot, whatsapp,
    slackbot, linkedinbot, etc.) lo reciban vía el proxy de Nginx.
  * GET /og/image.png?... → PNG 1200×630 generado con PIL para usar como
    og:image. Si el rendering falla por cualquier motivo se sirve un
    placeholder estático.

No dependemos de la pipeline completa (OpenAlex + SJR) por cada hit de
un crawler: la imagen se compone solo con los params del URL.
"""
from __future__ import annotations

import io
import os
import re
from html import escape
from typing import Literal

from fastapi import APIRouter, Query, Request
from fastapi.responses import HTMLResponse, Response
from PIL import Image, ImageDraw, ImageFont

router = APIRouter()

ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")

FRONT_BASE = "https://orcid-pubmetrics.innovarium.site"

# Paleta espejo del frontend
C_INK_900 = (14, 17, 22)
C_INK_700 = (43, 49, 59)
C_INK_500 = (90, 99, 114)
C_INK_400 = (138, 148, 166)
C_INK_300 = (189, 196, 209)
C_INK_200 = (228, 231, 236)
C_INK_100 = (238, 240, 243)
C_INK_50 = (246, 247, 248)
C_PAPER = (255, 255, 255)
C_ACCENT = (31, 79, 209)
C_Q1 = (31, 157, 85)
C_Q2 = (38, 99, 228)
C_Q3 = (212, 160, 23)
C_Q4 = (200, 55, 45)
C_QN = (126, 135, 149)

# Font paths con fallbacks para Linux/Debian y dev en Windows/macOS
SANS_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
SANS_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
SERIF_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "C:/Windows/Fonts/times.ttf",
    "/System/Library/Fonts/Times.ttc",
]
MONO_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "C:/Windows/Fonts/consola.ttf",
    "/System/Library/Fonts/Menlo.ttc",
]


def _font(paths: list[str], size: int) -> ImageFont.ImageFont:
    for p in paths:
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _valid_orcid(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v if ORCID_RE.match(v) else None


def _valid_year(v: int | None, default: int) -> int:
    if v is None:
        return default
    if 1900 <= v <= 2100:
        return v
    return default


# ------------------ HTML PREVIEW ------------------


def _html(title: str, description: str, url: str, image_url: str, redirect_to: str) -> str:
    return f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}" />
  <meta name="theme-color" content="#0E1116" />
  <link rel="canonical" href="{escape(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="orcid-pubmetrics" />
  <meta property="og:locale" content="es_CO" />
  <meta property="og:url" content="{escape(url)}" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(description)}" />
  <meta property="og:image" content="{escape(image_url)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="{escape(title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(title)}" />
  <meta name="twitter:description" content="{escape(description)}" />
  <meta name="twitter:image" content="{escape(image_url)}" />
  <link rel="icon" type="image/svg+xml" href="{FRONT_BASE}/favicon.svg" />
  <script>window.location.replace({redirect_to!r});</script>
  <meta http-equiv="refresh" content="0; url={escape(redirect_to)}" />
</head>
<body>
  <p>Redirigiendo a <a href="{escape(redirect_to)}">{escape(redirect_to)}</a>…</p>
</body>
</html>"""


@router.get("/preview", response_class=HTMLResponse)
def og_preview(
    request: Request,
    tab: Literal["analysis", "compare"] = "analysis",
    orcid: str | None = None,
    orcids: str | None = None,
    from_: int | None = Query(None, alias="from"),
    to: int | None = None,
) -> HTMLResponse:
    start = _valid_year(from_, 2010)
    end = _valid_year(to, 2026)

    if tab == "compare" and orcids:
        orcid_list = [o for o in (x.strip() for x in orcids.split(",")) if ORCID_RE.match(o)]
        if 2 <= len(orcid_list) <= 5:
            title = f"Comparación de {len(orcid_list)} investigadores · orcid-pubmetrics"
            desc = (
                f"ORCIDs {', '.join(orcid_list)}. Solapamiento de revistas por cuartil SJR, "
                f"coautorías directas y cruces con comités editoriales. Rango {start}–{end}."
            )
            image_url = (
                f"{FRONT_BASE.replace('orcid-pubmetrics', 'api-orcid-pubmetrics')}/og/compare.png?"
                f"orcids={','.join(orcid_list)}&from={start}&to={end}"
            )
            redirect = f"{FRONT_BASE}/?tab=compare&orcids={','.join(orcid_list)}&from={start}&to={end}"
            canonical = f"{FRONT_BASE}/?tab=compare&orcids={','.join(orcid_list)}&from={start}&to={end}"
            return HTMLResponse(content=_html(title, desc, canonical, image_url, redirect))

    ov = _valid_orcid(orcid)
    if ov:
        title = f"ORCID {ov} · Análisis bibliométrico"
        desc = (
            f"Publicaciones del ORCID {ov} por cuartil SJR, distribución anual, top revistas "
            f"y evolución del score promedio. Rango {start}–{end}. Fuente Scimago JR 2024."
        )
        image_url = (
            f"{FRONT_BASE.replace('orcid-pubmetrics', 'api-orcid-pubmetrics')}/og/image.png?"
            f"orcid={ov}&from={start}&to={end}"
        )
        redirect = f"{FRONT_BASE}/?tab=analysis&orcid={ov}&from={start}&to={end}"
        canonical = f"{FRONT_BASE}/?tab=analysis&orcid={ov}&from={start}&to={end}"
        return HTMLResponse(content=_html(title, desc, canonical, image_url, redirect))

    # Fallback genérico (sin params válidos)
    title = "orcid-pubmetrics — Análisis bibliométrico por ORCID"
    desc = (
        "Herramienta web abierta para analizar la producción académica de un investigador "
        "a partir de su ORCID. Cuartiles SJR, revistas, evolución y comparación entre "
        "investigadores con cruce a comités editoriales."
    )
    image_url = f"{FRONT_BASE}/og-image.jpg"
    return HTMLResponse(content=_html(title, desc, FRONT_BASE, image_url, FRONT_BASE))


# ------------------ PNG RENDERING ------------------


def _draw_header(draw: ImageDraw.ImageDraw, f_tiny: ImageFont.ImageFont) -> None:
    draw.text(
        (60, 50),
        "ORCID · PUBMETRICS · ANÁLISIS BIBLIOMÉTRICO",
        fill=C_INK_500,
        font=f_tiny,
    )
    # Logo mark (square + W)
    draw.rounded_rectangle([(60, 85), (114, 139)], radius=10, fill=C_INK_900)
    # W stroke
    pts = [(75, 127), (75, 102), (87, 118), (99, 102), (99, 127)]
    draw.line(pts, fill=C_PAPER, width=3, joint="curve")
    draw.ellipse([(85, 132), (91, 138)], fill=C_Q1)


def _wrap_text(
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
    draw: ImageDraw.ImageDraw,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur: list[str] = []
    for w in words:
        test = " ".join(cur + [w])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines


def _render_analysis_png(orcid: str, from_y: int, to_y: int) -> bytes:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), C_INK_50)
    draw = ImageDraw.Draw(img)

    f_tiny = _font(SANS_BOLD_CANDIDATES, 16)
    f_meta = _font(SANS_CANDIDATES, 22)
    f_chip = _font(MONO_CANDIDATES, 26)
    f_stat_label = _font(SANS_BOLD_CANDIDATES, 14)
    f_stat_value = _font(SERIF_CANDIDATES, 58)
    f_title = _font(SERIF_CANDIDATES, 76)

    _draw_header(draw, f_tiny)

    # Título
    draw.text((60, 170), "Análisis bibliométrico por ORCID.", fill=C_INK_900, font=f_title)

    # Chip ORCID + meta
    chip_x, chip_y = 60, 268
    text_bbox = draw.textbbox((chip_x + 14, chip_y + 10), orcid, font=f_chip)
    tw = text_bbox[2] - text_bbox[0]
    draw.rounded_rectangle(
        [(chip_x, chip_y), (chip_x + tw + 28, chip_y + 44)],
        radius=6,
        fill=C_INK_100,
    )
    draw.text((chip_x + 14, chip_y + 8), orcid, fill=C_INK_700, font=f_chip)

    meta_x = chip_x + tw + 48
    draw.text((meta_x, chip_y + 10), f"Rango {from_y}–{to_y}", fill=C_INK_500, font=f_meta)
    # Dot
    draw.ellipse([(meta_x + 190, chip_y + 22), (meta_x + 196, chip_y + 28)], fill=C_INK_300)
    draw.text((meta_x + 208, chip_y + 10), "Fuente SJR 2024", fill=C_INK_500, font=f_meta)

    # Banda de "KPI cards" — ahora decorativa (valores reales requerirían el pipeline)
    cards_x = 60
    cards_y = 370
    gap = 14
    card_w = (W - 120 - gap * 4) // 5
    card_h = 150
    cards = [
        ("Q1", C_Q1),
        ("Q2", C_Q2),
        ("Q3", C_Q3),
        ("Q4", C_Q4),
        ("SIN INDEXAR", C_QN),
    ]
    for i, (label, color) in enumerate(cards):
        x0 = cards_x + i * (card_w + gap)
        draw.rounded_rectangle(
            [(x0, cards_y), (x0 + card_w, cards_y + card_h)],
            radius=10,
            fill=C_PAPER,
            outline=C_INK_200,
            width=1,
        )
        # Top color bar
        draw.rounded_rectangle(
            [(x0, cards_y), (x0 + card_w, cards_y + 6)],
            radius=3,
            fill=color,
        )
        # Dot + label
        draw.ellipse([(x0 + 18, cards_y + 28), (x0 + 28, cards_y + 38)], fill=color)
        draw.text((x0 + 34, cards_y + 24), label, fill=C_INK_500, font=f_stat_label)
        # Pseudo-number (serif, color)
        draw.text((x0 + 18, cards_y + 56), "—", fill=color, font=f_stat_value)
        draw.text((x0 + 18, cards_y + 124), "resuelto en la app", fill=C_INK_400, font=f_stat_label)

    # Footer (URL)
    f_footer = _font(SANS_CANDIDATES, 20)
    draw.line([(60, H - 70), (W - 60, H - 70)], fill=C_INK_200, width=1)
    draw.text((60, H - 54), "orcid-pubmetrics.innovarium.site", fill=C_INK_700, font=f_footer)
    draw.text(
        (W - 240, H - 54),
        f"Ingresa con {orcid}",
        fill=C_INK_500,
        font=f_footer,
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _render_compare_png(orcids: list[str], from_y: int, to_y: int) -> bytes:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), C_INK_50)
    draw = ImageDraw.Draw(img)

    f_tiny = _font(SANS_BOLD_CANDIDATES, 16)
    f_meta = _font(SANS_CANDIDATES, 20)
    f_chip = _font(MONO_CANDIDATES, 18)
    f_title = _font(SERIF_CANDIDATES, 72)
    f_subtitle = _font(SANS_CANDIDATES, 28)
    f_letter = _font(SANS_BOLD_CANDIDATES, 48)

    _draw_header(draw, f_tiny)

    # Título
    draw.text((60, 170), f"Comparación de {len(orcids)} investigadores.", fill=C_INK_900, font=f_title)
    draw.text((60, 262), "Revistas compartidas, coautorías y cruce con comités editoriales.", fill=C_INK_500, font=f_subtitle)

    # Investigadores: card por ORCID, distribuidos uniformemente
    tones = [(31, 79, 209), (162, 75, 217), (209, 138, 31), (11, 122, 106), (200, 55, 45)]
    card_pad = 60
    avail_w = W - card_pad * 2
    slot_w = avail_w // len(orcids)
    card_top = 380
    for i, orcid in enumerate(orcids):
        color = tones[i % len(tones)]
        slot_cx = card_pad + i * slot_w + slot_w // 2
        # Círculo con letra
        r = 34
        draw.ellipse(
            [(slot_cx - r, card_top), (slot_cx + r, card_top + r * 2)],
            fill=color,
        )
        letter = chr(65 + i)
        lb = draw.textbbox((0, 0), letter, font=f_letter)
        lw = lb[2] - lb[0]
        lh = lb[3] - lb[1]
        draw.text(
            (slot_cx - lw / 2, card_top + r - lh / 2 - 6),
            letter,
            fill=C_PAPER,
            font=f_letter,
        )
        # ORCID centrado bajo el círculo
        obb = draw.textbbox((0, 0), orcid, font=f_chip)
        ow = obb[2] - obb[0]
        draw.text(
            (slot_cx - ow / 2, card_top + r * 2 + 14),
            orcid,
            fill=C_INK_700,
            font=f_chip,
        )
        label = f"Investigador {letter}"
        lbb = draw.textbbox((0, 0), label, font=f_meta)
        lbw = lbb[2] - lbb[0]
        draw.text(
            (slot_cx - lbw / 2, card_top + r * 2 + 44),
            label,
            fill=C_INK_500,
            font=f_meta,
        )

    # Footer
    f_footer = _font(SANS_CANDIDATES, 20)
    draw.line([(60, H - 70), (W - 60, H - 70)], fill=C_INK_200, width=1)
    draw.text((60, H - 54), "orcid-pubmetrics.innovarium.site", fill=C_INK_700, font=f_footer)
    draw.text(
        (W - 360, H - 54),
        f"Rango {from_y}–{to_y} · SJR 2024",
        fill=C_INK_500,
        font=f_footer,
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


@router.get("/image.png")
def og_image(
    orcid: str | None = None,
    from_: int | None = Query(None, alias="from"),
    to: int | None = None,
) -> Response:
    ov = _valid_orcid(orcid)
    start = _valid_year(from_, 2010)
    end = _valid_year(to, 2026)
    if not ov:
        # Sin ORCID válido, devuelve el static
        return Response(status_code=302, headers={"Location": f"{FRONT_BASE}/og-image.jpg"})
    try:
        png = _render_analysis_png(ov, start, end)
    except Exception:
        return Response(status_code=302, headers={"Location": f"{FRONT_BASE}/og-image.jpg"})
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400, s-maxage=86400"},
    )


@router.get("/compare.png")
def og_image_compare(
    orcids: str | None = None,
    from_: int | None = Query(None, alias="from"),
    to: int | None = None,
) -> Response:
    start = _valid_year(from_, 2010)
    end = _valid_year(to, 2026)
    orcid_list: list[str] = []
    if orcids:
        for o in orcids.split(","):
            o = o.strip()
            if ORCID_RE.match(o):
                orcid_list.append(o)
    if len(orcid_list) < 2 or len(orcid_list) > 5:
        return Response(status_code=302, headers={"Location": f"{FRONT_BASE}/og-image.jpg"})
    try:
        png = _render_compare_png(orcid_list, start, end)
    except Exception:
        return Response(status_code=302, headers={"Location": f"{FRONT_BASE}/og-image.jpg"})
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400, s-maxage=86400"},
    )
