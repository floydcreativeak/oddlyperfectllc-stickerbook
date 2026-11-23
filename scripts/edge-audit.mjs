// Crops a strip around every section edge on every page (light/dark, desktop/mobile)
// into contact sheets, for checking that dividers line up.
// Usage: npm run build && node scripts/edge-audit.mjs <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { serveDist } from './serve-dist.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'edge-audit';
mkdirSync(out, { recursive: true });
const PAGES = ['/', '/services/', '/pricing/', '/reviews/', '/about/', '/privacy/', '/terms/', '/accessibility/'];
const server = await serveDist(4370);
const browser = await chromium.launch();
for (const [w, scheme] of [[1440, 'light'], [1440, 'dark'], [375, 'light']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const strips = [];
  for (const path of PAGES) {
    await page.goto(`http://localhost:4370${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('[data-rise],[data-slap]').forEach((e) => e.classList.add('is-in')));
    await page.addStyleTag({ content: 'body{position:relative}.site-header,.tabbar-wrap{display:none!important}' });
    const tops = await page.evaluate(() => [...document.querySelectorAll('.edge, .site-footer')].map((e) => ({ y: Math.round(e.getBoundingClientRect().top + scrollY), cls: e.className.split(' ').filter((c) => c.startsWith('edge--') || c === 'site-footer').join(' ') })));
    for (const t of tops) {
      const buf = await page.screenshot({ fullPage: true, clip: { x: 0, y: Math.max(0, t.y - 60), width: w, height: 110 } });
      strips.push({ buf, label: `${path} ${t.cls}` });
    }
  }
  const scale = w > 1000 ? 0.7 : 1;
  const imgs = await Promise.all(strips.map((s) => sharp(s.buf).resize({ width: Math.round(w * scale) }).toBuffer({ resolveWithObject: true })));
  const H = imgs.reduce((n, i) => n + i.info.height + 26, 0);
  const W = Math.round(w * scale);
  const comps = []; let y = 0;
  imgs.forEach((im, i) => {
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="22"><rect width="100%" height="100%" fill="#222"/><text x="6" y="16" font-size="14" font-family="sans-serif" fill="#fff">${strips[i].label}</text></svg>`);
    comps.push({ input: label, left: 0, top: y }); y += 22;
    comps.push({ input: im.data, left: 0, top: y }); y += im.info.height + 4;
  });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#555' } }).composite(comps).png().toFile(`${out}/edges-${w}-${scheme}.png`);
  console.log(`edges-${w}-${scheme}.png: ${strips.length} edges`);
  await ctx.close();
}
await browser.close(); server.close();
