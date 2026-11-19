// Minimal static server for dist/ (used by screenshot and audit scripts).
// Mirrors GitHub Pages: /path/ -> /path/index.html, unknown -> 404.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf', '.json': 'application/json' };

export function serveDist(port = 4330, root = 'dist', mount = process.env.BASE_PATH?.replace(/\/$/, '') ?? '') {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (mount && p.startsWith(mount)) p = p.slice(mount.length) || '/';
    p = normalize(p).replace(/^(\.\.[/\\])+/, '');
    let file = join(root, p);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      try { res.writeHead(404, { 'content-type': TYPES['.html'] }); res.end(await readFile(join(root, '404.html'))); }
      catch { res.end('Not found'); }
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
