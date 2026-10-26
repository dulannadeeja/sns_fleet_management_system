#!/usr/bin/env node
// Renders screen boards (screens/canvas/*.dc.html) to screens/previews/{png,html} and updates the render report.
// When a screen's content is taller than its board, the board height (canvas.json and the file's $preview) grows to fit.
//   node screens/tools/render.mjs --changed          boards changed since the last commit (default)
//   node screens/tools/render.mjs 04-Cars-AllCars-Desktop 07-Return-Return-Phone
//   node screens/tools/render.mjs --all
// Needs Playwright with Chromium: run `npm install && npx playwright install chromium` in screens/tools once.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const CANVAS = join(REPO, 'screens', 'canvas');
const PREV = join(REPO, 'screens', 'previews');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  try { ({ chromium } = createRequire(join(process.cwd(), 'x.js'))('playwright')); } catch {
    console.error('Playwright not found. In screens/tools run: npm install && npx playwright install chromium'); process.exit(2);
  }
}
const fileUrl = (p) => pathToFileURL(p).href;
const canvasPath = join(CANVAS, 'canvas.json');
const reportPath = join(PREV, 'preview-report.json');
const canvasText = readFileSync(canvasPath, 'utf8');
const boards = JSON.parse(canvasText).boards;
const args = process.argv.slice(2);

let names;
if (args.includes('--all')) names = Object.keys(boards).map((k) => k.replace(/\.dc\.html$/, ''));
else if (args.length && !args.includes('--changed')) names = args;
else {
  const out = execFileSync('git', ['status', '--porcelain', '--', 'screens/canvas'], { cwd: REPO, encoding: 'utf8' });
  names = out.split('\n').map((l) => l.slice(3).trim()).filter((f) => f.endsWith('.dc.html')).map((f) => f.split('/').pop().replace(/\.dc\.html$/, ''));
}
names = [...new Set(names)].filter((n) => boards[`${n}.dc.html`] || console.error(`skip ${n}: not a board in canvas.json`));
if (!names.length) { console.log('No boards to render.'); process.exit(0); }

const css = ['screens/canvas/ds/plate/tokens.css', 'screens/canvas/ds/plate/components/bundle.css'].map((f) => readFileSync(join(REPO, f), 'utf8')).join('\n').replace(/@import url\([^)]*\);?/g, '');
const fonts = readFileSync(join(REPO, 'design-system', 'fonts.css'), 'utf8').replace(/\.\.\/fonts\//g, `${fileUrl(join(REPO, 'fonts'))}/`);
const page0 = (title, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${fileUrl(CANVAS)}/"><title>${title}</title>
<style>${fonts}</style><style>${css}</style>
<script src="${fileUrl(join(REPO, 'design-system/vendor/react-18.3.1.production.min.js'))}"></script>
<script src="${fileUrl(join(REPO, 'design-system/vendor/react-dom-18.3.1.production.min.js'))}"></script>
<script src="${fileUrl(join(CANVAS, 'ds/plate/components/bundle.js'))}"></script>
<script src="${fileUrl(join(HERE, 'harness.js'))}"></script></head><body></body></html>`;

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
let reportText = readFileSync(reportPath, 'utf8');
let canvasOut = canvasText;
const problems = [];
const browser = await chromium.launch();
for (const n of names) {
  const b = boards[`${n}.dc.html`];
  const srcPath = join(CANVAS, `${n}.dc.html`);
  let src = readFileSync(srcPath, 'utf8');
  const title = (/<title>([^<]*)<\/title>/.exec(src) || [, n])[1];
  const lang = (/<html lang="([^"]+)"/.exec(src) || [, 'si'])[1];
  const tmp = join(HERE, '.page.html');
  writeFileSync(tmp, page0(title, lang));
  const p = await browser.newPage({ viewport: { width: b.w, height: b.h } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('requestfailed', (r) => { if (!/googleapis|gstatic/.test(r.url())) errs.push(`failed ${r.url()}`); });
  await p.goto(fileUrl(tmp));
  errs.push(...(await p.evaluate((s) => window.__renderDC(s), src)));
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
  await p.evaluate(() => Promise.race([Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))), new Promise((r) => setTimeout(r, 4000))]));
  const broken = await p.$$eval('img', (is) => is.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')));
  const overflowX = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const contentH = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await p.screenshot({ path: join(PREV, 'png', `${n}.png`), fullPage: true });
  let html = await p.evaluate(() => { document.querySelectorAll('script, base').forEach((s) => s.remove()); return `<!doctype html>${document.documentElement.outerHTML}`; });
  html = html.split(`${fileUrl(join(REPO, 'fonts'))}/`).join('../../../fonts/')
    .replace(/(src|href)="\.\.\/\.\.\/(design-system|brand)\//g, '$1="../../../$2/')
    .replace(/href="([0-9]{2}-[A-Za-z0-9-]+)\.dc\.html"/g, 'href="$1.html"');
  writeFileSync(join(PREV, 'html', `${n}.html`), html);
  await p.close();

  const h = Math.max(b.h, contentH);
  if (h !== b.h) {
    canvasOut = canvasOut.replace(new RegExp(`("${n}\\.dc\\.html": \\{[^}]*?"h": )${b.h},`), `$1${h},`);
    src = src.replace(/("\$preview":\{"width":\d+,"height":)\d+\}/, `$1${h}}`);
    writeFileSync(srcPath, src);
  }
  const entry = { name: n, w: b.w, canvasH: h, contentH: h, missing: [], broken, unresolvedBlob: false };
  const i = report.findIndex((e) => e.name === n);
  if (i >= 0) {
    const start = reportText.indexOf(`"name": "${n}"`);
    const end = reportText.indexOf('}', start);
    reportText = `${reportText.slice(0, start)}${JSON.stringify(entry, null, 1).slice(2, -2).trimStart().replace(/\n/g, '\n ')}\n ${reportText.slice(end)}`;
  } else problems.push(`${n}: not in preview-report.json; add it`);
  if (errs.length || broken.length || overflowX > 0) problems.push(`${n}: ${[...errs, ...broken.map((x) => `broken image ${x}`), overflowX > 0 ? `scrolls sideways by ${overflowX}px` : ''].filter(Boolean).join('; ')}`);
  console.log(`${n}  ${b.w}×${h}${h !== b.h ? `  (grew from ${b.h})` : ''}`);
}
await browser.close();
writeFileSync(canvasPath, canvasOut);
JSON.parse(reportText);
writeFileSync(reportPath, reportText);
rmSync(join(HERE, '.page.html'), { force: true });
for (const x of problems) console.log(`PROBLEM  ${x}`);
console.log(`Rendered ${names.length} board(s). Next: node scripts/audit.mjs --only=screens (checks overlaps), then refresh the canvas viewer.`);
process.exit(problems.length ? 1 : 0);
