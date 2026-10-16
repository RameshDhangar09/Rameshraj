// Build "HYT Website Content – page by page" (Word) from content_export.py output.
// Usage: node tools/docs-src/content-doc.js content.json output.docx
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, LevelFormat, Header, Footer, PageNumber, BorderStyle,
} = require('docx');

const [, , src, out] = process.argv;
const D = JSON.parse(fs.readFileSync(src, 'utf8'));
const BLUE = '184A72', ORANGE = 'A9530D', GREY = '5A6170', FONT = 'Arial', W = 9026;

function runs(text, base = {}) {
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(t => t.startsWith('**')
    ? new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: 21, ...base })
    : new TextRun({ text: t, font: FONT, size: 21, ...base }));
}
const P = (text, o = {}, r = {}) => new Paragraph({ spacing: { after: 110, line: 276 }, ...o, children: runs(text, r) });
const cellP = (t, head) => new Paragraph({ spacing: { after: 20 }, children: runs(t, head ? { bold: true, color: 'FFFFFF', size: 18 } : { size: 18 }) });

function table(cols, rows, widths) {
  widths = widths || (() => {
    const n = cols.length; const first = n > 2 ? 2600 : 3200; const rest = Math.floor((W - first) / (n - 1));
    const w = [first, ...Array(n - 1).fill(rest)]; w[n - 1] += W - w.reduce((a, b) => a + b, 0); return w;
  })();
  const mk = (r, head, zebra) => new TableRow({ tableHeader: head, children: r.map((c, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 90, right: 90 },
    shading: { type: ShadingType.CLEAR, fill: head ? BLUE : (zebra ? 'F6F8FA' : 'FFFFFF') }, children: [cellP(c ?? '', head)] })) });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [mk(cols, true), ...rows.map((r, i) => mk(r, false, i % 2 === 1))] });
}

const LEVEL = ['Home', 'Main page', 'Sub page', 'Sub-sub page', 'Level 4'];
const TYPE = { home: 'Home page', product: 'Product page', page: 'Content page', legal: 'Legal page', utility: 'Utility page' };
const body = [];

// ---------- cover ----------
body.push(new Paragraph({ spacing: { before: 1600, after: 120 }, children: [new TextRun({ text: 'HYT Engineering Company Pvt. Ltd.', font: FONT, size: 26, color: GREY })] }));
body.push(new Paragraph({ spacing: { after: 220 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: 'F58220', space: 8 } },
  children: [new TextRun({ text: 'Website Content – Page by Page', font: FONT, size: 50, bold: true, color: BLUE })] }));
body.push(P(`All text on hytengineering.com in English (Global master version), in menu order: ${D.pages.length} pages. German, French, Italian, Dutch and North American English versions follow the same structure.`, {}, { size: 23, color: GREY }));
body.push(P(' '));
body.push(table(['Item', 'Detail'], [
  ['Version / date', '1.0 – 16 October 2026'],
  ['Source', 'Website content files (src/content/en/) – identical to the built website'],
  ['Status', 'Pre-launch. Items marked "Content pending HYT approval" need HYT confirmation before go-live.'],
  ['Related documents', 'HYT-Website-Page-List.xlsx (page hierarchy) · HYT-Website-Requirements-Specification.docx'],
], [2400, W - 2400]));
body.push(P(' '));
body.push(P('**How to read this document**', { spacing: { before: 200, after: 80 } }));
[['Page heading', 'Name of the page as it appears in the menu, with its URL, SEO title and meta description.'],
 ['ORANGE CAPITALS', 'Small label shown above a heading on the page ("eyebrow").'],
 ['Blue heading', 'Section heading on the page.'],
 ['Button:', 'Text of a button or link.'],
 ['[Functional element]', 'Interactive part of the page (forms, videos, filters) – its content is generated automatically.'],
 ['Yellow box', 'Content pending HYT approval – review note shown on the preview website only.']]
  .forEach(([a, b]) => body.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 50 }, children: [...runs(`**${a}** – `), ...runs(b)] })));

// ---------- contents ----------
body.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 200 }, children: [new TextRun({ text: 'Contents', font: FONT, size: 32, bold: true, color: BLUE })] }));
D.pages.forEach((p, i) => body.push(new Paragraph({ spacing: { after: 30 }, indent: { left: Math.max(0, p.depth - 1) * 360 },
  children: [new TextRun({ text: `${i + 1}.  ${p.nav}`, font: FONT, size: p.depth <= 1 ? 20 : 19, bold: p.depth <= 1, color: p.depth <= 1 ? '2E3338' : GREY }),
    new TextRun({ text: `   ${p.path}`, font: FONT, size: 16, color: '8A919A' })] })));

