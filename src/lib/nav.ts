/** True when `href` is the current page (or a parent section of it). */
export function isCurrent(path: string, href: string): boolean {
  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  if (href === '/') return norm(path) === '/';
  return norm(path).startsWith(norm(href));
}
