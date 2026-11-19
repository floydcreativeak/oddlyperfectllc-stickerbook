/**
 * Peel-and-stick: every .sticker on the page can be picked up and stuck
 * anywhere on the page. No momentum: it goes exactly where you drop it.
 *
 *  - Mouse/pen: press to peel (fold deepens, sticker lifts), drag, release to stick.
 *    Stickers inside a link/button only peel after you start dragging, so a
 *    plain click still works.
 *  - Touch: press and hold briefly to peel, so ordinary swipes keep scrolling.
 *  - Keyboard: focusable stickers (tabindex) move with the arrow keys (Shift = bigger steps).
 *  - [data-sticker-tidy] buttons put every sticker back where it started.
 *
 * A peeled sticker moves into a page-wide layer (#sticker-layer) so it can
 * cross section boundaries; an invisible placeholder keeps the layout still.
 */

type Home = { parent: Node; next: Node | null; placeholder: HTMLElement | null; style: string };

const homes = new Map<HTMLElement, Home>();
let zTop = 10;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HELD = 'perspective(520px) rotate3d(1, -1, 0, -14deg) translateY(-6px) scale(1.06)';
const HOLD_MS = 260;

function layer(): HTMLElement {
  let l = document.getElementById('sticker-layer');
  if (!l) {
    l = document.createElement('div');
    l.id = 'sticker-layer';
    l.className = 'sticker-layer';
    document.body.appendChild(l);
  }
  return l;
}

function pageBounds(el: HTMLElement) {
  const doc = document.documentElement;
  return {
    maxX: doc.clientWidth - el.offsetWidth,
    maxY: Math.max(doc.scrollHeight, document.body.scrollHeight) - el.offsetHeight,
  };
}
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/** Move a sticker out of its section into the page layer, keeping its exact spot and size. */
function detach(el: HTMLElement) {
  if (homes.has(el)) return;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const cx = r.left + r.width / 2 + window.scrollX;
  const cy = r.top + r.height / 2 + window.scrollY;

  let placeholder: HTMLElement | null = null;
  if (cs.position !== 'absolute' && cs.position !== 'fixed') {
    placeholder = document.createElement('span');
    placeholder.className = 'sticker-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.cssText = `display:inline-block;width:${w}px;height:${h}px;margin:${cs.margin};vertical-align:${cs.verticalAlign};`;
    el.parentNode!.insertBefore(placeholder, el);
  }
  homes.set(el, { parent: el.parentNode!, next: el.nextSibling, placeholder, style: el.getAttribute('style') ?? '' });

  // Freeze sizes that came from the old context (media queries, parent rules).
  const size = cs.getPropertyValue('--sticker-size').trim();
  const font = cs.fontSize;
  const hadFocus = document.activeElement === el;
  layer().appendChild(el);
  if (size) el.style.setProperty('--sticker-size', size);
  el.style.fontSize = font;
  el.style.margin = '0';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.left = `${cx - w / 2}px`;
  el.style.top = `${cy - h / 2}px`;
  el.style.zIndex = String(++zTop);
  if (hadFocus) el.focus({ preventScroll: true });
}

function moveTo(el: HTMLElement, left: number, top: number) {
  const b = pageBounds(el);
  el.style.left = `${clamp(left, 0, b.maxX)}px`;
  el.style.top = `${clamp(top, 0, b.maxY)}px`;
}

