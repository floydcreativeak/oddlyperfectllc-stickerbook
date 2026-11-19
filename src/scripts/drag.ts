/**
 * Nudgeable sticky notes (the review wall). Stickers use src/scripts/stickers.ts.
 *
 * Markup contract:
 *   [data-drag-area]              the box items can move within
 *     data-drag-touch="false"     ignore touch drags (so finger-scrolling still works, e.g. the review wall)
 *     [data-drag]                 a movable item (focusable; arrow keys move it)
 *     [data-drag-reset]           optional button that puts everything back
 *
 * No momentum: a note stays exactly where it's dropped. A slight tilt follows
 * the drag direction while held (off with reduced motion).
 */

type Item = {
  el: HTMLElement;
  x: number; y: number; vx: number; vy: number; tilt: number;
};

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
let zTop = 10;

function apply(it: Item) {
  it.el.style.translate = `${it.x.toFixed(1)}px ${it.y.toFixed(1)}px`;
  it.el.style.setProperty('--drag-tilt', `${it.tilt.toFixed(2)}deg`);
}

/** Allowed translate range so the item stays inside its area (with a little overhang). */
function bounds(it: Item, area: HTMLElement) {
  const a = area.getBoundingClientRect();
  const r = it.el.getBoundingClientRect();
  const baseL = r.left - it.x, baseT = r.top - it.y;
  const over = Math.min(r.width, r.height) * 0.25;
  return {
    minX: a.left - baseL - over, maxX: a.right - baseL - r.width + over,
    minY: a.top - baseT - over, maxY: a.bottom - baseT - r.height + over,
  };
}

function bindArea(area: HTMLElement) {
  if (area.dataset.dragBound) return;
  area.dataset.dragBound = '1';
  const allowTouch = area.dataset.dragTouch !== 'false';
  const items: Item[] = [];

  area.querySelectorAll<HTMLElement>('[data-drag]').forEach((el) => {
    const it: Item = { el, x: 0, y: 0, vx: 0, vy: 0, tilt: 0 };
    items.push(it);
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;

    let startX = 0, startY = 0, ox = 0, oy = 0, moved = false;
    let samples: { t: number; x: number; y: number }[] = [];

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (!allowTouch && e.pointerType === 'touch') return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY; ox = it.x; oy = it.y; moved = false;
      samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
      el.style.zIndex = String(++zTop);
      el.classList.add('is-dragging');
    });

    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const b = bounds(it, area);
      it.x = clamp(ox + dx, b.minX, b.maxX);
      it.y = clamp(oy + dy, b.minY, b.maxY);
      const now = performance.now();
      samples.push({ t: now, x: e.clientX, y: e.clientY });
      while (samples.length > 2 && now - samples[0].t > 90) samples.shift();
      if (!reduce()) {
        const s0 = samples[0];
        const vx = (e.clientX - s0.x) / Math.max(16, now - s0.t);
        it.tilt = clamp(vx * 10, -8, 8);
      }
      apply(it);
    });

    const release = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      el.releasePointerCapture(e.pointerId);
      el.classList.remove('is-dragging');
      it.tilt = 0;
      el.classList.add('is-nudged');
      apply(it);
      window.setTimeout(() => el.classList.remove('is-nudged'), 300);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // Keyboard alternative: arrows move, Shift = bigger steps.
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 48 : 14;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!d) return;
      e.preventDefault();
      const b = bounds(it, area);
      it.x = clamp(it.x + d[0], b.minX, b.maxX);
      it.y = clamp(it.y + d[1], b.minY, b.maxY);
      it.tilt = reduce() ? 0 : clamp(d[0] * 0.25, -8, 8);
      el.style.zIndex = String(++zTop);
      el.classList.add('is-nudged');
      apply(it);
      window.setTimeout(() => { it.tilt = 0; apply(it); el.classList.remove('is-nudged'); }, 160);
    });
  });

  area.querySelectorAll<HTMLButtonElement>('[data-drag-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      for (const it of items) {
        it.x = it.y = it.vx = it.vy = it.tilt = 0;
        it.el.classList.add('is-returning');
        apply(it);
        window.setTimeout(() => it.el.classList.remove('is-returning'), 700);
      }
    });
  });
}

export function initDrag(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-drag-area]').forEach(bindArea);
}
