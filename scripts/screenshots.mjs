// Captures review screenshots of the built site.
// Usage: npm run build && node scripts/screenshots.mjs [outDir] [paths...]
// Serves dist/ locally, shoots 375px and 1440px in light and dark, viewport + full page.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { serveDist } from './serve-dist.mjs';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'screenshots';
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ['/'];
mkdirSync(out, { recursive: true });

const server = await serveDist(4329);

const browser = await chromium.launch();
const sizes = [
  { name: 'mobile-375', width: 375, height: 812, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];
try {
  for (const scheme of ['light', 'dark']) {
    for (const s of sizes) {
      const ctx = await browser.newContext({
        viewport: { width: s.width, height: s.height },
        deviceScaleFactor: 2,
        colorScheme: scheme,
        isMobile: s.mobile,
        hasTouch: s.mobile,
        reducedMotion: 'reduce', // settle animations for stills
      });
      const page = await ctx.newPage();
      for (const p of paths) {
        await page.goto(`http://localhost:4329${p}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const slug = p === '/' ? 'home' : p.replace(/\//g, '');
        await page.screenshot({ path: `${out}/${slug}-${s.name}-${scheme}-fold.png` });
        // Scroll through once so lazy images load and scroll-reveals fire.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);
        // Fixed chrome would paint mid-page in a stitched full-page shot; pin it to the ends instead.
        await page.addStyleTag({ content: 'body{position:relative}.site-header{position:absolute!important}.tabbar-wrap{position:absolute!important}' });
        await page.screenshot({ path: `${out}/${slug}-${s.name}-${scheme}-full.png`, fullPage: true });
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`Screenshots saved to ${out}/`);
