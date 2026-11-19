// Copies the Latin-subset woff2 files from @fontsource into public/fonts.
// Run with `npm run fonts` after upgrading a font package. Output is committed.
import { copyFileSync, mkdirSync } from 'node:fs';
const files = [
  ['@fontsource/alfa-slab-one/files/alfa-slab-one-latin-400-normal.woff2', 'alfa-slab-one-latin.woff2'],
  ['@fontsource/caveat-brush/files/caveat-brush-latin-400-normal.woff2', 'caveat-brush-latin.woff2'],
  ['@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2', 'figtree-latin-var.woff2'],
  ['@fontsource-variable/figtree/files/figtree-latin-wght-italic.woff2', 'figtree-latin-var-italic.woff2'],
];
mkdirSync('public/fonts', { recursive: true });
for (const [from, to] of files) copyFileSync(`node_modules/${from}`, `public/fonts/${to}`);
console.log(`Copied ${files.length} font files to public/fonts`);
