const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  LevelFormat, BorderStyle, Table, TableRow, TableCell, WidthType,
  ShadingType, PageOrientation
} = require('docx');

const GREY = "595959";
const BLUE = "1F4E79";
const LIGHT = "D9E2F3";

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// Answer row: a single-cell table with height to give room for written/typed answers
const answerBox = (lines = 4) => {
  const rows = [];
  for (let i = 0; i < lines; i++) {
    rows.push(new TableRow({
      height: { value: 360, rule: "atLeast" },
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "7F7F7F" },
        },
        width: { size: 9360, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [new Paragraph({ children: [new TextRun(" ")] })],
      })],
    }));
  }
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows,
  });
};

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, color: BLUE, size: 32 })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, color: BLUE, size: 26 })],
});

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text, ...opts })],
});

const note = (text) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, italics: true, color: GREY, size: 20 })],
});

const bullet = (text, opts = {}) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 40 },
  children: [new TextRun({ text, ...opts })],
});

const optionLine = (label, description) => {
  const kids = [
    new TextRun({ text: "☐  ", size: 24 }),
    new TextRun({ text: description ? (label + ": ") : label, bold: true }),
  ];
  if (description) kids.push(new TextRun({ text: description }));
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 40 },
    children: kids,
  });
};

const spacer = () => new Paragraph({ children: [new TextRun("")] });

const question = (num, title, description, options, extraAnswerLabel) => {
  const children = [
    new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({ text: `Pregunta ${num}. `, bold: true, color: BLUE, size: 26 }),
        new TextRun({ text: title, bold: true, size: 26 }),
      ],
    }),
  ];
  if (description) {
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: description, color: GREY })],
    }));
  }
  if (options && options.length) {
    for (const opt of options) {
      children.push(optionLine(opt.label, opt.desc));
    }
  }
  children.push(new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: extraAnswerLabel || "Respuesta / comentarios:", bold: true, size: 22, color: BLUE })],
  }));
  children.push(answerBox(4));
  return children;
};

