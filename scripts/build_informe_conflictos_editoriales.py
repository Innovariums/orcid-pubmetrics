"""
Genera el informe PDF "Detección de conflictos editoriales en revistas
nacionales colombianas" en el escritorio del usuario.

Tono: técnico, neutral, primera persona impersonal. Sin nombres de
personas ni referencias a conversaciones.
"""
from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = Path.home() / "OneDrive" / "Desktop" / (
    "Informe-conflictos-editoriales-revistas-nacionales.pdf"
)

INK_900 = colors.HexColor("#0F172A")
INK_700 = colors.HexColor("#334155")
INK_500 = colors.HexColor("#64748B")
INK_200 = colors.HexColor("#E2E8F0")
INK_100 = colors.HexColor("#F1F5F9")
ACCENT = colors.HexColor("#1D4ED8")
WARN = colors.HexColor("#B45309")


def build() -> None:
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        topMargin=2.0 * cm,
        bottomMargin=2.0 * cm,
        title="Conflictos editoriales en revistas nacionales",
        author="Informe técnico",
    )

    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=INK_900,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=INK_500,
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=13.5,
            leading=18,
            textColor=INK_900,
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            textColor=INK_900,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14.5,
            textColor=INK_700,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=INK_700,
            leftIndent=16,
            bulletIndent=4,
            spaceAfter=3,
        ),
        "callout": ParagraphStyle(
            "callout",
            parent=base["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=14,
            textColor=WARN,
            leftIndent=8,
            borderPadding=8,
            spaceAfter=10,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            textColor=INK_500,
            spaceAfter=10,
        ),
    }

    story: list = []

    story.append(Paragraph(
        "Detección de conflictos editoriales en revistas nacionales colombianas",
        styles["title"],
    ))
    story.append(Paragraph(
        "Hallazgos técnicos y propuesta de avance por fases &middot; 22 de abril de 2026",
        styles["subtitle"],
    ))

    # 1. Contexto
    story.append(Paragraph("1. Contexto", styles["h1"]))
    story.append(Paragraph(
        "La aplicación detecta actualmente posibles conflictos editoriales — autores "
        "que publican en revistas donde figuran como miembros del comité editorial o "
        "donde figura un coautor suyo — usando el conjunto Open Editors Plus 2026. "
        "La detección funciona de manera consistente en el ámbito internacional, "
        "pero presenta una limitación clara cuando el caso de estudio se centra en "
        "revistas colombianas indexadas en Publindex. Este documento consolida la "
        "investigación técnica realizada para entender la causa de esa limitación, "
        "las alternativas disponibles y una propuesta de avance por fases.",
        styles["body"],
    ))

    # 2. Diagnóstico
    story.append(Paragraph("2. Diagnóstico", styles["h1"]))

    story.append(Paragraph(
        "2.1 El dataset actual no cubre Colombia",
        styles["h2"],
    ))
    story.append(Paragraph(
        "Se revisó la cobertura del conjunto Open Editors Plus 2026 para editores "
        "con afiliación colombiana. Los números son concluyentes:",
        styles["body"],
    ))
    story.append(Paragraph(
        "&bull; 922 097 registros de miembros editoriales en el dataset completo.",
        styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; 15 168 revistas únicas.",
        styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; <b>0 editores con afiliación institucional colombiana</b> "
        "(campo <font face='Courier'>ror_country = CO</font>).",
        styles["bullet"],
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "La cobertura de Colombia en Open Editors es nula. Cualquier revista "
        "nacional que no esté en este índice queda fuera de la detección "
        "automática, independientemente de que aparezca correctamente catalogada "
        "en Publindex.",
        styles["body"],
    ))

    story.append(Paragraph(
        "2.2 El dataset Publindex público no incluye comité editorial",
        styles["h2"],
    ))
    story.append(Paragraph(
        "El conjunto oficial de datos.gov.co (<i>Revistas Indexadas, Índice Nacional "
        "Publindex</i>) contiene 35 columnas administrativas: ISSN impreso y "
        "electrónico, nombre, año de clasificación, categoría A1/A2/B/C, país, "
        "región, institución editora y áreas OCDE. No existe columna con sitio "
        "web, correo de contacto ni comité editorial. El dato que se necesita "
        "para detectar conflictos simplemente no está publicado en el dataset "
        "abierto.",
        styles["body"],
    ))

    story.append(Paragraph(
        "2.3 Publindex expone una API pública no documentada",
        styles["h2"],
    ))
    story.append(Paragraph(
        "El portal scienti.minciencias.gov.co/publindex/ consume internamente los "
        "siguientes endpoints sin autenticación:",
        styles["body"],
    ))
    story.append(Paragraph(
        "&bull; <font face='Courier'>POST /publindex/api/publico/revistasPublindex</font> "
        "— listado de 693 revistas vigentes.",
        styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; <font face='Courier'>GET /publindex/api/publico/revistasPublindex/{id}</font> "
        "— detalle con campos <font face='Courier'>txtPaginaWeb</font>, "
        "<font face='Courier'>txtEmail</font>, "
        "<font face='Courier'>txtOrientacionEditorial</font>.",
        styles["bullet"],
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "El campo <font face='Courier'>txtPaginaWeb</font> expone la URL oficial "
        "de cada revista. Esto permite pasar del dataset plano actual a una tabla "
        "enriquecida con enlace directo al sitio autoritativo, sin necesidad de "
        "scraping de páginas HTML. Los endpoints que expondrían comité editorial "
        "(<font face='Courier'>api/revistas/detalle*</font>) requieren "
        "autenticación como editor de la revista y devuelven 403 para consultas "
        "anónimas.",
        styles["body"],
    ))

    story.append(Paragraph(
        "2.4 Prevalencia de Open Journal Systems en revistas colombianas",
        styles["h2"],
    ))
    story.append(Paragraph(
        "Se cruzó el catálogo DOAJ (Directory of Open Access Journals) con las "
        "revistas colombianas: 88 de 94 revistas listadas (93,6%) publican su "
        "comité editorial bajo la ruta estándar "
        "<font face='Courier'>{base}/index.php/{journal}/about/editorialTeam</font>, "
        "patrón característico de Open Journal Systems (OJS). Muestreos manuales "
        "confirman el mismo patrón en revistas de Universidad Nacional, "
        "Universidad de Antioquia, Universidad Externado, CES, Universidad "
        "Católica y otras instituciones editoras relevantes.",
        styles["body"],
    ))
    story.append(Paragraph(
        "Estimación razonable: entre el 85% y el 90% de las 665 revistas únicas "
        "de Publindex responderían a un scraper OJS genérico. El 10-15% restante "
        "utiliza plataformas custom (WordPress, Drupal institucional) y requeriría "
        "adaptadores específicos o curado manual.",
        styles["body"],
    ))

    story.append(PageBreak())

    # 3. Falsos positivos
    story.append(Paragraph("3. El problema de los falsos positivos", styles["h1"]))
    story.append(Paragraph(
        "La detección de conflictos editoriales en la aplicación se basa en cruce "
        "por ORCID del autor con ORCID del miembro del comité editorial. Es un "
        "cruce determinístico, cerrado y verificable: o el identificador coincide "
        "o no coincide.",
        styles["body"],
    ))
    story.append(Paragraph(
        "El muestreo directo de comités editoriales en cinco revistas colombianas "
        "Publindex arrojó un resultado que condiciona cualquier decisión posterior:",
        styles["body"],
    ))

    sample_data = [
        ["Revista", "Plataforma", "Miembros", "Con ORCID"],
        ["Dyna (UNAL)", "OJS", "11", "0"],
        ["Ideas y Valores (UNAL)", "OJS", "20", "0"],
        ["Psicoespacios (IUE)", "OJS", "14", "0"],
        ["Acta Col. de Psicología (UCatólica)", "OJS", "3+", "3"],
        ["CES MVZ", "OJS", "14", "0"],
    ]
    t = Table(
        sample_data,
        colWidths=[7.0 * cm, 2.2 * cm, 2.5 * cm, 2.5 * cm],
        hAlign="LEFT",
    )
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 9.5),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), INK_900),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, INK_100]),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK_700),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK_200),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Fuente: muestreo manual sobre páginas de comité editorial de cada revista.",
        styles["caption"],
    ))

    story.append(Paragraph(
        "Cuatro de cinco revistas muestreadas no publican ORCID de ningún miembro "
        "del comité. Esto obliga, para cualquier scraper automatizado, a resolver "
        "el par (nombre, afiliación) a un ORCID vía la API de OpenAlex. Prueba "
        "directa: la búsqueda <font face='Courier'>/authors?search=</font> con un "
        "nombre común devolvió 21 candidatos. La desambiguación requiere scoring "
        "por institución, área de conocimiento y país, y aun con filtros estrictos "
        "se estima una tasa de falsos positivos del 15-25%.",
        styles["body"],
    ))

    story.append(Paragraph(
        "Este margen de error es crítico para la aplicación. Un falso positivo "
        "significa atribuir a un autor la pertenencia al comité editorial de una "
        "revista en la que publicó, cuando en realidad se trata de otra persona "
        "con el mismo nombre. El efecto práctico es acusar injustamente a un "
        "académico de un conflicto de interés que no existe. El nivel de "
        "evidencia que exige una herramienta de transparencia académica es "
        "superior al de un dashboard bibliométrico estándar, y cualquier ruta "
        "que se elija debe manejar explícitamente esa diferencia.",
        styles["callout"],
    ))

    # 4. Opciones
    story.append(Paragraph("4. Opciones de avance", styles["h1"]))
    story.append(Paragraph(
        "Las rutas técnicas evaluadas, ordenadas por retorno sobre inversión:",
        styles["body"],
    ))

    opciones = [
        (
            "Opción A — Enriquecer el dataset con la URL oficial de cada revista",
            (
                "Consumir la API pública no documentada de Publindex para añadir "
                "el campo <font face='Courier'>homepage_url</font> a las 665 "
                "revistas del dataset local. En el drawer de publicaciones no "
                "indexadas, incluir un enlace directo al sitio autoritativo y, "
                "cuando la plataforma sea OJS, al listado "
                "<font face='Courier'>/about/editorialTeam</font>."
            ),
            "3-4 horas de desarrollo",
            "Bajo. Consumo de API pública, sin scraping DOM, sin heurísticas.",
            "El usuario puede verificar manualmente cada caso. Habilita "
            "opciones posteriores sin comprometerlas.",
        ),
        (
            "Opción B — Seed curado manual de revistas prioritarias",
            (
                "Construir manualmente una tabla canónica de comités editoriales "
                "para las 50-100 revistas A1/A2 más relevantes, con ORCIDs "
                "verificados uno a uno. Integrar el seed como dataset "
                "complementario al Open Editors internacional, con atribución "
                "clara de fuente."
            ),
            "Aproximadamente 15 horas de investigación manual (no desarrollo)",
            "Cero. 100% de precisión en los datos incluidos.",
            "Cobertura parcial pero alta precisión en las revistas que "
            "concentran la actividad editorial del caso de estudio.",
        ),
        (
            "Opción C — Ruta híbrida completa",
            (
                "Opción A más scraper OJS genérico más resolución automatizada "
                "nombre a ORCID vía OpenAlex, con umbral de confianza explícito "
                "y separación visual en la interfaz entre ORCID publicado por la "
                "revista (alta confianza) y ORCID inferido (requiere verificación)."
            ),
            "80-100 horas de desarrollo y ajuste fino",
            "Introduce la categoría 'conflicto probable' con 15-25% de falsos "
            "positivos. La interfaz debe comunicar la incertidumbre sin degradar "
            "la credibilidad del resto del informe.",
            "Cobertura automática del 85-90% del catálogo Publindex, con la "
            "salvedad anterior sobre incertidumbre.",
        ),
    ]

    for title, desc, esfuerzo, riesgo, valor in opciones:
        block = [
            Paragraph(title, styles["h2"]),
            Paragraph(desc, styles["body"]),
        ]
        tbl = Table(
            [
                ["Esfuerzo", Paragraph(esfuerzo, styles["body"])],
                ["Riesgo", Paragraph(riesgo, styles["body"])],
                ["Valor", Paragraph(valor, styles["body"])],
            ],
            colWidths=[2.2 * cm, 14.0 * cm],
            hAlign="LEFT",
        )
        tbl.setStyle(TableStyle([
            ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9.5),
            ("FONT", (1, 0), (1, -1), "Helvetica", 9.5),
            ("TEXTCOLOR", (0, 0), (0, -1), INK_500),
            ("TEXTCOLOR", (1, 0), (1, -1), INK_700),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        block.append(tbl)
        block.append(Spacer(1, 6))
        story.append(KeepTogether(block))

    story.append(Paragraph(
        "Opción D — Scraper OJS genérico sin resolución de ORCID",
        styles["h2"],
    ))
    story.append(Paragraph(
        "Se descarta. Sin matching a ORCID, el dato extraído no se cruza con la "
        "detección actual; queda como texto informativo sin valor analítico para "
        "el objetivo del proyecto.",
        styles["body"],
    ))

    story.append(Paragraph(
        "Opción E — Uso de fuentes agregadas existentes",
        styles["h2"],
    ))
    story.append(Paragraph(
        "Se descarta. La investigación confirmó que ninguna fuente agregada "
        "(SciELO, DOAJ, Crossref, OpenAlex, Redalyc, ISSN Portal, Dialnet, "
        "LA Referencia, CLACSO) expone comité editorial como dato estructurado. "
        "SciELO Colombia cubre 255 revistas pero su API sólo expone editor "
        "institucional, no miembros del comité. DOAJ sólo expone la URL del "
        "comité (<font face='Courier'>editorial.board_url</font>), no su "
        "contenido.",
        styles["body"],
    ))

    # 5. Legal
    story.append(Paragraph("5. Consideraciones legales", styles["h1"]))
    story.append(Paragraph(
        "Los nombres y afiliaciones de miembros de comités editoriales "
        "publicados voluntariamente por la revista en su sitio oficial "
        "constituyen información profesional pública. El tratamiento automático "
        "para fines de transparencia académica está cubierto por la excepción "
        "del artículo 10 literal c) de la Ley 1581 de 2012 (Habeas Data). El "
        "proyecto debe en cualquier caso:",
        styles["body"],
    ))
    story.append(Paragraph(
        "&bull; Respetar rate limiting por host (aproximadamente 1 request por "
        "segundo).", styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; Identificar al agente de scraping con un correo de contacto.",
        styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; Citar Publindex y la revista como fuentes en la interfaz.",
        styles["bullet"],
    ))
    story.append(Paragraph(
        "&bull; Cachear localmente para minimizar impacto sobre los sitios de "
        "origen.", styles["bullet"],
    ))

    # 6. Recomendación
    story.append(Paragraph("6. Recomendación", styles["h1"]))
    story.append(Paragraph(
        "Se propone avanzar por fases, evaluando al final de cada una antes de "
        "comprometer la siguiente. Esta ruta minimiza el riesgo de introducir "
        "falsos positivos en una herramienta cuyo valor depende de la precisión, "
        "y entrega utilidad incremental desde la primera semana de trabajo.",
        styles["body"],
    ))

    fases = [
        (
            "Fase 1 — Opción A",
            "Implementar el enriquecimiento con URL oficial vía la API pública "
            "de Publindex. Exponer en el drawer de publicaciones no indexadas un "
            "enlace directo al sitio de la revista y, cuando la plataforma sea "
            "OJS, al listado de comité editorial. Tiempo estimado: una jornada.",
        ),
        (
            "Fase 2 — Opción B",
            "Con la Fase 1 desplegada, identificar las 50-100 revistas "
            "prioritarias por frecuencia de aparición en los casos de estudio y "
            "construir manualmente el seed curado con ORCIDs verificados. "
            "Integrar el seed como dataset complementario al Open Editors "
            "internacional.",
        ),
        (
            "Fase 3 — Opción C, sólo si las fases anteriores lo justifican",
            "Evaluar el scraper OJS genérico y el matcher nombre a ORCID "
            "únicamente si la cobertura de la Fase 2 resulta insuficiente en la "
            "práctica, y siempre con separación explícita en la interfaz entre "
            "datos verificados e inferidos.",
        ),
    ]
    for titulo, cuerpo in fases:
        story.append(Paragraph(titulo, styles["h2"]))
        story.append(Paragraph(cuerpo, styles["body"]))

    story.append(Paragraph("7. Decisión pendiente", styles["h1"]))
    story.append(Paragraph(
        "Este documento no toma una decisión. Plantea los hechos técnicos "
        "verificados, las rutas posibles y los riesgos asociados a cada una, "
        "para que la decisión sobre el alcance y el nivel aceptable de "
        "incertidumbre sea explícita. En particular, la adopción de la Opción C "
        "implica asumir que la herramienta puede reportar conflictos probables "
        "con una tasa de falsos positivos no despreciable, aunque estén "
        "marcados como tales en la interfaz. La Opción A es independiente de esa "
        "decisión y puede implementarse de inmediato.",
        styles["body"],
    ))

    doc.build(story)
    print(f"OK: {OUTPUT}")


if __name__ == "__main__":
    build()
