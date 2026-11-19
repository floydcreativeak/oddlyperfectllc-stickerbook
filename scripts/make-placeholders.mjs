// Generates flagged placeholder photos (flat "studio set" compositions) into
// content/media. They are NOT stock photos: simple shapes on a seamless
// backdrop, in the final palette, in varied aspect ratios. Replace each one
// with a real photo and set placeholder: false in its content file.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const C = { cream: '#F6EEDC', paper: '#FBF6EA', ink: '#2E2238', mustard: '#E8B94A', blush: '#F0B6B0', mint: '#A8D5BA', peri: '#A9B7E8', tan: '#E98B5B', plum: '#5B4A66', skin1: '#C98E6B', skin2: '#8D5B3E', skin3: '#E3B79A' };
const out = 'content/media';
mkdirSync(out, { recursive: true });

// Studio backdrop: wall + floor with a crisp sweep line and a soft (blurred) contact shadow.
const studio = (w, h, wall, floor, horizon = 0.72) => `
  <rect width="${w}" height="${h}" fill="${wall}"/>
  <path d="M0 ${h * horizon} Q ${w / 2} ${h * (horizon + 0.04)} ${w} ${h * horizon} V ${h} H 0 Z" fill="${floor}"/>`;
const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.ink}" opacity="0.22" filter="url(#soft)"/>`;
const defs = `<defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter></defs>`;

// A friendly portrait bust (no face details: it's a stand-in, not a person).
const bust = (w, h, skin, top, hair) => {
  const cx = w / 2, headR = w * 0.16, headY = h * 0.38;
  return `
    ${shadow(cx, h * 0.98, w * 0.42, h * 0.05)}
    <path d="M ${cx - w * 0.36} ${h} C ${cx - w * 0.34} ${h * 0.66} ${cx - w * 0.2} ${h * 0.6} ${cx} ${h * 0.6} C ${cx + w * 0.2} ${h * 0.6} ${cx + w * 0.34} ${h * 0.66} ${cx + w * 0.36} ${h} Z" fill="${top}"/>
    <rect x="${cx - w * 0.06}" y="${headY + headR * 0.6}" width="${w * 0.12}" height="${h * 0.12}" rx="${w * 0.04}" fill="${skin}"/>
    <ellipse cx="${cx}" cy="${headY}" rx="${headR}" ry="${headR * 1.18}" fill="${skin}"/>
    <path d="M ${cx - headR * 1.08} ${headY - headR * 0.05} C ${cx - headR * 1.2} ${headY - headR * 1.6} ${cx + headR * 1.25} ${headY - headR * 1.7} ${cx + headR * 1.1} ${headY + headR * 0.1} C ${cx + headR * 0.6} ${headY - headR * 0.75} ${cx - headR * 0.4} ${headY - headR * 0.7} ${cx - headR * 1.08} ${headY - headR * 0.05} Z" fill="${hair}"/>`;
};

// Desk flat-lay props
const laptop = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s * 0.64}" rx="${s * 0.04}" fill="${C.ink}"/><rect x="${x + s * 0.05}" y="${y + s * 0.05}" width="${s * 0.9}" height="${s * 0.54}" rx="${s * 0.02}" fill="${C.peri}"/><rect x="${x + s * 0.12}" y="${y + s * 0.14}" width="${s * 0.42}" height="${s * 0.08}" rx="${s * 0.03}" fill="${C.paper}"/><rect x="${x + s * 0.12}" y="${y + s * 0.28}" width="${s * 0.6}" height="${s * 0.05}" rx="${s * 0.02}" fill="${C.paper}" opacity=".7"/>`;
const mug = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.paper}"/><circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="${C.skin2}"/><rect x="${x + r * 0.9}" y="${y - r * 0.22}" width="${r * 0.55}" height="${r * 0.44}" rx="${r * 0.2}" fill="${C.paper}"/>`;
const notebook = (x, y, w, h, col, rot) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.05}" fill="${col}"/><rect x="${x + w * 0.1}" y="${y + h * 0.15}" width="${w * 0.6}" height="${h * 0.06}" rx="${h * 0.03}" fill="${C.ink}" opacity=".75"/><rect x="${x + w * 0.1}" y="${y + h * 0.27}" width="${w * 0.45}" height="${h * 0.04}" rx="${h * 0.02}" fill="${C.ink}" opacity=".45"/></g>`;
const note = (x, y, s, col, rot) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${col}" transform="rotate(${rot} ${x + s / 2} ${y + s / 2})"/>`;
const phone = (x, y, w, rot) => `<g transform="rotate(${rot} ${x + w / 2} ${y + w})"><rect x="${x}" y="${y}" width="${w}" height="${w * 2}" rx="${w * 0.16}" fill="${C.ink}"/><rect x="${x + w * 0.07}" y="${y + w * 0.12}" width="${w * 0.86}" height="${w * 1.76}" rx="${w * 0.1}" fill="${C.tan}"/><circle cx="${x + w * 0.5}" cy="${y + w * 0.8}" r="${w * 0.22}" fill="${C.cream}"/></g>`;
const mic = (cx, base, h) => `${shadow(cx, base, h * 0.2, h * 0.03)}<rect x="${cx - h * 0.012}" y="${base - h * 0.62}" width="${h * 0.024}" height="${h * 0.62}" fill="${C.ink}"/><ellipse cx="${cx}" cy="${base}" rx="${h * 0.14}" ry="${h * 0.03}" fill="${C.ink}"/><rect x="${cx - h * 0.07}" y="${base - h * 0.86}" width="${h * 0.14}" height="${h * 0.26}" rx="${h * 0.07}" fill="${C.plum}"/>`;