function peel(el: HTMLElement) {
  el.classList.remove('is-sticking');
  el.classList.add('is-held');
  el.style.zIndex = String(++zTop);
  document.documentElement.classList.add('is-moving-sticker');
  if (!reduce()) el.animate([{ transform: 'none' }, { transform: HELD }], { duration: 230, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' });
}

function stick(el: HTMLElement) {
  el.classList.remove('is-held');
  document.documentElement.classList.remove('is-moving-sticker');
  if (reduce()) return;
  el.classList.add('is-sticking');
  const anim = el.animate(
    [{ transform: HELD }, { transform: 'perspective(520px) scale(0.95)', offset: 0.55 }, { transform: 'none' }],
    { duration: 340, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
  );
  anim.finished.then(() => el.classList.remove('is-sticking')).catch(() => el.classList.remove('is-sticking'));
}

/** Put every peeled sticker back in its original spot. */
export function tidyStickers() {
  for (const [el, h] of homes) {
    if (h.placeholder?.isConnected) h.placeholder.replaceWith(el);
    else h.parent.insertBefore(el, h.next && h.next.parentNode === h.parent ? h.next : null);
    el.setAttribute('style', h.style);
    el.classList.remove('is-held', 'is-sticking');
    if (!reduce()) el.animate([{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' });
  }
  homes.clear();
}

function bind(el: HTMLElement) {
  if (el.dataset.stickerBound) return;
  el.dataset.stickerBound = '1';
  // Inside a link or button: only peel once the pointer actually drags, so clicks still work.
  const inControl = !!el.parentElement?.closest('a, button, summary, label');

  let pointerId = -1;
  let startX = 0, startY = 0;
  let grabX = 0, grabY = 0;     // pointer offset inside the sticker, page coords
  let lastX = 0, lastY = 0;     // last pointer client coords
  let held = false, dragged = false;
  let holdTimer = 0;
  let scrollRaf = 0;

  const startHold = () => {
    detach(el);
    const left = parseFloat(el.style.left), top = parseFloat(el.style.top);
    grabX = lastX + window.scrollX - left;
    grabY = lastY + window.scrollY - top;
    held = true;
    try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }
    peel(el);
    edgeScroll();
  };

  const follow = () => moveTo(el, lastX + window.scrollX - grabX, lastY + window.scrollY - grabY);

  // Auto-scroll when dragging near the top/bottom of the screen, so "anywhere on the page" is reachable.
  const edgeScroll = () => {
    cancelAnimationFrame(scrollRaf);
    const tick = () => {
      if (!held) return;
      const edge = 70;
      let dy = 0;
      if (lastY < edge) dy = -Math.ceil((edge - lastY) / 5);
      else if (lastY > window.innerHeight - edge) dy = Math.ceil((lastY - (window.innerHeight - edge)) / 5);
      if (dy) { window.scrollBy(0, dy); follow(); }
      scrollRaf = requestAnimationFrame(tick);
    };
    scrollRaf = requestAnimationFrame(tick);
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    dragged = false;
    if (e.pointerType === 'touch') {
      holdTimer = window.setTimeout(startHold, HOLD_MS);
      return;
    }
    e.preventDefault();
    if (!inControl) startHold();
    else try { el.setPointerCapture(pointerId); } catch { /* ignore */ }
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    lastX = e.clientX;
    lastY = e.clientY;
    const dist = Math.hypot(lastX - startX, lastY - startY);
    if (holdTimer && !held) {
      if (dist > 8) { clearTimeout(holdTimer); holdTimer = 0; } // it's a scroll, not a hold
      return;
    }
    if (!held && inControl && e.pointerType !== 'touch' && el.hasPointerCapture(pointerId) && dist > 5) startHold();
    if (!held) return;
    if (dist > 3) dragged = true;
    follow();
  });

  const end = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    clearTimeout(holdTimer);
    holdTimer = 0;
    cancelAnimationFrame(scrollRaf);
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    if (held) { held = false; stick(el); }
    pointerId = -1;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', (e) => { if (held) end(e); });

  // While a sticker is held on touch, stop the page from scrolling under the finger.
  el.addEventListener('touchmove', (e) => { if (held) e.preventDefault(); }, { passive: false });
  el.addEventListener('contextmenu', (e) => { if (held || holdTimer) e.preventDefault(); });
  // Swallow the click that follows a drag (so dragging a sticker inside a button doesn't press it).
  el.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);

  // Keyboard alternative for focusable stickers.
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 64 : 16;
    const d = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, number[]>)[e.key];
    if (!d) return;
    e.preventDefault();
    detach(el);
    moveTo(el, parseFloat(el.style.left) + d[0], parseFloat(el.style.top) + d[1]);
  });
}

export function initStickers(root: ParentNode = document) {
  // Each page load starts fresh (the old body, and its layer, are gone).
  homes.clear();
  root.querySelectorAll<HTMLElement>('.sticker').forEach((el) => {
    if (el.closest('.sticker__flap')) return;
    bind(el);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-sticker-tidy]').forEach((btn) => {
    if (btn.dataset.tidyBound) return;
    btn.dataset.tidyBound = '1';
    btn.addEventListener('click', tidyStickers);
  });
}