const doc = new Document({
  creator: "Jose Gaspar",
  title: "Cuestionario - App de métricas ORCID",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "Cuestionario técnico", bold: true, size: 40, color: BLUE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Aplicación web de visualización de publicaciones por ORCID", size: 28 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: "Para: Dr. Oswaldo Langs    |    De: José Gaspar", italics: true, color: GREY })],
      }),

      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: "Estimado Dr. Langs, ", bold: true }),
          new TextRun({ text: "para poder diseñar la aplicación de la forma más simple y efectiva posible, necesito su apoyo respondiendo las siguientes preguntas. Sus respuestas definen decisiones técnicas clave (fuentes de datos, costos, alcance). Puede responder directamente sobre este documento, o simplemente marcar las casillas y agregar comentarios." }),
        ],
      }),

      // Bloque 1
      h1("1. Fuente oficial del cuartil"),
      note("Esta es la decisión más importante: determina qué API usaremos y si hay costo involucrado. ORCID no provee el cuartil directamente; hay que resolverlo por ISSN contra una fuente de ranking."),
      ...question(
        "1.1",
        "¿Qué ranking de cuartiles se utiliza oficialmente en su universidad para acreditación, evaluación docente o escalafón?",
        "Si no está seguro, lo mejor es preguntar a la oficina de investigación o acreditación qué fuente exigen en los reportes.",
        [
          { label: "Scimago (SJR)", desc: "Gratuito, amplia cobertura, estándar común en Latinoamérica." },
          { label: "JCR / Web of Science (Clarivate)", desc: "De pago, estándar formal en muchas evaluaciones." },
          { label: "Scopus CiteScore (Elsevier)", desc: "De pago, incluido con suscripción Scopus." },
          { label: "Otro / no lo sé", desc: "Indíquelo abajo." },
        ]
      ),

      ...question(
        "1.2",
        "¿Su universidad cuenta con suscripción institucional a Scopus o Web of Science?",
        "Si la respuesta es sí, podemos usar su API directamente y ahorrar semanas de desarrollo. La app consultaría publicaciones + cuartil en una sola llamada.",
        [
          { label: "Sí, Scopus", desc: "Ideal: una sola API cubre todo." },
          { label: "Sí, Web of Science", desc: "También funcional, requiere token institucional." },
          { label: "Ambos", desc: "Podemos elegir el más conveniente." },
          { label: "No / no lo sé", desc: "Usaríamos ORCID + Scimago (ruta gratuita)." },
        ],
        "Respuesta / nombre de contacto en la oficina de investigación:"
      ),

      // Bloque 2
      h1("2. Alcance de la aplicación"),
      ...question(
        "2.1",
        "¿Quiénes usarán la aplicación?",
        "Esto define si necesitamos login, hosting público, o basta con una app local.",
        [
          { label: "Solo usted", desc: "App local sencilla, sin autenticación." },
          { label: "Su equipo / facultad", desc: "Hospedada, acceso restringido por login." },
          { label: "Toda la universidad", desc: "Hospedada con autenticación institucional." },
          { label: "Público en general", desc: "Hospedada, sin login." },
        ]
      ),

      ...question(
        "2.2",
        "¿Dónde debe vivir la aplicación?",
        null,
        [
          { label: "Mi computadora personal", desc: "La ejecuto cuando la necesite." },
          { label: "Un servidor de la universidad", desc: "Indicar si ya tienen infraestructura." },
          { label: "Un hosting en la nube", desc: "Costo mensual aproximado $5-$20 USD." },
          { label: "Me es indiferente", desc: "Elegiremos lo más simple." },
        ]
      ),

      // Bloque 3
      h1("3. Período y comportamiento del cuartil"),
      ...question(
        "3.1",
        "Cuando una revista cambia de cuartil con los años, ¿qué cuartil debe mostrar la aplicación para cada publicación?",
        "Ejemplo: un artículo publicado en 2018 en una revista que era Q2 ese año pero hoy es Q1.",
        [
          { label: "Cuartil del año de publicación", desc: "Más fiel históricamente (recomendado para evaluación)." },
          { label: "Cuartil más reciente", desc: "Refleja el estado actual de la revista." },
          { label: "Ambos", desc: "Mostrar los dos (puede confundir al usuario)." },
        ]
      ),

      ...question(
        "3.2",
        "Una revista puede ser Q1 en una categoría (ej. 'Education') y Q3 en otra (ej. 'Psychology'). ¿Qué cuartil debemos mostrar?",
        null,
        [
          { label: "El mejor cuartil de la revista", desc: "Favorece al investigador (es lo más común en CVs)." },
          { label: "Todos los cuartiles por categoría", desc: "Más preciso pero visualización más compleja." },
          { label: "El usuario elige el área temática", desc: "Más flexible, pero agrega un paso a la interfaz." },
        ]
      ),

      // Bloque 4
      h1("4. Visualizaciones a incluir"),
      note("Marque todas las que le interese ver. La primera es la base, el resto son opcionales y se priorizan según su preferencia."),
      ...question(
        "4.1",
        "¿Qué gráficas y métricas quiere visualizar?",
        null,
        [
          { label: "Publicaciones por año y cuartil", desc: "Gráfica de barras apiladas (base principal)." },
          { label: "Distribución total por cuartil", desc: "Gráfica circular o de barras." },
          { label: "Top revistas donde publica", desc: "Lista ordenada por frecuencia." },
          { label: "Citas por año", desc: "Requiere fuente con citas (Scopus, OpenAlex)." },
          { label: "Índice h del período", desc: "Calculado sobre las citas recibidas." },
          { label: "Red de coautores", desc: "Más complejo, opcional." },
          { label: "Áreas temáticas / palabras clave", desc: "Nube de términos o distribución." },
        ],
        "Otras métricas que quisiera ver (libre):"
      ),

      // Bloque 5
      h1("5. Entregables y formato de salida"),
      ...question(
        "5.1",
        "¿Necesita exportar los resultados para informes institucionales?",
        null,
        [
          { label: "Sí, a PDF", desc: "Reporte formal listo para imprimir." },
          { label: "Sí, a Excel", desc: "Tabla con todas las publicaciones y sus cuartiles." },
          { label: "Ambos", desc: null },
          { label: "No, solo visualización en pantalla", desc: null },
        ]
      ),

      ...question(
        "5.2",
        "¿La app debe permitir comparar varios investigadores a la vez?",
        "Por ejemplo: 2 o 3 ORCIDs lado a lado para comparar productividad.",
        [
          { label: "Sí", desc: "Muy útil para decanatos y reportes de equipos." },
          { label: "No, solo un investigador por consulta", desc: "Más simple." },
        ]
      ),

      // Bloque 6
      h1("6. Presupuesto y plazos"),
      ...question(
        "6.1",
        "Si la universidad no tiene suscripción a Scopus/WoS, ¿está dispuesto a pagar por una API comercial?",
        "Referencias de costo aproximado: Scopus API individual ~$0 si institucional / consultar si no; Dimensions API desde $0 para académicos con solicitud; OpenAlex es 100% gratis pero cubre menos cuartiles.",
        [
          { label: "No, solo opciones gratuitas", desc: "Ruta: ORCID + OpenAlex + Scimago CSV (gratis)." },
          { label: "Sí, hasta ~$50 USD / mes", desc: "Acceso a APIs académicas pequeñas." },
          { label: "Sí, hasta ~$200 USD / mes", desc: "Scopus o similares." },
          { label: "Presupuesto abierto si la herramienta lo amerita", desc: null },
        ]
      ),

      ...question(
        "6.2",
        "¿Tiene una fecha objetivo para tener la aplicación funcionando?",
        "Ejemplo: una reunión, un reporte de acreditación, una evaluación institucional.",
        null,
        "Fecha objetivo / evento al que debe llegar lista:"
      ),

      // Bloque 7
      h1("7. Especificación previa"),
      ...question(
        "7.1",
        "Mencionó que tenía una pequeña especificación y arquitectura. ¿Podría compartirla?",
        "Puede pegarla aquí, adjuntarla al correo, o simplemente resumir los puntos principales en el espacio de abajo.",
        null,
        "Resumen de su especificación / decisiones ya tomadas:"
      ),

      // Cierre
      h1("Comentarios adicionales"),
      p("Cualquier requerimiento, preocupación, ejemplo de herramienta que ya haya visto, o idea suelta que considere relevante:"),
      answerBox(8),

      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Gracias, Dr. Langs. Con estas respuestas defino arquitectura y presupuesto y le envío una propuesta de una página.", italics: true, color: GREY })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = "C:\\Users\\joseg\\OneDrive\\Desktop\\orcid\\Cuestionario_App_ORCID.docx";
  fs.writeFileSync(out, buffer);
  console.log("Wrote:", out);
});
