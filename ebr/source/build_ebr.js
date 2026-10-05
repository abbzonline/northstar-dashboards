// Northstar Retail Group — EBR, October 2026. Builds ebr/Northstar_EBR_Oct2026.pptx.
// Every figure matches the customer dashboard (customer-health/) and docs/ARCHITECTURE.md.
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { applyTheme } = require('C:/Users/abuba/.claude/skills/synced/934e2359-dd25-4210-bed2-cde926f604b2_5941bc14-2279-4f64-bb78-27b933b1678b/pptx/scripts/apply_theme.js');

const OUT = process.argv[2];
const LOGO_DARK = 'image/png;base64,' + fs.readFileSync(path.join(__dirname, 'logo-dark.png')).toString('base64');
const LOGO_LIGHT = 'image/png;base64,' + fs.readFileSync(path.join(__dirname, 'logo-light.png')).toString('base64');

// Fireworks tokens (shared/src/theme/tokens.ts).
const THEME = {
  name: 'Fireworks',
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '16181D', // ink
    lt1: 'FFFFFF',
    dk2: '1B0052', // purple-900
    lt2: 'FAF7FF', // surface tint
    accent1: '6720FF', // brand purple
    accent2: '1DA28F', // marine-700
    accent3: '1756FF', // blue-300
    accent4: '9D72FE', // purple-200
    accent5: 'F14539', // red-500
    accent6: 'E3A53A', // amber (only off-brand colour)
    hlink: '6720FF',
    folHlink: '501BC4',
  },
};
const GRAY = '5A5E63';
const BORDER = 'E6EAF4';
const DARK_CARD = '2A0A78';
const LAVENDER = 'CEB4FF';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = 'Northstar Retail Group — Executive Business Review, October 2026';
pres.author = 'Fireworks AI';
pres.company = 'Fireworks AI';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const W = 13.333;
const M = 0.6; // side margin
const CW = W - 2 * M; // content width

// ---------------------------------------------------------------- layouts
function layout(name, dark) {
  pres.defineSlideMaster({
    title: name,
    background: { color: dark ? THEME.colors.dk2 : 'FFFFFF' },
    objects: [
      { rect: { x: M, y: 0.62, w: 0.09, h: 0.09, fill: { color: dark ? LAVENDER : '501BC4' } } },
      {
        placeholder: {
          options: { name: 'eyebrow', type: 'body', x: M + 0.17, y: 0.5, w: 9, h: 0.32, fontSize: 12, bold: true, color: dark ? LAVENDER : C.text1, charSpacing: 1.5, margin: 0, valign: 'middle' },
          text: '',
        },
      },
      {
        placeholder: {
          options: { name: 'title', type: 'title', x: M, y: 0.88, w: CW, h: 0.9, fontSize: 34, bold: true, color: dark ? C.background1 : C.text1, margin: 0, valign: 'top', align: 'left' },
          text: '',
        },
      },
      { image: { x: M, y: 6.93, w: 1.48, h: 0.19, data: dark ? LOGO_LIGHT : LOGO_DARK } },
      {
        text: {
          text: 'Northstar Retail Group · Executive Business Review · October 2026',
          options: { x: 4.2, y: 6.88, w: 7.9, h: 0.3, fontSize: 10, color: dark ? LAVENDER : GRAY, align: 'right', margin: 0, valign: 'middle' },
        },
      },
    ],
    slideNumber: { x: 12.3, y: 6.88, w: 0.43, h: 0.3, fontSize: 10, color: dark ? LAVENDER : GRAY, align: 'right' },
  });
}
layout('CONTENT', false);
layout('DARK', true);

function slide(master, section, eyebrow, title) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s.addText(eyebrow.toUpperCase(), { placeholder: 'eyebrow' });
  s.addText(title, { placeholder: 'title' });
  return s;
}

