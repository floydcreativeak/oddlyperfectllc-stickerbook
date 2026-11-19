/**
 * Base-path helpers. On the custom domain the site lives at "/"; on the
 * GitHub Pages preview address it lives under "/<repo-name>/". Content files
 * always write links as "/pricing/" and these helpers add the prefix.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // "" or "/repo"

/** Prefix internal root-relative links ("/x/") with the base path. Leaves https:, tel:, mailto:, # alone. */
export function withBase(href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  return `${BASE}${href}`;
}

/** Remove the base path from a URL pathname so it can be compared with content links. */
export function stripBase(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) return pathname.slice(BASE.length) || '/';
  return pathname;
}

/** True for preview builds (GitHub Pages address, placeholders allowed, hidden from search). */
export const IS_PREVIEW = import.meta.env.PUBLIC_PREVIEW === 'true';
