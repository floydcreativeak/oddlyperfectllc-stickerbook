// Checks that no sticker (in its resting spot) covers readable text, on every
// page at common aspect ratios: 16:9, 9:16 and 4:3.
// Usage: npm run build && node scripts/sticker-overlap.mjs   (exits 1 on overlaps)
import { createRequire } from 'node:module';
import { serveDist } from './serve-dist.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const PAGES = ['/', '/services/', '/pricing/', '/reviews/', '/about/', '/privacy/', '/terms/', '/accessibility/', '/404.html'];
const SIZES = [
  ['16:9', 1920, 1080], ['16:9', 1280, 720],
  ['9:16', 360, 640], ['9:16', 412, 732],
  ['4:3', 1024, 768], ['4:3', 800, 600],
];
const server = await serveDist(4395);
const browser = await chromium.launch();
const found = [];
for (const [ratio, w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', isMobile: w < 700, hasTouch: w < 700 });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(`http://localhost:4395${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('[data-rise],[data-slap]').forEach((e) => e.classList.add('is-in')));
    await page.evaluate(() => document.fonts.ready);
    const hits = await page.evaluate(() => {
      const out = [];
      // Text line boxes, excluding text that belongs to stickers themselves.
      const lines = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.textContent.trim() && !n.parentElement.closest('.sticker, .sticker-sprite, script, style, .visually-hidden, dialog, .site-header, .tabbar-wrap, details:not([open]) > :not(summary)') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const cs = getComputedStyle(n.parentElement);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const b of r.getClientRects()) if (b.width > 2 && b.height > 2) lines.push({ b, text: n.textContent.trim().slice(0, 28) });
      }
      document.querySelectorAll('.sticker').forEach((s) => {
        if (s.closest('.sticker__flap')) return;
        const f = s.querySelector('.sticker__face') ?? s;
        const r = f.getBoundingClientRect();
        if (!r.width) return;
        // Visible core: drawn/emoji art is roughly the middle of the box; labels fill theirs.
        const k = s.classList.contains('sticker--label') ? 0.06 : 0.2;
        const core = { l: r.left + r.width * k, r: r.right - r.width * k, t: r.top + r.height * k, b: r.bottom - r.height * k };
        for (const { b, text } of lines) {
          const ix = Math.min(core.r, b.right) - Math.max(core.l, b.left);
          const iy = Math.min(core.b, b.bottom) - Math.max(core.t, b.top);
          if (ix > 4 && iy > b.height * 0.35) { out.push(`${s.dataset.sticker} covers "${text}"`); break; }
        }
      });
      return out;
    });
    hits.forEach((x) => found.push(`${ratio} ${w}x${h} ${path}: ${x}`));
  }
  await ctx.close();
}
await browser.close(); server.close();
if (!found.length) { console.log('Sticker overlap: no stickers cover text at 16:9, 9:16 or 4:3.'); process.exit(0); }
console.log(`${found.length} overlap(s):`); found.forEach((x) => console.log('  ' + x));
process.exit(1);
