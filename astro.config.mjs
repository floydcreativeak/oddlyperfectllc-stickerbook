// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Static site for GitHub Pages on a custom domain (public/CNAME), so base is "/".
export default defineConfig({
  site: 'https://oddlyperfectllc.com',
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