// ---------- pages ----------
D.pages.forEach((p, i) => {
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: `${i + 1}. ${p.nav}`, font: FONT })] }));
  const meta = [['URL', 'https://hytengineering.com' + p.path], ['Level', `${LEVEL[Math.min(p.depth, 4)]}${p.parent ? ' – under ' + p.parent : ''}`],
    ['Page type', TYPE[p.template] || 'Content page'], ['SEO title', p.title], ['Meta description', p.description]];
  if (p.model) meta.splice(3, 0, ['Model', p.model]);
  body.push(table(['Field', 'Content'], meta, [2000, W - 2000]));
  body.push(new Paragraph({ spacing: { before: 240, after: 60 }, children: [new TextRun({ text: 'PAGE TOP (HERO)', font: FONT, size: 16, bold: true, color: '8A919A' })] }));
  if (p.eyebrow) body.push(P(p.eyebrow.toUpperCase(), { spacing: { after: 40 } }, { size: 17, bold: true, color: ORANGE }));
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: p.h1, font: FONT })] }));
  if (p.lede) body.push(P(p.lede, {}, { size: 23, color: '2E3338' }));
  let first = true;
  for (const [k, v] of p.elements) {
    switch (k) {
      case 'section':
        if (!first) body.push(new Paragraph({ spacing: { before: 120, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D6DAE0', space: 1 } }, children: [] }));
        first = false; break;
      case 'eyebrow': body.push(P(v.toUpperCase(), { spacing: { before: 120, after: 30 } }, { size: 17, bold: true, color: ORANGE })); break;
      case 'h3': body.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: v, font: FONT })] })); break;
      case 'h4': body.push(P(`**${v}**`, { spacing: { before: 140, after: 60 } }, { size: 21, color: '2E3338' })); break;
      case 'p': body.push(P(v)); break;
      case 'small': body.push(P(v, {}, { size: 18, color: GREY, italics: true })); break;
      case 'quote': body.push(P(`“${v}”`, { spacing: { before: 80, after: 40 } }, { size: 28, bold: true, color: BLUE })); break;
      case 'bullet': body.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 50, line: 264 }, children: runs(v) })); break;
      case 'q': body.push(P(`**Q: ${v}**`, { spacing: { before: 100, after: 30 } })); break;
      case 'a': body.push(P(`A: ${v}`, { indent: { left: 280 } })); break;
      case 'button': body.push(P(`Button: **${v}**`, { spacing: { after: 60 } }, { size: 19, color: ORANGE })); break;
      case 'func': body.push(P(`[${v}]`, {}, { size: 19, italics: true, color: GREY })); break;
      case 'note': body.push(new Paragraph({ spacing: { before: 80, after: 140 }, shading: { type: ShadingType.CLEAR, fill: 'FFF4DA' },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'E3A008', space: 6 } },
        children: [...runs('**Content pending HYT approval:** ', { size: 19, color: '5A4300' }), ...runs(v, { size: 19, color: '5A4300' })] })); break;
      case 'table': body.push(table(v.cols, v.rows)); body.push(P(' ', { spacing: { after: 60 } })); break;
      default: break;
    }
  }
});

// ---------- shared elements ----------
body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: 'Shared elements (every page)', font: FONT })] }));
body.push(P(`Tagline: ${D.tagline}`));
for (const [k, v] of D.shared) {
  if (k === 'h3') body.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: v, font: FONT })] }));
  else body.push(P(v));
}

const doc = new Document({
  creator: 'HYT Engineering Company Pvt. Ltd.', title: 'HYT Website Content – Page by Page',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: BLUE, font: FONT }, paragraph: { spacing: { after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: '2E3338', font: FONT }, paragraph: { spacing: { before: 40, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, color: BLUE, font: FONT }, paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 280 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1250, bottom: 1150, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'HYT Engineering – Website Content', font: FONT, size: 16, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Page ', font: FONT, size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
      new TextRun({ text: ' of ', font: FONT, size: 16, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GREY })] })] }) },
    children: body,
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('written', out); });
