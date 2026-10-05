// Northstar Retail Group — Executive Business Review, October 2026.
// Builds ebr/Northstar_EBR_Oct2026.pptx in the customer dashboard's design language: the same frame and
// top bar, Inter type scale, Fireworks colour tokens, KPI tiles, health panel, chart cards and square pills.
//
//   cd ebr/source && npm install && node build_ebr.js ../Northstar_EBR_Oct2026.pptx
//
// Every figure comes from the customer dashboard's own model (figures.js), so the deck and the dashboard
// cannot disagree. Fonts: Inter (SIL OFL) — install ebr/fonts/*.ttf to view the .pptx as designed.
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { loadFigures } = require('./figures');

const OUT = process.argv[2] || path.join(__dirname, '..', 'Northstar_EBR_Oct2026.pptx');
const ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------- tokens (shared/src/theme, as rendered)
const T = {
  purple: '6720FF', // purple-400, primary accent and primary series
  purple500: '501BC4',
  purple200: '9D72FE',
  purple50: 'CEB4FF',
  purple25: 'E0D2FD',
  marine: '1DA28F', // marine-700, secondary series and "good"
  blue: '1756FF', // blue-300, tertiary series
  red: 'F14539', // red-500, incidents
  red100: 'FFE4E2',
  red700: 'B32519',
  amber100: 'FDECD1',
  amber700: '975800',
  ink: '16181D',
  body: '28282E',
  gray: '5A5E63',
  target: 'ABABAB', // neutrals-300, reference lines
  tint: 'FAF7FF', // surface tint
  border: 'E6EAF4',
  chip: 'F2F2F2', // the site's 5% black chip on white
  white: 'FFFFFF',
};
const INTER = 'Inter';
const MEDIUM = 'Inter Medium'; // headings, labels and values are Inter 500 on the dashboard
const MONO = 'Consolas'; // the dashboard's ui-monospace on Windows, for the model ID only

const THEME = {
  name: 'Fireworks',
  headFontFace: MEDIUM,
  bodyFontFace: INTER,
  colors: {
    dk1: T.ink, lt1: T.white, dk2: T.body, lt2: T.tint,
    accent1: T.purple, accent2: T.marine, accent3: T.blue, accent4: T.purple200, accent5: T.red, accent6: 'E8A127',
    hlink: T.purple, folHlink: T.purple500,
  },
};

// ---------------------------------------------------------------- geometry (13.333 x 7.5 in)
const W = 13.333;
const H = 7.5;
const FX = 0.42; // the dashboard's frame lines
const M = 0.8; // content margin inside the frame
const CW = W - 2 * M;
const TB = 0.78; // top bar height
const R = 0.12; // the dashboard's 12px card radius
const CT = 2.3; // content top, below title and lede