const scenes = [
  // Team portraits (4:5)
  { file: 'placeholder-team-founder.jpg', w: 1200, h: 1500, svg: (w, h) => studio(w, h, C.blush, C.tan, 0.8) + bust(w, h, C.skin1, C.ink, C.skin2) },
  { file: 'placeholder-team-partner.jpg', w: 1200, h: 1500, svg: (w, h) => studio(w, h, C.peri, C.mint, 0.8) + bust(w, h, C.skin3, C.mustard, C.ink) },
  // Gallery, varied ratios
  { file: 'placeholder-desk.jpg', w: 1800, h: 1200, svg: (w, h) => `<rect width="${w}" height="${h}" fill="${C.mustard}"/>${laptop(w * 0.3, h * 0.25, w * 0.4)}${mug(w * 0.82, h * 0.3, w * 0.06)}${notebook(w * 0.06, h * 0.52, w * 0.2, h * 0.38, C.blush, -10)}${note(w * 0.78, h * 0.62, w * 0.12, C.mint, 8)}${note(w * 0.63, h * 0.74, w * 0.1, C.peri, -6)}` },
  { file: 'placeholder-phone.jpg', w: 1200, h: 1800, svg: (w, h) => studio(w, h, C.mint, C.peri, 0.7) + shadow(w * 0.5, h * 0.86, w * 0.25, h * 0.03) + phone(w * 0.35, h * 0.28, w * 0.3, -8) },
  { file: 'placeholder-mic.jpg', w: 1600, h: 1600, svg: (w, h) => studio(w, h, C.tan, C.mustard, 0.74) + mic(w * 0.5, h * 0.84, h * 0.8) },
  { file: 'placeholder-planner.jpg', w: 1920, h: 1080, svg: (w, h) => `<rect width="${w}" height="${h}" fill="${C.peri}"/>${notebook(w * 0.1, h * 0.14, w * 0.3, h * 0.72, C.paper, -4)}${notebook(w * 0.44, h * 0.18, w * 0.26, h * 0.66, C.mustard, 5)}${note(w * 0.76, h * 0.2, w * 0.12, C.blush, 10)}${note(w * 0.78, h * 0.55, w * 0.12, C.mint, -7)}${mug(w * 0.9, h * 0.86, w * 0.045)}` },
  { file: 'placeholder-event.jpg', w: 1200, h: 1500, svg: (w, h) => studio(w, h, C.cream, C.blush, 0.76) + `<rect x="${w * 0.14}" y="${h * 0.12}" width="${w * 0.72}" height="${h * 0.34}" rx="${w * 0.04}" fill="${C.tan}"/><rect x="${w * 0.22}" y="${h * 0.2}" width="${w * 0.56}" height="${h * 0.06}" rx="${h * 0.03}" fill="${C.ink}"/><rect x="${w * 0.22}" y="${h * 0.3}" width="${w * 0.36}" height="${h * 0.04}" rx="${h * 0.02}" fill="${C.cream}"/>` + mic(w * 0.5, h * 0.92, h * 0.4) },
  { file: 'placeholder-flatlay.jpg', w: 1500, h: 1125, svg: (w, h) => `<rect width="${w}" height="${h}" fill="${C.blush}"/>${phone(w * 0.12, h * 0.2, w * 0.14, 12)}${notebook(w * 0.38, h * 0.12, w * 0.3, h * 0.6, C.mint, -3)}${mug(w * 0.82, h * 0.3, w * 0.07)}${note(w * 0.74, h * 0.6, w * 0.13, C.mustard, 6)}` },
];

for (const s of scenes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">${defs}${s.svg(s.w, s.h)}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}/${s.file}`);
  console.log('wrote', s.file, `${s.w}x${s.h}`);
}
