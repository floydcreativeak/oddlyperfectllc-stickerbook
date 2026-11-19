// Measures where each hand-drawn sticker's silhouette starts along the top-left
// diagonal (min of x + y over opaque pixels), as a fraction of the sticker box.
// The hover fold starts there so it lands on the artwork, not empty corner space.
// Run after editing src/lib/sticker-art.ts:
//   node --experimental-strip-types scripts/measure-fold.mjs
// then paste the output into FOLD_START in src/lib/sticker-art.ts.
import sharp from 'sharp';

const { ART } = await import('../src/lib/sticker-art.ts');
const S = 248; // render at 2x the 124-unit viewBox
const out = {};
for (const [name, a] of Object.entries(ART)) {
  if (!a.body) continue;
  const g = a.line
    ? `<g fill="none" stroke="#000" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">${a.body}</g>`
    : `<g fill="#000" stroke="#000" stroke-width="16" stroke-linejoin="round" stroke-linecap="round">${a.body}${a.detail ?? ''}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="-12 -12 124 124">${g}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let min = Infinity;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 40 && x + y < min) min = x + y;
  }
  out[name] = +(min / S).toFixed(3);
}
console.log(JSON.stringify(out));
