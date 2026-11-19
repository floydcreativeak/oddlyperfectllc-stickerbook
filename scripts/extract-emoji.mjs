// Extracts Noto Emoji artwork (Apache-2.0, via @iconify-json/noto) into
// public/stickers/emoji as standalone SVG files for emoji stickers.
// Add a sticker: put [fileName, iconifyName] below and run `node scripts/extract-emoji.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const WANT = [
  ['coffee', 'hot-beverage'],
  ['hundred', 'hundred-points'],
  ['clipboard', 'clipboard'],
  ['megaphone', 'megaphone'],
  ['sparkles', 'sparkles'],
];
const set = JSON.parse(readFileSync('node_modules/@iconify-json/noto/icons.json', 'utf8'));
const outDir = 'public/stickers/emoji';
mkdirSync(outDir, { recursive: true });
for (const [file, name] of WANT) {
  const icon = set.icons[name];
  if (!icon) throw new Error(`No Noto icon named ${name}`);
  const w = icon.width ?? set.width ?? 128;
  const h = icon.height ?? set.height ?? 128;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${w} ${h}" width="${w}" height="${h}">${icon.body}</svg>\n`;
  writeFileSync(`${outDir}/${file}.svg`, svg);
  console.log(`${file}.svg  (${svg.length} bytes)`);
}
// License: Apache-2.0 (googlefonts/noto-emoji LICENSE), committed as public/stickers/emoji/LICENSE-noto-emoji.txt
