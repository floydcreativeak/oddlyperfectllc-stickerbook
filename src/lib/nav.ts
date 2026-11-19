import { stripBase } from './url';

/** True when `href` (a content link like "/pricing/") is the current page or a parent of it. */
export function isCurrent(pathname: string, href: string): boolean {
  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  const path = norm(stripBase(pathname));
  if (href === '/') return path === '/';
  return path.startsWith(norm(href));
}
