import type { APIRoute } from 'astro';
import { IS_PREVIEW } from '../lib/url';

// Preview builds (GitHub Pages address) are hidden from search engines.
export const GET: APIRoute = ({ site }) => {
  const body = IS_PREVIEW
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
