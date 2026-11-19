// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Production: custom domain (public/CNAME), site at "/".
// Preview: the GitHub Pages address, e.g. https://<owner>.github.io/<repo>/.
// The deploy workflow sets SITE_URL and BASE_PATH from GitHub's own Pages
// settings, so nothing here needs editing when the domain goes live.
const site = process.env.SITE_URL || 'https://oddlyperfectllc.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto', format: 'directory' },
  image: {
    // AVIF/WebP at several widths are produced by <Picture> at build time.
    layout: 'constrained',
  },
});
