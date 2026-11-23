// Automated UX sweep of the built site.
// Usage: npm run build && node scripts/ux-audit.mjs
// Checks every page at several widths for: horizontal overflow, small tap
// targets (< 44px), broken internal links/anchors, skipped heading levels,
// images without dimensions, and console errors.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { serveDist } from './serve-dist.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const PAGES = ['/', '/services/', '/pricing/', '/reviews/', '/about/', '/privacy/', '/terms/', '/accessibility/', '/404.html', '/brochure-print/'];
const WIDTHS = [320, 375, 768, 1024, 1440];
const server = await serveDist(4390);
const browser = await chromium.launch();
const issues = new Map();
const add = (k, v) => { if (!issues.has(k)) issues.set(k, new Set()); issues.get(k).add(v); };

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', isMobile: w < 800, hasTouch: w < 800 });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    const errs = [];
    page.removeAllListeners('pageerror'); page.removeAllListeners('console');
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.goto(`http://localhost:4390${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('[data-rise],[data-slap]').forEach((e) => e.classList.add('is-in')));
    const r = await page.evaluate((isPrint) => {
      const out = { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], links: [], headings: [], imgs: [] };
      const visible = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden], dialog:not([open]), details:not([open]) > :not(summary)'); };
      if (!isPrint) {
        document.querySelectorAll('a[href], button, summary, [tabindex="0"]').forEach((el) => {
          if (!visible(el)) return;
          // Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
          if (el.tagName === 'A' && el.closest('p, li, dd') && getComputedStyle(el).display === 'inline') return;
          const b = el.getBoundingClientRect();
          if (b.width < 43.5 || b.height < 43.5) out.small.push(`${el.tagName.toLowerCase()}.${[...el.classList][0] ?? ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
        });
      }
      document.querySelectorAll('a[href]').forEach((a) => out.links.push(a.getAttribute('href')));
      let last = 0;
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        if (h.closest('dialog, .sticker-sprite')) return;
        const n = +h.tagName[1];
        if (last && n > last + 1) out.headings.push(`h${last} -> h${n} "${h.textContent.trim().slice(0, 40)}"`);
        last = n;
      });
      document.querySelectorAll('img').forEach((i) => { if (!i.getAttribute('width') || !i.getAttribute('height')) out.imgs.push(i.src.split('/').pop()); });
      return out;
    }, path === '/brochure-print/');
    if (r.overflow > 0 && path !== '/brochure-print/') add('Horizontal overflow', `${path} @${w}: ${r.overflow}px`);
    r.small.forEach((s) => add('Tap target < 44px', `${path} @${w}: ${s}`));
    if (w === 1440) {
      r.headings.forEach((s) => add('Skipped heading level', `${path}: ${s}`));
      r.imgs.forEach((s) => add('Image without width/height', `${path}: ${s}`));
      for (const href of new Set(r.links)) {
        if (!href.startsWith('/') && !href.startsWith('#')) continue;
        const [p0, hash] = href.split('#');
        const target = p0 || path;
        const file = target.endsWith('/') ? `dist${target}index.html` : `dist${target}`;
        if (!existsSync(file) && !existsSync(`dist${target}/index.html`)) { add('Broken internal link', `${path} -> ${href}`); continue; }
        if (hash) {
          const html = await (await fetch(`http://localhost:4390${target}`)).text();
          if (!html.includes(`id="${hash}"`)) add('Missing anchor', `${path} -> ${href}`);
        }
      }
    }
    errs.forEach((e) => add('Console error', `${path} @${w}: ${e.slice(0, 120)}`));
  }
  await ctx.close();
}
await browser.close(); server.close();
if (!issues.size) console.log('UX audit: no issues found.');
for (const [k, v] of issues) { console.log(`\n${k} (${v.size})`); [...v].slice(0, 40).forEach((x) => console.log('  ' + x)); }
