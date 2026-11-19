// axe-core accessibility check of every built page, light and dark, mobile and desktop.
// Usage: npm run build && node scripts/a11y.mjs   (exits 1 on any serious/critical issue)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { serveDist } from './serve-dist.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const PAGES = ['/', '/services/', '/pricing/', '/reviews/', '/about/', '/privacy/', '/terms/', '/accessibility/', '/404.html'];
const server = await serveDist(4340);
const browser = await chromium.launch();
let failures = 0;
for (const colorScheme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(`http://localhost:4340${path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.querySelectorAll('[data-rise],[data-slap]').forEach((e) => e.classList.add('is-in')));
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }));
      const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      for (const v of bad) {
        failures++;
        console.log(`[${colorScheme} ${width}] ${path}  ${v.impact}  ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' '), n.any[0]?.message ?? '');
      }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} serious/critical issue(s).` : '\naxe: 0 serious or critical issues on any page, light and dark.');
process.exit(failures ? 1 : 0);
