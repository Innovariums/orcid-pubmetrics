const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  LevelFormat, BorderStyle, Table, TableRow, TableCell, WidthType,
} = require('docx');

const GREY = "595959";
const BLUE = "1F4E79";

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

const note = (text) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, italics: true, color: GREY, size: 20 })],
});

const question = (num, title, description, options, extraAnswerLabel) => {
  const children = [
    new Paragraph({
      spacing: { before: 280, after: 80 },
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
  children.push(answerBox(3));
  return children;
};

const doc = new Document({
  creator: "Jose Gaspar",
  title: "Cuestionario corto - App ORCID",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
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
        children: [new TextRun({ text: "Cuestionario breve", bold: true, size: 40, color: BLUE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "App web de visualización de publicaciones por ORCID", size: 28 })],
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
          new TextRun({ text: "gracias por el documento de arquitectura. Está muy bien estructurado y resuelve la mayoría de decisiones técnicas (stack, fuente del cuartil = JCR, fases, endpoints). Me quedan solo " }),
          new TextRun({ text: "5 preguntas pendientes", bold: true }),
          new TextRun({ text: " que son las que bloquean empezar a codificar. La primera es la más importante." }),
        ],
      }),

      ...question(
        "1",
        "¿La universidad ya cuenta con licencia / API key de Clarivate Web of Science Journals API?",
        "Es el bloqueador principal. Sin esta API no se puede obtener el cuartil JCR. El precio para una institución es alto y negociado caso por caso; si la universidad ya la tiene, usamos su key. Si no la tiene, hay que cotizar o cambiar de fuente.",
        [
          { label: "Sí, la universidad ya tiene suscripción a WoS / JCR", desc: "(el departamento de biblioteca o investigación debería confirmar). Pedirles la API key." },
          { label: "No tiene, pero la universidad está dispuesta a contratarla", desc: "indicar presupuesto aproximado y contacto." },
          { label: "No tiene y no hay presupuesto institucional", desc: "evaluamos alternativa (ej. Scimago SJR gratis, aunque no es JCR)." },
          { label: "No lo sé", desc: "indicar a quién podemos consultar." },
        ],
        "Contacto en la universidad (biblioteca / oficina de investigación) para gestionar la API key:"
      ),

      ...question(
        "2",
        "¿Quiénes van a usar la aplicación?",
        "Define si necesitamos autenticación y dónde se hospeda.",
        [
          { label: "Solo usted", desc: "app local, sin login, sin hosting." },
          { label: "Su equipo / facultad (~5-20 personas)", desc: "hospedada, login simple." },
          { label: "Toda la universidad", desc: "hospedada con autenticación institucional." },
          { label: "Pública / abierta", desc: "cualquiera con el link puede consultarla." },
        ]
      ),

      ...question(
        "3",
        "Una revista puede tener distinto cuartil en distintas categorías JCR (ej. Q1 en 'Education' y Q3 en 'Psychology'). ¿Qué regla aplicamos al mostrar?",
        "El PDF menciona 'agrupar por categoría' pero no define qué cuartil representa a cada publicación en los gráficos principales.",
        [
          { label: "El mejor cuartil de la revista", desc: "favorece al investigador; es lo usual en CVs y evaluaciones." },
          { label: "Mostrar todas las categorías con su cuartil", desc: "más preciso, visualización más densa." },
          { label: "El usuario elige el área temática al consultar", desc: "más flexible, agrega un paso." },
        ]
      ),

      ...question(
        "4",
        "¿Debe la aplicación permitir comparar varios investigadores a la vez?",
        "Útil para decanatos / reportes de equipos. Cambia el diseño de la base de datos y de la interfaz.",
        [
          { label: "Sí, comparar 2-5 ORCIDs lado a lado", desc: "más útil pero agrega complejidad." },
          { label: "No, un investigador por consulta", desc: "MVP más simple, alineado con el PDF." },
          { label: "No por ahora, dejar la puerta abierta para Fase 3", desc: "recomendación por defecto." },
        ]
      ),

      ...question(
        "5",
        "¿Hay una fecha objetivo para tener la aplicación funcionando?",
        "Ejemplo: una reunión, un reporte institucional, un congreso, un proceso de acreditación.",
        null,
        "Fecha objetivo / evento al que debe llegar lista:"
      ),

      new Paragraph({
        spacing: { before: 400, after: 80 },
        children: [new TextRun({ text: "Comentarios adicionales", bold: true, size: 28, color: BLUE })],
      }),
      note("Cualquier ajuste al documento de arquitectura, preferencia de hosting, o idea que quiera agregar."),
      answerBox(5),

      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Gracias. Con estas respuestas arrancamos Fase 1 de inmediato.", italics: true, color: GREY })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = "C:\\Users\\joseg\\OneDrive\\Desktop\\orcid\\Cuestionario_Corto_App_ORCID.docx";
  fs.writeFileSync(out, buffer);
  console.log("Wrote:", out);
});
