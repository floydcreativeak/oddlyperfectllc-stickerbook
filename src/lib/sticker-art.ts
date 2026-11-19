/**
 * Hand-drawn sticker art (viewBox 0 0 100 100). Each drawing has:
 *  - body:   filled shapes (sticker colour + ink outline). Also used, fattened
 *            and cream, as the die-cut edge behind it.
 *  - detail: ink linework on top (optional).
 *  - line:   true for stroke-only art (arrows, squiggles): drawn as a thick ink
 *            stroke with a thin colour line on top.
 * Shapes are slightly irregular on purpose: hand-drawn, not geometric.
 */
export interface Art { body: string; detail?: string; line?: boolean }

export const ART: Record<string, Art> = {
  star: {
    body: '<path d="M50 9 61.5 36 91 37.5 67.5 56.5 76 87 50 70.5 23.5 88 32.5 57 9 38.5 39 35Z"/>',
    detail: '<path d="M41 33c1.5-3 3-6 5-9"/>',
  },
  sparkle: {
    body: '<path d="M46 10c3 29 12 40 42 44-30 5-39 15-42 40-3-25-12-35-40-40 28-4 37-15 40-44Z"/><path d="M82 8c1.2 6.8 3 9 9.5 10-6.5 1-8.3 3.2-9.5 10-1.2-6.8-3-9-9.5-10 6.5-1 8.3-3.2 9.5-10Z"/>',
  },
  squiggle: { line: true, body: '<path d="M8 58c8-28 20-28 26-8s16 20 22 0 16-20 22 0c4 12 10 14 14 4"/>' },
  arrow: { line: true, body: '<path d="M10 53c26-6 50-4 76-3M70 34l17 16-17 17"/>' },
  'arrow-curl': { line: true, body: '<path d="M14 82c4-36 32-58 68-50M66 19l17 13-14 13"/>' },
  bubble: {
    body: '<path d="M14 24c0-9 6-13 15-13l46 1c9 0 15 6 15 15l-1 29c0 9-6 14-15 14H48L28 89l3-19h-4c-8 0-14-6-14-14Z"/>',
  },
  bolt: { body: '<path d="M60 5 20 57l26-1-10 39 46-56-27 1 13-35Z"/>' },
  heart: {
    body: '<path d="M50 88C20 66 8 50 10 32c2-16 22-22 34-12 3 2 5 5 6 8 2-5 6-10 12-13 14-6 30 3 28 21-2 18-16 32-40 52Z"/>',
    detail: '<path d="M26 28c-3 3-4 8-3 13"/>',
  },
  swoosh: { line: true, body: '<path d="M8 64c22-16 52-22 84-24M16 78c22-12 42-16 64-18"/>' },
  megaphone: {
    body: '<path d="M12 40c0-4 2-6 6-6h26l38-22c4-2 8 0 8 4v68c0 4-4 6-8 4L44 66h-4l6 22c0 2-2 4-4 4h-8c-2 0-4-2-4-4l-4-22h-8c-4 0-6-2-6-6Z"/>',
    detail: '<path d="M44 35v30"/>',
  },
  phone: {
    body: '<path d="M24 10c6-2 10 0 12 6l6 16c2 5 0 9-4 12l-6 4c6 14 14 22 26 28l4-6c3-4 7-6 12-4l14 6c6 3 7 8 4 14l-4 6c-4 4-10 4-16 2C40 84 18 62 8 30c-2-6 0-12 4-16Z"/>',
  },
  calendar: {
    body: '<path d="M14 26c0-6 4-9 10-9h52c6 0 10 3 10 9v56c0 6-4 9-10 9H24c-6 0-10-3-10-9Z"/>',
    detail: '<path d="M14 39h72M33 10v15M67 10v15M30 54h8M47 54h8M64 54h7M30 70h8M47 70h8"/>',
  },
  chart: {
    body: '<path d="M10 24c0-9 5-14 14-14h52c9 0 14 5 14 14v52c0 9-5 14-14 14H24c-9 0-14-5-14-14Z"/>',
    detail: '<path d="M28 72V57M44 72V45M60 72V51M76 72V31"/>',
  },
  pen: { body: '<path d="M72 8 92 28 38 82l-26 8 8-26Z"/>', detail: '<path d="m64 16 20 20M20 64l18 18"/>' },
  camera: {
    body: '<path d="M10 32c0-5 4-8 9-8h13l6-10h24l6 10h13c5 0 9 3 9 8v46c0 5-4 8-9 8H19c-5 0-9-3-9-8Z"/>',
    detail: '<circle cx="50" cy="55" r="17"/><circle cx="76" cy="38" r="2.5"/>',
  },
  handshake: {
    body: '<path d="M6 40 26 26l18 6 12-6 38 14v22L72 76c-4 3-8 3-12 0l-8 6c-4 2-8 2-12-2L22 64 6 62Z"/>',
    detail: '<path d="M44 32 34 46c-2 4 2 8 6 6l12-8 20 18M60 76 50 66M52 82l-8-10"/>',
  },
  laptop: {
    body: '<path d="M18 18c0-4 3-6 7-6h50c4 0 7 2 7 6v48l12 14c2 4 0 8-4 8H10c-4 0-6-4-4-8l12-14Z"/>',
    detail: '<path d="M18 66h64M42 78h16"/>',
  },
  clipboard: {
    body: '<path d="M16 24c0-6 4-10 10-10h48c6 0 10 4 10 10v60c0 6-4 10-10 10H26c-6 0-10-4-10-10Z"/>',
    detail: '<path d="M37 8h26v14H37ZM30 42h40M30 56h40M30 70h26"/>',
  },
  target: {
    body: '<path d="M50 8c24 0 42 18 42 42S74 92 50 92 8 74 8 50 26 8 50 8Z"/>',
    detail: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="12"/>',
  },
  crown: { body: '<path d="m8 28 24 20 18-36 18 36 24-20-6 60H14Z"/>', detail: '<path d="M14 74h72"/><circle cx="50" cy="60" r="4"/>' },
  badge: {
    body: '<path d="M32 62 22 94l14-8 8 12 6-28ZM68 62l10 32-14-8-8 12-6-28Z"/><path d="M50 6c19 0 34 15 34 34S69 74 50 74 16 59 16 40 31 6 50 6Z"/>',
    detail: '<circle cx="50" cy="40" r="21"/>',
  },
  flag: {
    body: '<path d="M20 10h8v84h-8Z"/><path d="M28 14c16-8 28 8 44 2 8-3 14-4 18-2v42c-10-2-18 4-30 6s-20-8-32-4Z"/>',
  },
  mic: {
    body: '<path d="M34 22c0-9 7-16 16-16s16 7 16 16v22c0 9-7 16-16 16s-16-7-16-16Z"/><path d="M47 74h6v14h13c2 0 4 2 4 4v2H30v-2c0-2 2-4 4-4h13Z"/>',
    detail: '<path d="M22 44c0 16 12 29 28 29s28-13 28-29M42 22h16M42 34h16"/>',
  },
  thumbs: {
    body: '<path d="m30 46 14-32c2-6 10-6 12 0 2 6 0 16-2 24h28c6 0 10 6 8 12l-6 30c-2 6-6 10-12 10H30Z"/><path d="M8 49c0-3 2-5 5-5h10c3 0 5 2 5 5v38c0 3-2 5-5 5H13c-3 0-5-2-5-5Z"/>',
  },
  check: {
    body: '<path d="M50 8c24 0 42 18 42 42S74 92 50 92 8 74 8 50 26 8 50 8Z"/>',
    detail: '<path d="m29 52 14 15 29-33" stroke-width="7"/>',
  },
  clock: {
    body: '<path d="M50 8c24 0 42 18 42 42S74 92 50 92 8 74 8 50 26 8 50 8Z"/>',
    detail: '<path d="M50 24v26l16 10"/>',
  },
};

export type ArtName = keyof typeof ART;

/**
 * Where each drawing's die-cut silhouette starts along the top-left diagonal,
 * as a fraction of the sticker box (min of x + y). The hover fold starts here
 * so it lands on the artwork, not on empty corner space.
 * Generated by: node --experimental-strip-types scripts/measure-fold.mjs
 */
export const FOLD_START: Record<string, number> = {"star":0.48,"sparkle":0.548,"squiggle":0.48,"arrow":0.536,"arrow-curl":0.641,"bubble":0.359,"bolt":0.621,"heart":0.391,"swoosh":0.609,"megaphone":0.492,"phone":0.306,"calendar":0.387,"chart":0.319,"pen":0.742,"camera":0.411,"handshake":0.468,"laptop":0.367,"clipboard":0.383,"target":0.419,"crown":0.387,"badge":0.435,"flag":0.339,"mic":0.496,"thumbs":0.54,"check":0.419,"clock":0.419};