// Square "pip" motif, as in the dashboards.
function pip(s, x, y, color, size = 0.13) {
  s.addShape(pres.ShapeType.rect, { x, y, w: size, h: size, fill: { color }, line: { color, width: 0 } });
}

function card(s, x, y, w, h, fill, line) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: fill },
    line: { color: line ?? fill, width: 0.75 },
  });
}

// ---------------------------------------------------------------- 1. Month one
pres.addSection({ title: 'Results' });
{
  const s = slide('DARK', 'Results', '01 · Month one on Atlas', 'Atlas automated 70% of Tier-1 support by month end');
  const stats = [
    ['70.1%', 'Tier-1 automation, final week', '67.9% August average; 70% reached from 27 Aug'],
    ['7.41 min', 'Avg handle time, final week', '8.05 min in week 1; −35% vs Northstar’s pre-launch baseline'],
    ['83.7', 'CSAT, final week', '80.8 in week 1; +12 pts vs Northstar’s pre-launch baseline'],
    ['99.85%', 'Availability, August', 'Dips on 9 Aug (catalogue sync) and 21 Aug (promotion traffic)'],
  ];
  const gap = 0.3;
  const cw = (CW - gap * 3) / 4;
  stats.forEach(([big, label, detail], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.25, cw, 3.55, DARK_CARD);
    pip(s, x + 0.3, 2.6, i === 3 ? THEME.colors.accent6 : '00E6CC');
    s.addText(big, { x: x + 0.3, y: 2.95, w: cw - 0.6, h: 0.95, fontSize: 36, bold: true, color: C.background1, margin: 0, isTextBox: true, fit: 'shrink', objectName: `stat-${i}` });
    s.addText(label, { x: x + 0.3, y: 3.95, w: cw - 0.6, h: 0.5, fontSize: 14, bold: true, color: C.background1, margin: 0, isTextBox: true });
    s.addText(detail, { x: x + 0.3, y: 4.5, w: cw - 0.6, h: 1.1, fontSize: 13, color: LAVENDER, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addText('In-month figures are measured from August data (week 1 = 1–7 Aug; final week = 25–31 Aug). The −35% and +12-point figures compare against Northstar’s pre-launch baselines, which are not in the August dataset.', {
    x: M, y: 6.05, w: CW, h: 0.55, fontSize: 11, color: LAVENDER, margin: 0, isTextBox: true,
  });
  s.addNotes('Open with the outcome, and give the caveat in the same breath. 70% of Tier-1 volume is the month-end figure: the August average is 67.9%, and 70% was first reached on 27 Aug. Handle time and CSAT improved within the month; the headline −35% and +12 points depend on Northstar’s own pre-launch baselines, which we will validate together. Availability was 99.85%, with two named dips: the catalogue sync on 9 Aug and the promotion traffic on 21 Aug.');
}

// ---------------------------------------------------------------- 2. What the numbers mean
{
  const s = slide('CONTENT', 'Results', '02 · What the numbers mean', 'Quality improved every week; adoption is still rising');
  card(s, M, 2.05, 6.6, 4.55, THEME.colors.lt2, BORDER);
  s.addText('Answer quality by week', { x: M + 0.3, y: 2.25, w: 6, h: 0.35, fontSize: 15, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addChart(pres.ChartType.line, [
    { name: 'Grounded answers (92.2% → 96.0%)', labels: ['Week 1', 'Week 2', 'Week 3', 'Final week'], values: [92.2, 93.0, 94.0, 96.0] },
    { name: 'Eval pass rate (91.4% → 94.8%)', labels: ['Week 1', 'Week 2', 'Week 3', 'Final week'], values: [91.4, 92.3, 93.4, 94.8] },
  ], {
    x: M + 0.15, y: 2.65, w: 6.3, h: 3.8,
    chartColors: [THEME.colors.accent1, THEME.colors.accent2],
    lineSize: 2.5, lineDataSymbol: 'circle', lineDataSymbolSize: 7,
    valAxisMinVal: 88, valAxisMaxVal: 98, valAxisMajorUnit: 2,
    valAxisLabelFormatCode: '0"%"',
    valAxisLabelColor: GRAY, catAxisLabelColor: GRAY, valAxisLabelFontSize: 11, catAxisLabelFontSize: 11,
    valAxisLabelFontFace: '+mn-lt', catAxisLabelFontFace: '+mn-lt',
    valGridLine: { color: BORDER, size: 0.75 }, catGridLine: { style: 'none' },
    showValue: false,
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: '+mn-lt', legendColor: C.text1,
  });

  const rows = [
    ['Adoption is still rising', 'Automation 65.8% → 70.1% from week 1 to the final week, with no plateau yet.', THEME.colors.accent1],
    ['Fewer handoffs to agents', 'Escalations 14.2% → 11.5% as grounding improved after the 24 Aug knowledge refresh.', THEME.colors.accent2],
    ['Availability missed 99.9% most days', 'Met on 4 of 31 days, all in the final week. Cause under review (next slide).', THEME.colors.accent6],
    ['Requests per ticket 4.6 → 6.2', 'Worth a joint review, not an alarm: longer conversations, repeat contacts or non-ticket traffic.', GRAY],
  ];
  const x0 = M + 6.95;
  rows.forEach(([head, body, color], i) => {
    const y = 2.1 + i * 1.12;
    pip(s, x0, y + 0.08, color, 0.16);
    s.addText(head, { x: x0 + 0.35, y, w: CW - 6.95 - 0.35, h: 0.33, fontSize: 15, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: x0 + 0.35, y: y + 0.36, w: CW - 6.95 - 0.35, h: 0.66, fontSize: 13, color: GRAY, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes('Quality moved in one direction all month: grounding 92.2% to 96.0%, eval pass 91.4% to 94.8%, escalations 14.2% to 11.5%. Automation is still climbing, so the 70% is not a ceiling. Two honest flags: availability met 99.9% on only 4 days, which the next slide addresses, and requests per ticket rose from 4.6 to 6.2. That second one is for a joint review: it could be longer conversations, repeat contacts or traffic that isn’t tied to a ticket.');
}

// ---------------------------------------------------------------- 3. Reliability and cost
{
  const s = slide('CONTENT', 'Results', '03 · Reliability and cost', 'Find the cause before buying capacity');
  s.addText('Availability averaged 99.85% and fell short of 99.9% on 27 of 31 days, not only on the two incident days. Daily metrics can’t show why, so we diagnose from deployment telemetry before changing capacity.', {
    x: M, y: 1.95, w: CW, h: 0.65, fontSize: 15, color: C.text1, margin: 0, isTextBox: true,
  });
  const opts = [
    ['RECOMMENDED NOW', THEME.colors.accent2, 'Diagnose and tune', ['Review deployment telemetry together', 'Retune scale-up; pre-warm before promotions'], 'Bill stays ~$1.4k/month at current traffic'],
    ['ONLY IF THE DATA SHOWS IT', THEME.colors.accent5, 'Always-on capacity for Atlas alone', ['~$5.8k/month', '~$8.8k/month with EU-only placement'], 'Justified only if scale-up is driving the misses'],
    ['WITH EXPANSION', THEME.colors.accent1, 'Shared five-brand deployment', ['Always-on capacity shared by five brands', '~$1.2k–1.8k per brand per month'], 'Baseline capacity is affordable once shared'],
  ];
  const gap = 0.3;
  const cw = (CW - gap * 2) / 3;
  opts.forEach(([tag, color, head, bullets, foot], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.85, cw, 3.55, i === 2 ? THEME.colors.lt2 : 'FFFFFF', i === 2 ? THEME.colors.accent4 : BORDER);
    pip(s, x + 0.3, 3.15, color);
    s.addText(tag, { x: x + 0.53, y: 3.08, w: cw - 0.8, h: 0.28, fontSize: 11, bold: true, color, charSpacing: 1.5, margin: 0, isTextBox: true });
    s.addText(head, { x: x + 0.3, y: 3.5, w: cw - 0.6, h: 0.75, fontSize: 18, bold: true, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
    s.addText(bullets.map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < bullets.length - 1, paraSpaceAfter: 6 } })), {
      x: x + 0.3, y: 4.3, w: cw - 0.6, h: 1.05, fontSize: 14, color: C.text1, margin: 0, valign: 'top', isTextBox: true,
    });
    s.addText(foot, { x: x + 0.3, y: 5.45, w: cw - 0.6, h: 0.75, fontSize: 13, color: GRAY, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addText('Capacity figures at Fireworks list rates as of 5 Oct 2026; contracted terms may differ.', { x: M, y: 6.48, w: CW, h: 0.28, fontSize: 10, color: GRAY, margin: 0, isTextBox: true });
  s.addNotes('Be precise about what we know. Availability averaged 99.85% and missed 99.9% on 27 of 31 days, 25 of them outside the two incidents, so this is not just the burst days. At 19,000 to 31,000 requests a day Atlas is unlikely to sit idle at zero for long, so we should not assume cold starts are the cause. The next step is the deployment telemetry: scale-up events and error codes by hour. Meanwhile we retune scale-up thresholds and pre-warm before planned promotions. Always-on capacity for Atlas alone would cost about $5.8k a month, $8.8k with EU-only placement; we would only recommend it if the telemetry shows scale-up is driving the misses. On the shared deployment the same capacity is about $1.2k to $1.8k per brand.');
}

// ---------------------------------------------------------------- 4. Expand, and how
pres.addSection({ title: 'Expansion' });
{
  const s = slide('CONTENT', 'Expansion', '04 · Expand, and how', 'One base, one adapter per brand, data kept apart');
  const dx = M, dy = 2.0, dw = 8.55, dh = 4.6;
  card(s, dx, dy, dw, dh, THEME.colors.lt2, BORDER);
  s.addText('SHARED DEPLOYMENT', { x: dx + 0.3, y: dy + 0.22, w: 4, h: 0.28, fontSize: 11, bold: true, color: '501BC4', charSpacing: 1.5, margin: 0, isTextBox: true });
  s.addShape(pres.ShapeType.roundRect, { x: dx + 0.3, y: dy + 0.6, w: dw - 0.6, h: 0.6, rectRadius: 0.06, fill: { color: THEME.colors.accent1 }, line: { color: THEME.colors.accent1, width: 0 } });
  s.addText('Open-weight base model', { x: dx + 0.3, y: dy + 0.6, w: dw - 0.6, h: 0.6, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });

  const brands = [
    ['Atlas', 'Existing adapter, unchanged'],
    ['Ridgeline', 'New adapter (pilot)'],
    ['Halden', 'New adapter; own deployment when volume justifies'],
    ['Polar', 'New adapter'],
    ['Harbour & Hide', 'New adapter'],
  ];
  const gap = 0.15;
  const bw = (dw - 0.6 - gap * 4) / 5;
  brands.forEach(([name, note], i) => {
    const x = dx + 0.3 + i * (bw + gap);
    const top = dy + 1.4;
    card(s, x, top, bw, 2.95, 'FFFFFF', BORDER);
    s.addText(name, { x: x + 0.12, y: top + 0.14, w: bw - 0.24, h: 0.32, fontSize: 13, bold: true, color: C.text1, margin: 0, isTextBox: true, fit: 'shrink' });
    s.addText(note, { x: x + 0.12, y: top + 0.48, w: bw - 0.24, h: 0.72, fontSize: 11, color: GRAY, margin: 0, valign: 'top', isTextBox: true });
    ['Brand adapter', 'Knowledge index', 'System prompt'].forEach((layer, j) => {
      const ly = top + 1.3 + j * 0.52;
      s.addShape(pres.ShapeType.rect, { x: x + 0.12, y: ly, w: bw - 0.24, h: 0.42, fill: { color: j === 0 ? 'EFE7FF' : THEME.colors.lt2 }, line: { color: j === 0 ? THEME.colors.accent4 : BORDER, width: 0.75 } });
      s.addText(layer, { x: x + 0.12, y: ly, w: bw - 0.24, h: 0.42, fontSize: 11, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    });
  });

  const rx = M + dw + 0.35, rw = CW - dw - 0.35;
  const side = [
    ['Data isolation', 'Each brand’s catalogue sits in its own knowledge index; each adapter is trained on that brand’s transcripts.'],
    ['Why not reuse Atlas with a new prompt?', 'Atlas’s tone and policy-handling habits are learned into its adapter and would leak into other brands.'],
    ['Why not five separate models?', 'Five deployments to run and retrain, and the smaller brands lack the data to train them well.'],
  ];
  side.forEach(([head, body], i) => {
    const y = 2.05 + i * 1.55;
    pip(s, rx, y + 0.07, i === 0 ? THEME.colors.accent2 : THEME.colors.accent1, 0.14);
    s.addText([
      { text: head, options: { bold: true, color: C.text1, fontSize: 14, breakLine: true } },
      { text: body, options: { color: GRAY, fontSize: 13 } },
    ], { x: rx + 0.3, y, w: rw - 0.3, h: 1.4, margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
  });
  s.addNotes('The architecture: one open-weight base model on a shared deployment, one adapter per brand for tone, workflow and policy-following behaviour, and a separate knowledge index and system prompt per brand. Policy facts such as return windows live in the index, not the weights, so they can change without retraining. Atlas’s adapter moves over unchanged. Data isolation sits where it matters, in each brand’s index and adapter. Halden, the largest brand, can move to its own deployment once its volume keeps capacity busy. Why not reuse Atlas with a new prompt: its tone and policy-handling habits are learned and would leak. Why not five separate models: five deployments to run and retrain, and the smaller brands don’t have enough transcripts.');
}

// ---------------------------------------------------------------- 5. Pilot
{
  const s = slide('CONTENT', 'Expansion', '05 · Pilot', 'Ridgeline pilot: two arms, agreed criteria');
  s.addText('Ridgeline is closest to Atlas in product and customer, uses the same Zendesk tooling and runs at moderate volume, so it tests tone and return-policy handling with limited exposure.', {
    x: M, y: 1.95, w: CW, h: 0.65, fontSize: 15, color: C.text1, margin: 0, isTextBox: true,
  });
  const arms = [
    ['ARM A · LOWEST COST', 'Base model + Ridgeline prompt + Ridgeline knowledge index', 'No brand-specific training. If it clears every criterion, no adapter is needed.'],
    ['ARM B · BRAND-TUNED', 'Base model + Ridgeline adapter + prompt + knowledge index', 'Tone and policy-following learned from Ridgeline transcripts.'],
  ];
  arms.forEach(([tag, setup, note], i) => {
    const y = 2.8 + i * 1.85;
    card(s, M, y, 5.6, 1.7, i === 0 ? 'FFFFFF' : THEME.colors.lt2, i === 0 ? BORDER : THEME.colors.accent4);
    pip(s, M + 0.3, y + 0.3, i === 0 ? THEME.colors.accent2 : THEME.colors.accent1);
    s.addText(tag, { x: M + 0.53, y: y + 0.22, w: 4.8, h: 0.28, fontSize: 11, bold: true, color: i === 0 ? THEME.colors.accent2 : THEME.colors.accent1, charSpacing: 1.5, margin: 0, isTextBox: true });
    s.addText([
      { text: setup, options: { bold: true, color: C.text1, fontSize: 14, breakLine: true } },
      { text: note, options: { color: GRAY, fontSize: 13 } },
    ], { x: M + 0.3, y: y + 0.55, w: 5.0, h: 1.05, margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
  });

  const tx = M + 6.0, tw = CW - 6.0;
  const head = { bold: true, color: C.text1, fill: { color: THEME.colors.lt2 }, fontSize: 12 };
  const rows = [
    [{ text: 'Success criterion (four weeks)', options: head }, { text: 'Target', options: head }],
    ['Grounded answers', '≥ 95%'],
    ['Eval pass rate', '≥ 93%'],
    ['Escalation rate', '≤ 12%'],
    ['CSAT', '≥ Atlas final week (83.7)'],
    ['P95 latency', '≤ 1.3 s through one promotion peak'],
  ];
  s.addTable(rows, {
    x: tx, y: 2.85, w: tw, colW: [tw * 0.48, tw * 0.52],
    fontSize: 14, color: C.text1, border: { type: 'solid', pt: 0.75, color: BORDER }, rowH: 0.5, valign: 'middle', margin: [0, 0.15, 0, 0.15],
  });
  s.addText('Evidence for wave 2: one arm clears every criterion, the arm is chosen on quality, and Ridgeline’s handle-time and CSAT baselines are captured before launch so the uplift is measured directly.', {
    x: tx, y: 6.0, w: tw, h: 0.65, fontSize: 12, color: GRAY, margin: 0, valign: 'top', isTextBox: true,
  });
  s.addNotes('The pilot is designed so the cheapest option gets a fair test. Arm A uses no brand-specific training; if it clears every criterion, we skip the adapter. Arm B adds a Ridgeline adapter. Both run for four weeks against criteria we agree today. We also capture Ridgeline’s baselines before launch, so we can measure the uplift directly rather than rely on supplied figures.');
}

// ---------------------------------------------------------------- 6. Sequence and budget
{
  const s = slide('CONTENT', 'Expansion', '06 · Sequence and budget', 'From pilot to five brands by mid-2027');
  const steps = [
    ['Oct 2026', 'Executive review, sponsor, dependencies'],
    ['Nov 2026', 'Shared deployment live; Atlas parity; Ridgeline adapter'],
    ['Nov–Dec', 'Ridgeline pilot, four weeks'],
    ['Jan 2027', 'Readout and wave-2 decision'],
    ['Q1 2027', 'Halden and Polar'],
    ['Q2 2027', 'Harbour & Hide'],
  ];
  const ty = 2.35;
  s.addShape(pres.ShapeType.line, { x: M + 0.1, y: ty, w: CW - 0.2, h: 0, line: { color: THEME.colors.accent4, width: 1.5 } });
  const sw = CW / steps.length;
  steps.forEach(([when, what], i) => {
    const x = M + i * sw;
    pip(s, x + 0.1, ty - 0.09, i < 4 ? THEME.colors.accent1 : THEME.colors.accent4, 0.18);
    s.addText(when, { x: x + 0.1, y: ty + 0.28, w: sw - 0.25, h: 0.32, fontSize: 14, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(what, { x: x + 0.1, y: ty + 0.62, w: sw - 0.25, h: 0.85, fontSize: 13, color: GRAY, margin: 0, valign: 'top', isTextBox: true });
  });

  const budget = [
    ['Pilot window', '~$5.8k–8.8k/month for the shared deployment (EU-only placement is the upper figure). Adapter training cost is immaterial.'],
    ['Steady state', 'One always-on deployment shared by Atlas, Ridgeline, Polar and Harbour & Hide; a second for Halden once its volume justifies it.'],
    ['Migration overlap', 'Atlas runs on both deployments while it moves over. Budgeted in weeks, not months.'],
  ];
  const gap = 0.3;
  const cw = (CW - gap * 2) / 3;
  budget.forEach(([head, body], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 4.15, cw, 2.35, THEME.colors.lt2, BORDER);
    s.addText(head, { x: x + 0.3, y: 4.4, w: cw - 0.6, h: 0.35, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: x + 0.3, y: 4.85, w: cw - 0.6, h: 1.5, fontSize: 13, color: GRAY, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes('Sequence: agree the sponsor and dependencies this month, stand up the shared deployment and prove Atlas parity in November, run the Ridgeline pilot through December, read out in January, then Halden and Polar in Q1 and Harbour & Hide in Q2. Budget: the shared deployment runs at about $5.8k a month, $8.8k with EU-only placement, during the pilot; training cost is immaterial. In steady state one deployment is shared by four brands, with a second for Halden when its volume justifies it. The overlap while Atlas moves is budgeted in weeks.');
}

// ---------------------------------------------------------------- 7. Biggest risk and talking points
pres.addSection({ title: 'Decision' });
{
  const s = slide('DARK', 'Decision', '07 · Biggest risk and what we’re asking for', 'The rollout must not stall at one brand');
  card(s, M, 2.0, 5.9, 4.55, DARK_CARD);
  pip(s, M + 0.35, 2.36, THEME.colors.accent6);
  s.addText('BIGGEST RISK', { x: M + 0.6, y: 2.28, w: 4, h: 0.28, fontSize: 11, bold: true, color: LAVENDER, charSpacing: 1.5, margin: 0, isTextBox: true });
  s.addText('Without group-level sponsorship the rollout stays with Atlas, and shared capacity never carries enough volume to make per-brand cost efficient.', {
    x: M + 0.35, y: 2.7, w: 5.2, h: 1.35, fontSize: 16, bold: true, color: C.background1, margin: 0, valign: 'top', isTextBox: true,
  });
  s.addText('MITIGATION', { x: M + 0.35, y: 4.2, w: 4, h: 0.28, fontSize: 11, bold: true, color: LAVENDER, charSpacing: 1.5, margin: 0, isTextBox: true });
  const mit = ['Name a group sponsor at this review', 'Agree the Ridgeline pilot criteria together', 'Size shared capacity alongside a second brand'];
  s.addText(mit.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < mit.length - 1, paraSpaceAfter: 8 } })), {
    x: M + 0.35, y: 4.6, w: 5.2, h: 1.7, fontSize: 14, color: C.background1, margin: 0, valign: 'top', isTextBox: true,
  });

  const kx = M + 6.3, kw = CW - 6.3;
  s.addText('KEY MESSAGES', { x: kx, y: 2.0, w: 4, h: 0.28, fontSize: 11, bold: true, color: LAVENDER, charSpacing: 1.5, margin: 0, isTextBox: true });
  const points = [
    'Month one delivered: 70% of Tier-1 automated by month end, faster and better-rated.',
    'Quality improved every week, and the evidence is in your dashboard.',
    '99.85% today: we find the cause in telemetry before buying capacity.',
    'One base, one adapter per brand: each brand keeps its voice and its data.',
    'We’re asking for a group sponsor today and Ridgeline as the pilot.',
  ];
  points.forEach((t, i) => {
    const y = 2.45 + i * 0.82;
    s.addText(String(i + 1).padStart(2, '0'), { x: kx, y, w: 0.5, h: 0.6, fontSize: 18, bold: true, color: '00E6CC', margin: 0, valign: 'top', isTextBox: true });
    s.addText(t, { x: kx + 0.6, y, w: kw - 0.6, h: 0.68, fontSize: 14, color: C.background1, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes('Close on the one risk that matters: if group sponsorship doesn’t happen, the rollout stays with Atlas and the shared capacity never pays for itself. Ask for three things: a named group sponsor, joint agreement on the Ridgeline criteria, and shared capacity sized alongside a second brand, based on what the telemetry shows. Then land the five messages.');
}

pres.writeFile({ fileName: OUT }).then(async () => {
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
});