// ---------------------------------------------------------------- assets
async function png(svg, width) {
  const buf = await sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

// Lucide icons (ISC), the same paths as shared/src/components/PillarIcon.tsx.
const ICONS = {
  reliability: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  adoption: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'model-quality': '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  'user-outcomes': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
};
const iconSvg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

// ---------------------------------------------------------------- theme colours (pptxgenjs can't write them)
async function applyTheme(file, theme, refSeries = new Set()) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = 'ppt/theme/theme1.xml';
  const slots = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const scheme = `<a:clrScheme name="${theme.name}">` + slots.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k]}"/></a:${k}>`).join('') + '</a:clrScheme>';
  const xml = (await zip.file(part).async('string'))
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, `$1${theme.name}"`);
  if (!xml.includes(scheme)) throw new Error('Theme colour scheme not found');
  zip.file(part, xml);
  // Reference lines: pptxgenjs styles every series in a chart alike, so make these 1pt dashed here.
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/charts\/chart\d+\.xml$/.test(n))) {
    const chart = (await zip.file(name).async('string')).replace(/<c:ser>[\s\S]*?<\/c:ser>/g, (ser) => {
      const label = (ser.match(/<c:tx>[\s\S]*?<c:v>([^<]*)<\/c:v>/) || [])[1];
      if (!refSeries.has(label)) return ser;
      return ser.replace(/(<c:spPr>[\s\S]*?<a:ln w=")\d+"/, (_, head) => `${head}12700"`).replace(/<a:prstDash val="solid"\/>/, '<a:prstDash val="dash"/>');
    });
    zip.file(name, chart);
  }
  // Guard: every explicit colour in the deck must be six-digit hex.
  for (const name of Object.keys(zip.files).filter((n) => n.endsWith('.xml'))) {
    const bad = (await zip.file(name).async('string')).match(/<a:srgbClr val="(?![0-9A-Fa-f]{6}")([^"]*)"/);
    if (bad) throw new Error(`${name}: colour "${bad[1]}" is not six-digit hex`);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

async function main() {
  const { lib, m } = await loadFigures();
  const { fmtPct, fmtMs, fmtMinSec, fmtCompact, fmtInt, fmtSigned, fmtDay, fmtUsd, ppChange, pctChange, fmtPct2, round100 } = lib;
  const { cmp, days, periodAvg } = m;
  const TARGET = lib.AVAILABILITY_TARGET;

  const logo = fs.readFileSync(path.join(ROOT, 'shared', 'src', 'theme', 'brand', 'fireworks-logo.svg'), 'utf8');
  const LOGO = await png(logo, 2400);
  const LOGO_RATIO = 343 / 44;
  const icons = {};
  for (const [k, v] of Object.entries(ICONS)) icons[k] = await png(iconSvg(v), 256);

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Northstar Retail Group — Atlas: Executive Business Review, October 2026';
  pres.subject = 'Month one results and the plan for four more brands';
  pres.author = 'Fireworks AI';
  pres.company = 'Fireworks AI';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

  // ---------------------------------------------------------------- primitives
  const text = (s, t, o) => s.addText(t, { margin: 0, isTextBox: true, valign: 'top', color: T.body, fontFace: INTER, ...o });
  const label = (s, t, o) => text(s, t, { fontFace: MEDIUM, fontSize: 10.5, color: T.gray, ...o });
  const box = (s, x, y, w, h, fill, line = T.border, radius = R, name) =>
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: radius, fill: fill ? { color: fill } : { type: 'none' }, line: line ? { color: line, width: 0.75 } : { type: 'none' }, objectName: name });
  const rect = (s, x, y, w, h, fill) => s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill }, line: { type: 'none' } });
  const hline = (s, x, y, w, color = T.border, width = 0.75, dash) => s.addShape(pres.ShapeType.line, { x, y, w, h: 0, line: { color, width, dashType: dash } });
  const vline = (s, x, y, h, color = T.border, width = 0.75, dash) => s.addShape(pres.ShapeType.line, { x, y, w: 0, h, line: { color, width, dashType: dash } });

  // Square status pill (plan.css .pill): Inter 500, no rounding.
  const PILL = {
    good: [T.marine, T.white], purple: [T.purple, T.white], chip: [T.chip, T.ink], warn: [T.amber100, T.amber700], bad: [T.red100, T.red700],
  };
  function pill(s, x, y, t, kind = 'chip', size = 9.5) {
    const [fill, color] = PILL[kind];
    const w = t.length * size * 0.0078 + 0.22;
    rect(s, x, y, w, 0.26, fill);
    text(s, t, { x, y, w, h: 0.26, fontFace: MEDIUM, fontSize: size, color, align: 'center', valign: 'middle' });
    return w;
  }

  // Square pips with a partial fill, as on the health panel.
  function pips(s, x, y, score, size = 0.17, gap = 0.045) {
    for (let i = 0; i < 5; i++) {
      const px = x + i * (size + gap);
      rect(s, px, y, size, size, T.purple25);
      const fill = Math.max(0, Math.min(1, score - i));
      if (fill > 0) rect(s, px, y, size * fill, size, T.purple);
    }
    return 5 * size + 4 * gap;
  }

  // Pixel squares rising to the right: the site's square motif, read as growth.
  function pixels(s, x, y, flip = false) {
    const P = ['....##', '...#o#', '..#o+o', '.#o+..', '#o+...'];
    const S = 0.24, G = 0.07;
    P.forEach((row, r) =>
      [...row].forEach((c, i) => {
        if (c === '.') return;
        const col = flip ? row.length - 1 - i : i;
        rect(s, x + col * (S + G), y + r * (S + G), S, S, c === '#' ? T.purple : c === 'o' ? T.purple50 : T.purple25);
      }),
    );
  }

  // ---------------------------------------------------------------- layouts
  const frameLines = [
    { line: { x: FX, y: 0, w: 0, h: H, line: { color: T.border, width: 0.75 } } },
    { line: { x: W - FX, y: 0, w: 0, h: H, line: { color: T.border, width: 0.75 } } },
  ];
  const LOGO_H = 0.24;
  const topBar = [
    { line: { x: 0, y: TB, w: W, h: 0, line: { color: T.border, width: 0.75 } } },
    { image: { x: M, y: (TB - LOGO_H) / 2, w: LOGO_H * LOGO_RATIO, h: LOGO_H, data: LOGO } },
    { line: { x: M + LOGO_H * LOGO_RATIO + 0.24, y: 0.25, w: 0, h: 0.28, line: { color: T.border, width: 0.75 } } },
    {
      text: {
        text: 'Northstar Retail Group · Executive Business Review · October 2026',
        options: { x: W - M - 6.1, y: 0.24, w: 5.6, h: 0.3, fontFace: INTER, fontSize: 9.5, color: T.gray, align: 'right', valign: 'middle', margin: 0 },
      },
    },
  ];

  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: T.white },
    margin: [0.5, M, 0.45, M],
    objects: [
      ...frameLines,
      ...topBar,
      {
        placeholder: {
          options: { name: 'view', type: 'body', x: M + LOGO_H * LOGO_RATIO + 0.48, y: 0.24, w: 3.5, h: 0.3, fontFace: MEDIUM, fontSize: 11, color: T.ink, margin: 0, valign: 'middle' },
          text: '',
        },
      },
      {
        placeholder: {
          options: { name: 'title', type: 'title', x: M, y: 1.06, w: CW, h: 0.62, fontFace: MEDIUM, fontSize: 28, color: T.ink, charSpacing: -0.7, margin: 0, valign: 'top', align: 'left' },
          text: '',
        },
      },
      {
        placeholder: {
          options: { name: 'lede', type: 'body', x: M, y: 1.66, w: CW, h: 0.5, fontFace: INTER, fontSize: 13, color: T.gray, margin: 0, valign: 'top' },
          text: '',
        },
      },
    ],
    slideNumber: { x: W - M - 0.4, y: 0.24, w: 0.4, h: 0.3, fontFace: INTER, fontSize: 9.5, color: T.ink, align: 'right' },
  });

  pres.defineSlideMaster({ title: 'COVER', background: { color: T.white }, objects: [...frameLines] });
  pres.defineSlideMaster({ title: 'CLOSING', background: { color: T.white }, objects: [...frameLines, ...topBar] });

  function content(section, view, title, lede) {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: section });
    s.addText(view, { placeholder: 'view' });
    s.addText(title, { placeholder: 'title' });
    if (lede) s.addText(lede, { placeholder: 'lede' });
    return s;
  }

  // ---------------------------------------------------------------- chart card (TrendChart)
  const DAY_LABELS = days.map((d, i) => (i % 7 === 0 ? fmtDay(d.date) : ''));
  const PLOT = { x: 0.085, y: 0.04, w: 0.895, h: 0.8 }; // inner plot area as a fraction of the chart box
  const REF_SERIES = new Set(); // series names restyled as dashed reference lines after writing
  function chartCard(s, o) {
    const { x, y, w, h } = o;
    box(s, x, y, w, h, T.white, T.border, R, o.name);
    text(s, o.title, { x: x + 0.25, y: y + 0.22, w: w - 0.5, h: 0.3, fontFace: MEDIUM, fontSize: 14, color: T.ink });
    text(s, o.headline, { x: x + 0.25, y: y + 0.54, w: w - 0.5, h: 0.5, fontSize: 10.5, color: T.gray });
    const cx = x + 0.12, cy = y + 1.08, cw = w - 0.3, ch = h - 1.58;
    // Reference lines are dashed constant series, so they sit exactly in the plot in every renderer.
    const refs = o.refs || [];
    refs.forEach((r) => REF_SERIES.add(r.label));
    const data = [
      ...o.series.map((sr) => ({ name: sr.name, labels: DAY_LABELS, values: days.map((d) => d[sr.key]) })),
      ...refs.map((r) => ({ name: r.label, labels: DAY_LABELS, values: days.map(() => r.y) })),
    ];
    s.addChart(pres.ChartType.line, data, {
      x: cx, y: cy, w: cw, h: ch,
      layout: PLOT,
      chartColors: [...o.series.map((sr) => sr.color), ...refs.map(() => T.target)],
      lineSize: 1.75, lineDataSymbol: 'none', lineSmooth: true,
      valAxisMinVal: o.min, valAxisMaxVal: o.max, valAxisMajorUnit: o.unit, valAxisLabelFormatCode: o.format,
      valAxisLabelColor: T.gray, catAxisLabelColor: T.gray, valAxisLabelFontSize: 8.5, catAxisLabelFontSize: 8.5,
      valAxisLabelFontFace: '+mn-lt', catAxisLabelFontFace: '+mn-lt',
      valGridLine: { color: T.border, size: 0.75 }, catGridLine: { style: 'none' },
      valAxisLineShow: false, catAxisLineShow: true, catAxisLineColor: T.border,
      catAxisMajorTickMark: 'none', valAxisMajorTickMark: 'none', catAxisLabelRotate: 0,
      showLegend: false, showValue: false,
    });
    // Overlays on the inner plot area: reference line and operational-event markers, as on the dashboard.
    const px = cx + cw * PLOT.x, py = cy + ch * PLOT.y, pw = cw * PLOT.w, ph = ch * PLOT.h;
    const at = (v) => py + ph * (1 - (v - o.min) / (o.max - o.min));
    refs.forEach((r) => {
      text(s, r.label, { x: px + 0.06, y: at(r.y) - 0.22, w: 2.4, h: 0.2, fontSize: 8.5, color: T.gray });
    });
    m.events.forEach((e) => {
      const i = days.findIndex((d) => d.date === e.date);
      vline(s, px + pw * ((i + 0.5) / days.length), py, ph, e.kind === 'incident' ? T.red : T.purple200, 1, 'dash');
    });
    // Legend, as .legend: short swatch plus label.
    let lx = x + 0.25;
    const ly = y + h - 0.36;
    const item = (color, name, dash) => {
      hline(s, lx, ly + 0.1, 0.2, color, 2, dash);
      const tw = name.length * 0.068 + 0.1;
      text(s, name, { x: lx + 0.27, y: ly, w: tw, h: 0.2, fontSize: 9.5, color: T.body });
      lx += 0.27 + tw + 0.18;
    };
    o.series.forEach((sr) => item(sr.color, sr.name));
    item(T.red, 'Incident', 'dash');
    item(T.purple200, 'Change', 'dash');
  }

  // The five talking points for the live EBR (brief item 7), shown on the cover.
  const KEY_MESSAGES = () => [
    `Month one delivered: Tier-1 automation reached ${fmtPct(cmp.automation.last)} in the final week, with faster, better-rated answers.`,
    'Quality improved every week, and the evidence is in your dashboard.',
    `${fmtPct2(m.avgAvailability)} availability today: we find the cause in telemetry before buying capacity.`,
    'One base model, one adapter per brand: each brand keeps its voice and its data.',
    'We’re asking for a group sponsor today and Ridgeline as the pilot.',
  ];

  // ================================================================ 1. Cover
  pres.addSection({ title: 'Opening' });
  {
    const s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Opening' });
    const lh = 0.46;
    s.addImage({ data: LOGO, x: M, y: 0.92, w: lh * LOGO_RATIO, h: lh, altText: 'Fireworks AI' });
    const lw = 5.9;
    label(s, 'Executive Business Review', { x: M, y: 2.55, w: lw, h: 0.3, fontSize: 14, color: T.purple500 });
    text(s, 'Northstar Retail Group', { x: M, y: 2.92, w: lw, h: 0.8, fontFace: MEDIUM, fontSize: 40, color: T.ink, charSpacing: -1.6 });
    text(s, 'Month one in production, and the plan for four more brands', { x: M, y: 3.77, w: lw - 0.4, h: 0.8, fontSize: 18, color: T.gray });

    // Key messages: the five talking points for the live EBR, up front.
    const kx = M + lw + 0.45, kw = CW - lw - 0.45, ky = 0.92, kh = 5.08;
    box(s, kx, ky, kw, kh, T.tint, T.border, R, 'key-messages');
    label(s, 'Key messages', { x: kx + 0.3, y: ky + 0.3, w: 3, h: 0.24, fontSize: 11, color: T.purple500 });
    const points = KEY_MESSAGES();
    const rh = (kh - 0.75) / points.length;
    points.forEach((t, i) => {
      const y = ky + 0.66 + i * rh;
      if (i) hline(s, kx + 0.3, y, kw - 0.6);
      rect(s, kx + 0.32, y + rh / 2 - 0.065, 0.13, 0.13, i === points.length - 1 ? T.marine : T.purple);
      text(s, t, { x: kx + 0.66, y, w: kw - 0.96, h: rh, fontSize: 12.5, color: T.ink, valign: 'middle' });
    });

    hline(s, M, 6.3, CW);
    text(s, 'October 2026', {
      x: W - M - 6, y: 6.48, w: 6, h: 0.3, fontSize: 11, color: T.gray, align: 'right',
    });
    s.addNotes(`Welcome and purpose. This review covers Atlas’s first month in production, measured on the same data and the same scoring as the dashboard Northstar already has, and the proposal to bring the four sister brands onto the platform. The five key messages are the whole story in one place; everything that follows is the evidence. One: month one delivered, with automation at ${fmtPct(cmp.automation.last)} in the final week and faster, better-rated answers. Two: quality improved every week. Three: availability is ${fmtPct2(m.avgAvailability)}, and we will find the cause in telemetry before anyone buys capacity. Four: one base model with one adapter per brand keeps each brand’s voice and data separate. Five: we are asking for a group sponsor today and Ridgeline as the pilot.`);
  }

  // ================================================================ 2. Headline metrics
  pres.addSection({ title: 'Results' });
  {
    const s = content('Results', 'Outcomes',
      `Month one: Tier-1 automation reached ${fmtPct(cmp.automation.last, 0)} by the final week`,
      'August averages. The change line compares the first week with the final week, the same basis as your dashboard.');
    const tone = (good) => (good === null ? T.gray : good ? T.marine : T.red700);
    const tiles = [
      ['Tier-1 automation', fmtPct(periodAvg('automation_rate_pct')), `${ppChange(cmp.automation.delta)} since week 1`, cmp.automation.delta > 0,
        `Final week ${fmtPct(cmp.automation.last)}; 70% reached from ${fmtDay(m.firstAutomation70)}`],
      ['Avg handle time', fmtMinSec(periodAvg('avg_handle_time_min')), `${fmtMinSec(cmp.aht.first)} → ${fmtMinSec(cmp.aht.last)}, week 1 → week 4`, cmp.aht.delta < 0,
        '−35% vs pre-launch baseline (1)'],
      ['CSAT', periodAvg('csat_score').toFixed(1), `${cmp.csat.first.toFixed(1)} → ${cmp.csat.last.toFixed(1)}, week 1 → week 4`, cmp.csat.delta > 0,
        '+12 pts vs pre-launch baseline (1)'],
      ['Requests / day', fmtCompact(periodAvg('requests')), `${pctChange(cmp.req.deltaPct)} since week 1`, null, `${fmtInt(m.totalRequests)} in August`],
      ['Availability', fmtPct2(m.avgAvailability), `${TARGET}% met on ${m.daysAtTarget} of ${days.length} days`, null,
        `Lowest ${fmtPct2(m.worstAvailability.availability_pct)} on ${fmtDay(m.worstAvailability.date)}`],
      ['P50 / P95 latency', `${fmtMs(periodAvg('p50_latency_ms'))} / ${fmtMs(periodAvg('p95_latency_ms'))}`, `P95 ${fmtSigned(cmp.p95.delta, fmtMs)} since week 1`, cmp.p95.delta < 0,
        `P50 ${fmtSigned(cmp.p50.delta, fmtMs)} since week 1`],
      ['Eval pass rate', fmtPct(periodAvg('quality_eval_pass_rate_pct')), `${ppChange(cmp.evalPass.delta)} since week 1`, cmp.evalPass.delta > 0,
        `Grounded answers ${fmtPct(periodAvg('grounded_answer_rate_pct'))}`],
      ['Escalation rate', fmtPct(periodAvg('escalation_rate_pct')), `${ppChange(cmp.escalation.delta)} since week 1`, cmp.escalation.delta < 0,
        `Final week ${fmtPct(cmp.escalation.last)}`],
    ];
    const gy = CT, gh = 4.2, tw = CW / 4, th = gh / 2;
    box(s, M, gy, CW, gh, T.tint, T.border, R, 'headline-metrics');
    for (let c = 1; c < 4; c++) vline(s, M + c * tw, gy, gh);
    hline(s, M, gy + th, CW);
    tiles.forEach(([lab, value, delta, good, sub], i) => {
      const x = M + (i % 4) * tw + 0.24, y = gy + Math.floor(i / 4) * th + 0.28, w = tw - 0.4;
      label(s, lab, { x, y, w, h: 0.22, fontSize: 11 });
      text(s, value, { x, y: y + 0.33, w, h: 0.6, fontFace: MEDIUM, fontSize: value.length > 10 ? 23 : 28, color: T.ink, charSpacing: -1.1, valign: 'bottom' });
      text(s, delta, { x, y: y + 1.0, w, h: 0.24, fontSize: 10, color: tone(good) });
      text(s, sub, { x, y: y + 1.28, w, h: 0.5, fontSize: 9.5, color: T.gray });
    });
    text(s, '(1) The −35% handle-time and +12-point CSAT figures compare against Northstar’s pre-launch baselines, which are not in the August dataset; the in-month trends are measured directly.', {
      x: M, y: gy + gh + 0.18, w: CW, h: 0.3, fontSize: 9.5, color: T.gray,
    });
    s.addNotes(`Open with the outcome and give the caveat in the same breath. Tier-1 automation averaged ${fmtPct(periodAvg('automation_rate_pct'))} in August and reached ${fmtPct(cmp.automation.last)} in the final week; 70% was first reached on ${fmtDay(m.firstAutomation70)}. Handle time fell from ${fmtMinSec(cmp.aht.first)} to ${fmtMinSec(cmp.aht.last)} and CSAT rose from ${cmp.csat.first.toFixed(1)} to ${cmp.csat.last.toFixed(1)} within the month. The −35% and +12 points are against Northstar’s own pre-launch baselines, which we’ll validate together. These are the same tiles, on the same basis, as the Outcomes view of the dashboard.`);
  }

  // ================================================================ 3. Operational health
  {
    const h = m.health;
    const s = content('Results', 'Outcomes',
      'Operational health is on-track for current deployment stage',
      'A strong start on all four operational pillars, each scored 1–5 on full-period averages for August. ');
    const py = CT, ph = 4.3, sw = 3.55;
    box(s, M, py, CW, ph, T.white, null, R);
    s.addShape(pres.ShapeType.roundRect, { x: M, y: py, w: sw + R, h: ph, rectRadius: R, fill: { color: T.tint }, line: { type: 'none' } });
    rect(s, M + sw - 0.01, py, R + 0.02, ph, T.white);
    vline(s, M + sw, py, ph);
    box(s, M, py, CW, ph, null, T.border, R, 'operational-health');
    label(s, 'Operational health, 1–5', { x: M + 0.32, y: py + 0.34, w: sw - 0.6, h: 0.24, fontSize: 11, color: T.purple500 });
    text(s, [
      { text: h.score.toFixed(2), options: { fontFace: MEDIUM, fontSize: 60, color: T.ink, charSpacing: -2.4 } },
      { text: ' / 5', options: { fontSize: 18, color: T.gray } },
    ], { x: M + 0.32, y: py + 0.72, w: sw - 0.5, h: 1.05, valign: 'bottom' });
    label(s, 'Basis', { x: M + 0.32, y: py + 2.05, w: sw - 0.6, h: 0.2, fontSize: 9.5 });
    text(s, `Full-period averages (${fmtDay(h.window.from)} – ${fmtDay(h.window.to)}, ${h.window.days} days)`, { x: M + 0.32, y: py + 2.3, w: sw - 0.6, h: 0.5, fontSize: 11.5, color: T.body });

    const rx = M + sw, rw = CW - sw, rh = ph / h.pillars.length;
    h.pillars.forEach((p, i) => {
      const y = py + i * rh;
      if (i) hline(s, rx, y, rw);
      const sq = 0.5, iy = y + (rh - sq) / 2;
      rect(s, rx + 0.3, iy, sq, sq, T.purple);
      s.addImage({ data: icons[p.key], x: rx + 0.3 + 0.12, y: iy + 0.12, w: 0.26, h: 0.26, altText: p.name });
      text(s, p.name, { x: rx + 1.05, y: y + rh / 2 - 0.32, w: 4.6, h: 0.3, fontFace: MEDIUM, fontSize: 15, color: T.ink });
      text(s, p.summary, { x: rx + 1.05, y: y + rh / 2 + 0.02, w: 5.2, h: 0.3, fontSize: 11.5, color: T.gray });
      const pw = pips(s, rx + rw - 2.05, y + rh / 2 - 0.085, p.score);
      text(s, p.score.toFixed(1), { x: rx + rw - 2.05 + pw + 0.18, y: y + rh / 2 - 0.2, w: 0.6, h: 0.4, fontFace: MEDIUM, fontSize: 18, color: T.ink, valign: 'middle' });
    });
    s.addNotes(`This is the Operational health panel from the dashboard. ${h.pillars.map((p) => `${p.name} ${p.score.toFixed(1)}`).join(', ')}; ${h.score.toFixed(2)} overall. Model quality and user outcomes are strongest. Adoption and reliability are where the work is. Adoption is a 3 because automation averaged ${fmtPct(periodAvg('automation_rate_pct'))}, just under the 70% band, although it finished the month above it. Reliability is a 3.3, and the reliability slide deals with it honestly.`);
  }

  // ================================================================ 5. Reliability and cost
  {
    const s = content('Results', 'Service reliability', 'Find the cause before buying capacity',
      `Availability averaged ${fmtPct2(m.avgAvailability)} and met ${TARGET}% on ${m.daysAtTarget} of ${days.length} days, so the gap is not only the two incident days. Daily metrics can’t show why; deployment telemetry can.`);
    const lw = 6.0, ch = 4.25;
    chartCard(s, {
      x: M, y: CT, w: lw, h: ch, name: 'chart-availability',
      title: 'Availability',
      headline: `Averaged ${fmtPct2(m.avgAvailability)}; ${TARGET}% met on ${m.daysAtTarget} of ${days.length} days, all in the final week. ${TARGET}% is a proposed target; no SLA was in place for August.`,
      series: [{ key: 'availability_pct', name: 'Availability', color: T.purple }],
      min: 99.6, max: 100, unit: 0.1, format: '0.0"%"', refs: [{ y: TARGET, label: `${TARGET}% proposed target` }],
    });
    const ox = M + lw + 0.3, ow = CW - lw - 0.3, og = 0.14, oh = (ch - 2 * og) / 3;
    const options = [
      ['Recommended now', 'good', 'Diagnose and tune', 'Review deployment telemetry together (scale-up events, error codes by hour), retune scale-up thresholds and pre-warm before promotions.', 'Bill stays approx. $1.4k/month at current traffic'],
      ['Only if the data shows it', 'warn', 'Always-on capacity for Atlas alone', `Approx. ${round100(lib.WARM_H100_MONTH)}/month, or ${round100(lib.WARM_H100_MONTH_EU)} with EU-only placement.`, 'Justified only if scale-up is driving the misses'],
      ['With expansion', 'purple', 'Shared five-brand deployment', `Always-on capacity shared by ${lib.BRANDS_ON_SHARED_DEPLOYMENT} brands, billed as dedicated capacity: approx. ${round100(lib.WARM_H100_MONTH / lib.BRANDS_ON_SHARED_DEPLOYMENT)}–${round100(lib.WARM_H100_MONTH_EU / lib.BRANDS_ON_SHARED_DEPLOYMENT)} per brand per month.`, 'Baseline capacity is affordable once shared'],
    ];
    options.forEach(([tag, kind, head, body, foot], i) => {
      const y = CT + i * (oh + og);
      box(s, ox, y, ow, oh, i === 2 ? T.tint : T.white, i === 2 ? T.purple200 : T.border, R, `option-${i + 1}`);
      pill(s, ox + 0.22, y + 0.16, tag, kind);
      text(s, head, { x: ox + 0.22, y: y + 0.46, w: ow - 0.44, h: 0.26, fontFace: MEDIUM, fontSize: 13, color: T.ink });
      text(s, [
        { text: body, options: { color: T.body, breakLine: true } },
        { text: foot, options: { color: T.gray } },
      ], { x: ox + 0.22, y: y + 0.75, w: ow - 0.44, h: 0.5, fontSize: 9.5 });
    });
    text(s, 'Capacity figures at Fireworks list rates as of 5 Oct 2026; contracted terms may differ.', { x: M, y: CT + ch + 0.18, w: CW, h: 0.25, fontSize: 9.5, color: T.gray });
    s.addNotes(`Be precise about what we know. Availability averaged ${fmtPct2(m.avgAvailability)} and met ${TARGET}% on only ${m.daysAtTarget} of ${days.length} days, so this is not just the two incident days. At 19,000 to 31,000 requests a day Atlas is unlikely to sit idle at zero for long, so we should not assume cold starts are the cause. The next step is the deployment telemetry: scale-up events and error codes by hour. Meanwhile we retune scale-up thresholds and pre-warm before planned promotions. Always-on capacity for Atlas alone would be about ${round100(lib.WARM_H100_MONTH)} a month, ${round100(lib.WARM_H100_MONTH_EU)} with EU-only placement; we would only recommend it if the telemetry shows scale-up is driving the misses. On the shared deployment the same capacity is about ${round100(lib.WARM_H100_MONTH / lib.BRANDS_ON_SHARED_DEPLOYMENT)} to ${round100(lib.WARM_H100_MONTH_EU / lib.BRANDS_ON_SHARED_DEPLOYMENT)} per brand.`);
  }

  // ================================================================ 6. Architecture
  pres.addSection({ title: 'Expansion' });
  {
    const s = content('Expansion', 'Next steps', 'One base model, one adapter per brand, data kept apart',
      'Each brand keeps its own voice, knowledge and data on a single shared deployment.');
    const dx = M, dy = CT, dw = 8.75, dh = 4.4;
    box(s, dx, dy, dw, dh, T.tint, T.border, R, 'shared-deployment');
    label(s, 'Shared deployment', { x: dx + 0.28, y: dy + 0.24, w: 4, h: 0.22, fontSize: 11, color: T.purple500 });
    rect(s, dx + 0.28, dy + 0.58, dw - 0.56, 0.56, T.purple);
    text(s, 'Open-weight base model', { x: dx + 0.28, y: dy + 0.58, w: dw - 0.56, h: 0.56, fontFace: MEDIUM, fontSize: 14, color: T.white, align: 'center', valign: 'middle' });
    const brands = [
      ['Atlas', 'Live', 'good', 'Existing adapter, unchanged'],
      ['Ridgeline', 'Pilot', 'purple', 'New adapter'],
      ['Halden', 'Wave 2', 'chip', 'New adapter; own deployment later'],
      ['Polar', 'Wave 2', 'chip', 'New adapter'],
      ['Harbour & Hide', 'Wave 3', 'chip', 'New adapter'],
    ];
    const g = 0.14, bw = (dw - 0.56 - g * 4) / 5, top = dy + 1.32, bh = dh - 1.6;
    brands.forEach(([name, stage, kind, note], i) => {
      const x = dx + 0.28 + i * (bw + g);
      box(s, x, top, bw, bh, T.white, T.border, 0.08);
      text(s, name, { x: x + 0.12, y: top + 0.16, w: bw - 0.2, h: 0.26, fontFace: MEDIUM, fontSize: 11.5, color: T.ink });
      pill(s, x + 0.12, top + 0.5, stage, kind, 9);
      text(s, note, { x: x + 0.12, y: top + 0.86, w: bw - 0.24, h: 0.5, fontSize: 9.5, color: T.gray });
      ['Brand adapter', 'Knowledge index', 'System prompt'].forEach((layer, j) => {
        const ly = top + 1.42 + j * 0.44;
        s.addShape(pres.ShapeType.rect, { x: x + 0.12, y: ly, w: bw - 0.24, h: 0.36, fill: { color: j === 0 ? T.purple25 : T.white }, line: { color: j === 0 ? T.purple200 : T.border, width: 0.75 } });
        text(s, layer, { x: x + 0.12, y: ly, w: bw - 0.24, h: 0.36, fontSize: 9.5, color: T.ink, align: 'center', valign: 'middle' });
      });
    });
    const rx = M + dw + 0.4, rw = CW - dw - 0.4;
    const side = [
      [T.marine, 'Data isolation', 'Each brand’s catalogue and policy facts sit in its own knowledge index; each adapter is trained on that brand’s transcripts.'],
      [T.purple, 'Why not reuse Atlas with a new prompt?', 'Atlas’s tone and policy-handling habits are learned into its adapter and would leak into other brands.'],
      [T.purple, 'Why not five separate models?', 'Five deployments to run and retrain, and the smaller brands lack the data to train them well.'],
    ];
    side.forEach(([color, head, body], i) => {
      const y = CT + 0.05 + i * 1.5;
      rect(s, rx, y + 0.06, 0.13, 0.13, color);
      text(s, [
        { text: head, options: { fontFace: MEDIUM, fontSize: 13, color: T.ink, breakLine: true } },
        { text: body, options: { fontSize: 11, color: T.gray } },
      ], { x: rx + 0.3, y, w: rw - 0.3, h: 1.35, paraSpaceAfter: 4 });
    });
    s.addNotes('The architecture: one open-weight base model on a shared deployment, one adapter per brand for tone, workflow and policy-following behaviour, and a separate knowledge index and system prompt per brand. Policy facts such as return windows live in the index, not the weights, so they can change without retraining. Atlas’s adapter moves over unchanged. Halden, the largest brand, can move to its own deployment once its volume keeps capacity busy. Why not reuse Atlas with a new prompt: its tone and policy-handling habits are learned and would leak. Why not five separate models: five deployments to run and retrain, and the smaller brands don’t have enough transcripts.');
  }

  // ================================================================ 7. Pilot
  {
    const P = lib.PILOT;
    const s = content('Expansion', 'Next steps', `${P.brand} pilot: two arms, criteria agreed up front`, P.why);
    const aw = 5.45, ah = 1.95, ag = 0.25;
    const arms = [
      ['Arm A · Lowest cost', 'good', P.arms[0].setup, 'No brand-specific training. If it clears every criterion, no adapter is needed.'],
      ['Arm B · Brand-tuned', 'purple', P.arms[1].setup, 'Tone, workflow and policy-following learned from Ridgeline transcripts; policy facts stay in the knowledge index.'],
    ];
    arms.forEach(([tag, kind, setup, note], i) => {
      const y = CT + i * (ah + ag);
      box(s, M, y, aw, ah, i ? T.tint : T.white, i ? T.purple200 : T.border, R, `arm-${i ? 'b' : 'a'}`);
      pill(s, M + 0.25, y + 0.24, tag, kind);
      text(s, setup, { x: M + 0.25, y: y + 0.62, w: aw - 0.5, h: 0.55, fontFace: MEDIUM, fontSize: 13, color: T.ink });
      text(s, note, { x: M + 0.25, y: y + 1.2, w: aw - 0.5, h: 0.6, fontSize: 11, color: T.gray });
    });
    // Criteria table, styled as the dashboard's .table.
    const tx = M + aw + 0.35, tw = CW - aw - 0.35, hh = 0.42, rh = 0.6;
    const rows = P.criteria.map((c) => [c.metric, c.target.replace('Atlas week-4', 'Atlas final week')]);
    const th = hh + rh * rows.length;
    box(s, tx, CT, tw, th, T.white, null, R);
    s.addShape(pres.ShapeType.round2SameRect, { x: tx, y: CT, w: tw, h: hh, fill: { color: T.tint }, line: { type: 'none' } });
    hline(s, tx, CT + hh, tw);
    label(s, 'Success criterion, four weeks', { x: tx + 0.22, y: CT, w: tw * 0.5, h: hh, fontSize: 9.5, valign: 'middle' });
    label(s, 'Target', { x: tx + tw * 0.5, y: CT, w: tw * 0.5 - 0.2, h: hh, fontSize: 9.5, valign: 'middle' });
    rows.forEach(([metric, target], i) => {
      const y = CT + hh + i * rh;
      if (i) hline(s, tx, y, tw);
      text(s, metric, { x: tx + 0.22, y, w: tw * 0.5 - 0.3, h: rh, fontFace: MEDIUM, fontSize: 11.5, color: T.ink, valign: 'middle' });
      text(s, target, { x: tx + tw * 0.5, y, w: tw * 0.5 - 0.2, h: rh, fontSize: 11.5, color: T.body, valign: 'middle' });
    });
    box(s, tx, CT, tw, th, null, T.border, R, 'pilot-criteria');
    text(s, 'Wave 2 goes ahead when one arm clears every criterion. The arm is chosen on quality, and Ridgeline’s handle-time and CSAT baselines are captured before launch so the uplift is measured directly.', {
      x: tx, y: CT + th + 0.18, w: tw, h: 0.62, fontSize: 10, color: T.gray,
    });
    s.addNotes('The pilot gives the cheapest option a fair test. Arm A uses no brand-specific training; if it clears every criterion, we skip the adapter. Arm B adds a Ridgeline adapter. Both run for four weeks against criteria we agree today. We also capture Ridgeline’s baselines before launch, so the uplift is measured directly rather than relying on supplied figures.');
  }

  // ================================================================ 8. Sequence and budget
  {
    const s = content('Expansion', 'Next steps', 'From pilot to five brands by mid-2027',
      'Each step has a gate; wave 2 starts only after the pilot readout.');
    const steps = [
      ['Oct 2026', 'Executive review, sponsor and dependencies', true],
      ['Nov 2026', 'Shared deployment live; Atlas parity; Ridgeline adapter', true],
      ['Nov–Dec', 'Ridgeline pilot, four weeks', true],
      ['Jan 2027', 'Readout and wave-2 decision', true],
      ['Q1 2027', 'Halden and Polar', false],
      ['Q2 2027', 'Harbour & Hide', false],
    ];
    const ty = CT + 0.2, sw = CW / steps.length;
    hline(s, M, ty + 0.09, CW, T.border, 1.5);
    steps.forEach(([when, what, near], i) => {
      const x = M + i * sw;
      rect(s, x, ty, 0.18, 0.18, near ? T.purple : T.purple25);
      text(s, when, { x, y: ty + 0.36, w: sw - 0.2, h: 0.28, fontFace: MEDIUM, fontSize: 13, color: T.ink });
      text(s, what, { x, y: ty + 0.68, w: sw - 0.25, h: 0.8, fontSize: 10.5, color: T.gray });
    });
    const budget = [
      ['Pilot window', `Approx. ${round100(lib.WARM_H100_MONTH)}–${round100(lib.WARM_H100_MONTH_EU)}/month for the shared deployment, billed as dedicated capacity (EU-only placement is the upper figure). Adapter training cost is immaterial.`],
      ['Steady state', 'One always-on deployment shared by Atlas, Ridgeline, Polar and Harbour & Hide; a second for Halden once its volume justifies it. Replica count is sized from a load benchmark.'],
      ['Migration overlap', 'Atlas runs on both deployments while it moves over, with rollback at every step. Budgeted in weeks, not months.'],
    ];
    const g = 0.3, cw = (CW - 2 * g) / 3, by = CT + 1.85, bh = 1.95;
    budget.forEach(([head, body], i) => {
      const x = M + i * (cw + g);
      box(s, x, by, cw, bh, T.tint, T.border, R, `budget-${i + 1}`);
      label(s, head, { x: x + 0.25, y: by + 0.25, w: cw - 0.5, h: 0.22, fontSize: 10.5 });
      text(s, body, { x: x + 0.25, y: by + 0.56, w: cw - 0.5, h: bh - 0.75, fontSize: 11.5, color: T.body });
    });
    text(s, 'Capacity figures at Fireworks list rates as of 5 Oct 2026; contracted terms may differ.', { x: M, y: by + bh + 0.18, w: CW, h: 0.25, fontSize: 9.5, color: T.gray });
    s.addNotes(`Sequence: agree the sponsor and dependencies this month, stand up the shared deployment and prove Atlas parity in November, run the Ridgeline pilot through December, read out in January, then Halden and Polar in Q1 and Harbour & Hide in Q2. Budget: the shared deployment is billed as dedicated capacity, about ${round100(lib.WARM_H100_MONTH)} a month for one replica, ${round100(lib.WARM_H100_MONTH_EU)} with EU-only placement; training cost is immaterial. The number of replicas is sized from a load benchmark before we commit. The overlap while Atlas moves is budgeted in weeks.`);
  }

  // ================================================================ 9. Decision
  pres.addSection({ title: 'Decision' });
  {
    const s = content('Decision', 'Next steps', 'Biggest risk: the rollout stalls at one brand',
      'The risk is commercial and organisational rather than technical: month one worked, but no one owns the rollout above brand level yet.');
    const lw = 5.6, lh = 4.35;
    box(s, M, CT, lw, lh, T.tint, T.border, R, 'biggest-risk');
    text(s, 'Without group-level sponsorship the rollout stays with Atlas, and shared capacity never carries enough volume to make per-brand cost efficient.', {
      x: M + 0.28, y: CT + 0.22, w: lw - 0.56, h: 1.3, fontFace: MEDIUM, fontSize: 16, color: T.ink,
    });
    label(s, 'Why it matters', { x: M + 0.28, y: CT + 1.62, w: 3, h: 0.22, fontSize: 10.5 });
    const perBrand = `${round100(lib.WARM_H100_MONTH / lib.BRANDS_ON_SHARED_DEPLOYMENT)}–${round100(lib.WARM_H100_MONTH_EU / lib.BRANDS_ON_SHARED_DEPLOYMENT)}`;
    [
      `Always-on capacity stays a single-brand cost (approx. ${round100(lib.WARM_H100_MONTH)}/month) rather than ${perBrand} per brand shared.`,
      'The four sister brands, with most of the group’s Tier-1 volume, don’t get the gains Atlas has shown.',
      'Each brand would make its own platform decision, so the group ends up with several tools to run at a meaningfully higher cost.',
    ].forEach((t, i) => {
      const y = CT + 1.97 + i * 0.6;
      rect(s, M + 0.3, y + 0.09, 0.11, 0.11, T.red);
      text(s, t, { x: M + 0.58, y, w: lw - 0.9, h: 0.5, fontSize: 11, color: T.body });
    });

    const kx = M + lw + 0.35, kw = CW - lw - 0.35;
    box(s, kx, CT, kw, lh, T.white, T.border, R, 'mitigation');
    label(s, 'How we mitigate it', { x: kx + 0.28, y: CT + 0.28, w: 3, h: 0.22, fontSize: 10.5 });
    const steps = [
      ['Name a group sponsor at this review', 'Someone above brand level who owns the rollout and the wave-2 decision.', '22 Oct'],
      ['Agree the Ridgeline pilot criteria together', 'Success is defined jointly up front, so the readout is a decision rather than a debate.', '22 Oct'],
      ['Size shared capacity with a second brand', 'Capacity is committed with Ridgeline from a load benchmark, never for Atlas alone.', 'Nov 2026'],
    ];
    const rh = (lh - 0.65) / steps.length;
    steps.forEach(([head, body, due], i) => {
      const y = CT + 0.62 + i * rh;
      if (i) hline(s, kx + 0.28, y, kw - 0.56);
      rect(s, kx + 0.3, y + 0.24, 0.12, 0.12, T.purple);
      text(s, head, { x: kx + 0.6, y: y + 0.16, w: kw - 1.9, h: 0.3, fontFace: MEDIUM, fontSize: 13, color: T.ink });
      text(s, due, { x: kx + kw - 1.3, y: y + 0.16, w: 1.02, h: 0.3, fontFace: MEDIUM, fontSize: 11, color: T.purple500, align: 'right' });
      text(s, body, { x: kx + 0.6, y: y + 0.5, w: kw - 0.9, h: rh - 0.6, fontSize: 11, color: T.gray });
    });
    s.addNotes('Close on the one risk that matters. The platform worked in month one; the risk is that nobody above brand level owns the rollout, so it stays with Atlas. If that happens, always-on capacity stays a single-brand cost, the sister brands, which carry most of the Tier-1 volume, don’t get the gains, and each brand makes its own tooling decision. The mitigation is three concrete asks: a named group sponsor at this review, the Ridgeline criteria agreed together, and shared capacity sized alongside a second brand from a load benchmark, never for Atlas alone.');
  }

  // ================================================================ 10. Closing
  pres.addSection({ title: 'Close' });
  {
    const s = pres.addSlide({ masterName: 'CLOSING', sectionTitle: 'Close' });
    text(s, 'Next steps', { x: M + LOGO_H * LOGO_RATIO + 0.48, y: 0.24, w: 3.5, h: 0.3, fontFace: MEDIUM, fontSize: 11, color: T.ink, valign: 'middle' });
    text(s, 'Thank you', { x: M, y: 1.5, w: 6, h: 1.0, fontFace: MEDIUM, fontSize: 54, color: T.ink, charSpacing: -2.2 });
    text(s, 'Q&A', { x: M, y: 2.55, w: 6, h: 0.45, fontSize: 20, color: T.gray });
    pixels(s, M, 1.5 + 0.4 + 0.62 * lib.JOINT_ACTIONS.length - (5 * 0.31 - 0.07));
    // Joint next actions, as on the dashboard's Next steps view.
    const tx = M + 5.0, tw = CW - 5.0, hh = 0.4, rh = 0.62;
    const rows = lib.JOINT_ACTIONS;
    const ty = 1.5, th = hh + rh * rows.length;
    label(s, 'Joint next actions', { x: tx, y: ty - 0.4, w: 4, h: 0.24, fontSize: 11, color: T.purple500 });
    box(s, tx, ty, tw, th, T.white, null, R);
    s.addShape(pres.ShapeType.round2SameRect, { x: tx, y: ty, w: tw, h: hh, fill: { color: T.tint }, line: { type: 'none' } });
    hline(s, tx, ty + hh, tw);
    const cols = [[0.2, 3.5, 'Action'], [3.85, 1.95, 'Owner'], [tw - 0.92, 0.8, 'Due']];
    cols.forEach(([cx, cwid, h]) => label(s, h, { x: tx + cx, y: ty, w: cwid, h: hh, fontSize: 9.5, valign: 'middle' }));
    rows.forEach((a, i) => {
      const y = ty + hh + i * rh;
      if (i) hline(s, tx, y, tw);
      text(s, a.action, { x: tx + cols[0][0], y, w: cols[0][1], h: rh, fontSize: 10.5, color: T.ink, valign: 'middle' });
      text(s, a.owner, { x: tx + cols[1][0], y, w: cols[1][1], h: rh, fontSize: 9, color: T.gray, valign: 'middle' });
      text(s, a.due, { x: tx + cols[2][0], y, w: cols[2][1], h: rh, fontFace: MEDIUM, fontSize: 10.5, color: T.ink, valign: 'middle' });
    });
    box(s, tx, ty, tw, th, null, T.border, R, 'joint-next-actions');
    s.addNotes('Thank you. These are the joint next actions from the Next steps view of the dashboard, with owners and dates, so everyone leaves with the same list. Open the floor for questions.');
  }

  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME, REF_SERIES);
  console.log('wrote', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
