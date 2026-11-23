// Renders the one-page brochure PDF from /brochure-print/ (built from /content).
// Usage: npm run brochure   (builds the site, renders the PDF, rebuilds so it ships)
// Output: public/downloads/oddly-perfect-services.pdf (path from content/site.yml -> brochure.file)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import * as yaml from 'js-yaml';
import { serveDist } from './serve-dist.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const site = yaml.load(readFileSync('content/site.yml', 'utf8'));
const out = `public${site.brochure.file}`;
mkdirSync(dirname(out), { recursive: true });

execSync('npx astro build', { stdio: 'inherit', env: { ...process.env, BASE_PATH: '/', PUBLIC_PREVIEW: 'false' } });
const server = await serveDist(4380, 'dist', '');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.emulateMedia({ media: 'print', colorScheme: 'light', reducedMotion: 'reduce' });
await page.goto('http://localhost:4380/brochure-print/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: 'Letter', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await page.setViewportSize({ width: 816, height: 1056 });
await page.screenshot({ path: 'docs/brochure-preview.png' });
await browser.close();
server.close();
console.log(`Brochure written to ${out} (preview: docs/brochure-preview.png)`);
execSync('npx astro build', { stdio: 'inherit' });
