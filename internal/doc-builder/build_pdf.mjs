// Renders send/docs/DESIGN.md to send/docs/Northstar_Dashboard_Design.pdf in the dashboards' design language
// (Inter, Fireworks colour tokens, the dashboard's table and card styles), printed by Chrome.
//
//   cd internal/doc-builder && npm install && npm run build
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEND = path.resolve(HERE, '..', '..', 'send');
const DOCS = path.join(SEND, 'docs');
const SRC = path.join(DOCS, 'DESIGN.md');
const OUT = path.join(DOCS, 'Northstar_Dashboard_Design.pdf');
const FONTS = path.resolve(HERE, '..', 'ebr-generator', 'fonts');
const LOGO = fs.readFileSync(path.join(SEND, 'shared', 'src', 'theme', 'brand', 'fireworks-logo.svg'), 'utf8');
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found; set CHROME_PATH');

const font = (file) => 'data:font/ttf;base64,' + fs.readFileSync(path.join(FONTS, file)).toString('base64');

// The two screenshot sections start on a new page; the text sections flow on.
const PAGE_BREAK = /^(2|3)\. /;
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const cls = depth === 2 && PAGE_BREAK.test(text) ? ' class="new-page"' : '';
      return `<h${depth}${cls}>${text}</h${depth}>\n`;
    },
  },
});

const md = fs.readFileSync(SRC, 'utf8');
// Keep each caption with the screenshot that follows it, so a caption never sits alone at a page foot.
const body = marked
  .parse(md)
  .replace(/<p>(<strong>(?:(?!<\/p>)[^])*)<\/p>\s*<p>(<img [^>]*>)<\/p>/g, '<figure><p>$1</p>$2</figure>');

const css = `
@font-face { font-family: 'Inter'; font-weight: 400; src: url(${font('Inter-Regular.ttf')}) format('truetype'); }
@font-face { font-family: 'Inter'; font-weight: 500; src: url(${font('Inter-Medium.ttf')}) format('truetype'); }
:root {
  --purple: #6720FF; --purple-500: #501BC4; --ink: #16181D; --body: #28282E; --gray: #5A5E63;
  --tint: #FAF7FF; --border: #E6EAF4; --radius: 8px;
}
@page { size: A4; margin: 20mm 18mm 18mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: 'Inter', sans-serif; font-size: 9.6pt; line-height: 1.55; color: var(--body); }
.logo svg { height: 26px; width: auto; display: block; margin-bottom: 26px; }
h1 { font-weight: 500; font-size: 25pt; line-height: 1.15; letter-spacing: -0.035em; color: var(--ink); margin: 0 0 6px; }
h1 + p { color: var(--purple-500); font-size: 10pt; margin: 0 0 18px; }
h1 + p strong { font-weight: 500; }
h2 { font-weight: 500; font-size: 16pt; letter-spacing: -0.025em; color: var(--ink); margin: 26px 0 10px; break-after: avoid; }
h2.new-page { break-before: page; margin-top: 0; }
h3 { font-weight: 500; font-size: 11pt; color: var(--ink); margin: 16px 0 6px; break-after: avoid; }
p { margin: 0 0 9px; }
strong { font-weight: 500; color: var(--ink); }
ul, ol { margin: 0 0 10px; padding-left: 18px; }
li { margin: 0 0 4px; }
li::marker { color: var(--purple); }
code { font-family: Consolas, ui-monospace, monospace; font-size: 0.88em; color: var(--gray); }
a { color: var(--purple-500); text-decoration: none; }
hr { border: 0; border-top: 1px solid var(--border); margin: 18px 0; }
figure { margin: 0 0 18px; break-inside: avoid; }
figure > p { margin-bottom: 6px; }
p:has(> img) { margin: 4px 0 18px; break-inside: avoid; }
p:has(> strong:only-child) { break-after: avoid; }
table:has(th:nth-child(7)) td:nth-child(n+2):nth-child(-n+5) { white-space: nowrap; }
img.lead { max-height: 128mm; width: auto; max-width: 100%; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; break-inside: avoid; }
.pair figure { margin: 0 0 12px; }
.pair figure > p { font-size: 8.6pt; line-height: 1.45; min-height: 2.9em; }
img { display: block; width: 100%; max-height: 228mm; object-fit: contain; object-position: left top;
      border: 1px solid var(--border); border-radius: var(--radius); }
/* Open tables (header band and row rules, no outer box) so a table that runs onto the next page splits cleanly. */
table { width: 100%; border-collapse: collapse; margin: 6px 0 16px; font-size: 8.4pt; line-height: 1.45; }
thead { display: table-header-group; }
th { text-align: left; font-weight: 500; color: var(--gray); background: var(--tint); padding: 7px 9px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
td { padding: 7px 9px; border-bottom: 1px solid var(--border); vertical-align: top; }
tr { break-inside: avoid; break-after: auto; }
h2 + p, h2 + ul { break-before: avoid; }
td strong { color: var(--ink); }
`;

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Northstar dashboards: design document</title>
<style>${css}</style></head><body><div class="logo">${LOGO}</div>${body}</body></html>`;

const tmp = path.join(DOCS, '.design-render.html');
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const foot = (left) =>
    `<div style="width:100%;font-family:Inter,sans-serif;font-size:7.5pt;color:#5A5E63;padding:0 18mm;display:flex;justify-content:space-between">` +
    `<span>${left}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: foot('Northstar dashboards · Design document · October 2026'),
    margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
    tagged: true,
  });
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}
console.log('wrote', OUT);
