/**
 * Peel-and-stick: every .sticker can be picked up and stuck anywhere.
 * No momentum: it goes exactly where you drop it.
 *
 * Stickers stick TO things. On drop, the sticker becomes a child of the
 * topmost surface under it (anything marked [data-surface], otherwise the
 * section), so it inherits that element's behaviour: it tilts in 3D with a
 * tilting card, follows a review note when the note is nudged, rides along
 * with the sticky "How we work" cards, and so on. Rotated surfaces are
 * handled by mapping the drop point into the surface's own coordinates and
 * cancelling its angle, so the sticker lands exactly where (and at the angle)
 * you saw it.
 *
 *  - Mouse/pen: press to peel, drag, release to stick. Inside a link/button a
 *    sticker only peels once you start dragging, so a plain click still works.
 *  - Touch: press and hold briefly to peel, so ordinary swipes keep scrolling.
 *  - Keyboard: focusable stickers move with the arrow keys (Shift = bigger steps).
 *  - [data-sticker-tidy] puts every sticker back where it started.
 *
 * While held, a sticker lives in #sticker-layer (page coordinates) so it can
 * cross sections. The first time a sticker moves, an invisible placeholder
 * keeps its original spot so the layout never jumps.
 */

type Home = { parent: Node; next: Node | null; placeholder: HTMLElement | null; style: string };
type Frame = { o: { x: number; y: number }; ux: { x: number; y: number }; uy: { x: number; y: number } };

const homes = new Map<HTMLElement, Home>();
let zTop = 10;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HELD = 'perspective(520px) rotate3d(1, -1, 0, -14deg) translateY(-6px) scale(1.06)';
const HOLD_MS = 260;
const SURFACE = '[data-surface], .block, .site-footer';
const NOT_A_SURFACE = '.site-header, .tabbar-wrap, .page-wipe, .sticker-placeholder';

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

/* ---------- Coordinate frames ----------
   How a container's local (left, top) maps to the screen, measured with three
   invisible probes. Captures every transform on the way up (rotation, tilt,
   scale) without having to multiply matrices by hand. */
function frame(container: HTMLElement): Frame {
  const probe = (x: number, y: number) => {
    const s = document.createElement('span');
    s.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0;margin:0;padding:0;border:0;pointer-events:none;`;
    container.appendChild(s);
    const r = s.getBoundingClientRect();
    s.remove();
    return { x: r.left, y: r.top };
  };
  const o = probe(0, 0), ax = probe(100, 0), ay = probe(0, 100);
  return { o, ux: { x: (ax.x - o.x) / 100, y: (ax.y - o.y) / 100 }, uy: { x: (ay.x - o.x) / 100, y: (ay.y - o.y) / 100 } };
}
/** Solve o + l*ux + t*uy = (X, Y) for the local point (l, t). */
function toLocal(f: Frame, X: number, Y: number) {
  const dx = X - f.o.x, dy = Y - f.o.y;
  const det = f.ux.x * f.uy.y - f.uy.x * f.ux.y || 1;
  return { l: (dx * f.uy.y - f.uy.x * dy) / det, t: (f.ux.x * dy - dx * f.ux.y) / det };
}
const angleOf = (f: Frame) => (Math.atan2(f.ux.y, f.ux.x) * 180) / Math.PI;
const ownRot = (el: HTMLElement) => parseFloat(getComputedStyle(el).rotate) || 0;
function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** First time a sticker moves: remember where it lives, hold its place, freeze its size. */
function rememberHome(el: HTMLElement) {
  if (homes.has(el)) return;
  const cs = getComputedStyle(el);
  let placeholder: HTMLElement | null = null;
  if (cs.position !== 'absolute' && cs.position !== 'fixed') {
    placeholder = document.createElement('span');
    placeholder.className = 'sticker-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.cssText = `display:inline-block;width:${el.offsetWidth}px;height:${el.offsetHeight}px;margin:${cs.margin};vertical-align:${cs.verticalAlign};`;
    el.parentNode!.insertBefore(placeholder, el);
  }
  homes.set(el, { parent: el.parentNode!, next: el.nextSibling, placeholder, style: el.getAttribute('style') ?? '' });
  // The angle you actually see = own tilt + whatever its container is rotated by.
  el.dataset.vrot = String(ownRot(el) + angleOf(frame(el.parentElement!)));
  // Sizes may have come from the old context (media queries, parent rules): freeze them.
  const size = cs.getPropertyValue('--sticker-size').trim();
  if (size) el.style.setProperty('--sticker-size', size);
  el.style.fontSize = cs.fontSize;
  el.style.margin = '0';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
}

/** Put the sticker inside `container` so its centre lands at screen point (X, Y), at its visible angle. */
function place(el: HTMLElement, container: HTMLElement, X: number, Y: number) {
  const hadFocus = document.activeElement === el;
  if (container !== layer() && getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.appendChild(el);
  const f = frame(container);
  const { l, t } = toLocal(f, X, Y);
  el.style.position = 'absolute';
  el.style.left = `${l - el.offsetWidth / 2}px`;
  el.style.top = `${t - el.offsetHeight / 2}px`;
  el.style.setProperty('--rot', `${parseFloat(el.dataset.vrot ?? '0') - angleOf(f)}deg`);
  el.style.zIndex = String(++zTop);
  if (hadFocus) el.focus({ preventScroll: true });
}

/** The surface under a screen point, ignoring the sticker itself and fixed chrome. */
function surfaceAt(X: number, Y: number, self: HTMLElement): HTMLElement | null {
  for (const hit of document.elementsFromPoint(X, Y)) {
    if (self.contains(hit) || hit.closest(NOT_A_SURFACE)) continue;
    const s = hit.closest<HTMLElement>(SURFACE);
    if (s && !self.contains(s)) return s;
  }
  return null;
}

/** Lift into the page layer at the same spot on screen. */
function lift(el: HTMLElement) {
  if (el.parentElement === layer()) return;
  const c = centerOf(el); // measure before rememberHome() touches its styles
  rememberHome(el);
  place(el, layer(), c.x, c.y);
}

/** Stick onto whatever is underneath. */
function attach(el: HTMLElement) {
  const c = centerOf(el);
  const target = surfaceAt(c.x, c.y, el);
  if (target) place(el, target, c.x, c.y);
}

function pageMoveTo(el: HTMLElement, left: number, top: number) {
  const doc = document.documentElement;
  const maxX = doc.clientWidth - el.offsetWidth;
  const maxY = Math.max(doc.scrollHeight, document.body.scrollHeight) - el.offsetHeight;
  el.style.left = `${Math.min(Math.max(left, 0), Math.max(0, maxX))}px`;
  el.style.top = `${Math.min(Math.max(top, 0), Math.max(0, maxY))}px`;
}

const foldPx = (el: HTMLElement) => getComputedStyle(el).getPropertyValue('--fold').trim() || '0px';

function peel(el: HTMLElement, fromFold: string) {
  el.classList.remove('is-sticking');
  el.classList.add('is-held');
  document.documentElement.classList.add('is-moving-sticker');
  if (reduce()) return;
  // Animated with WAAPI because moving the sticker in the DOM resets CSS transitions.
  el.animate([{ transform: 'none', '--fold': fromFold } as Keyframe, { transform: HELD, '--fold': foldPx(el) } as Keyframe],
    { duration: 240, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' });
}

function stick(el: HTMLElement, fromFold: string) {
  el.classList.remove('is-held');
  document.documentElement.classList.remove('is-moving-sticker');
  if (reduce()) return;
  el.classList.add('is-sticking');
  const anim = el.animate(
    [
      { transform: HELD, '--fold': fromFold } as Keyframe,
      { transform: 'perspective(520px) scale(0.95)', '--fold': '0px', offset: 0.55 } as Keyframe,
      { transform: 'none', '--fold': '0px' } as Keyframe,
    ],
    { duration: 360, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
  );
  const done = () => el.classList.remove('is-sticking');
  anim.finished.then(done).catch(done);
}

/** Put every moved sticker back in its original spot. */
export function tidyStickers() {
  for (const [el, h] of homes) {
    if (h.placeholder?.isConnected) h.placeholder.replaceWith(el);
    else h.parent.insertBefore(el, h.next && h.next.parentNode === h.parent ? h.next : null);
    el.setAttribute('style', h.style);
    delete el.dataset.vrot;
    el.classList.remove('is-held', 'is-sticking');
    if (!reduce()) el.animate([{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' });
  }
  homes.clear();
}

function bind(el: HTMLElement) {
  if (el.dataset.stickerBound) return;
  el.dataset.stickerBound = '1';

  let pointerId = -1;
  let startX = 0, startY = 0;
  let grabX = 0, grabY = 0;     // pointer offset inside the sticker, page coords
  let lastX = 0, lastY = 0;     // last pointer position, screen coords
  let held = false, dragged = false, inControl = false;
  let holdTimer = 0, scrollRaf = 0, keyTimer = 0;

  const follow = () => pageMoveTo(el, lastX + window.scrollX - grabX, lastY + window.scrollY - grabY);

  const startHold = () => {
    const before = foldPx(el);
    lift(el);
    grabX = lastX + window.scrollX - parseFloat(el.style.left);
    grabY = lastY + window.scrollY - parseFloat(el.style.top);
    held = true;
    try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }
    peel(el, before);
    edgeScroll();
  };

  // Auto-scroll near the top/bottom of the screen so "anywhere on the page" is reachable.
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
    e.stopPropagation(); // don't also drag a review note the sticker is stuck to
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    dragged = false;
    inControl = !!el.parentElement?.closest('a, button, summary, label');
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
    if (held) {
      held = false;
      const before = foldPx(el);
      attach(el);
      stick(el, before);
    }
    pointerId = -1;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', (e) => { if (held) end(e); });

  // While held on touch, stop the page scrolling under the finger.
  el.addEventListener('touchmove', (e) => { if (held) e.preventDefault(); }, { passive: false });
  el.addEventListener('contextmenu', (e) => { if (held || holdTimer) e.preventDefault(); });
  // Swallow the click that follows a drag (so a sticker in a button doesn't press it).
  el.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);

  // Keyboard alternative: move in the page layer, then stick to what's underneath once you pause.
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 64 : 16;
    const d = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, number[]>)[e.key];
    if (!d) return;
    e.preventDefault();
    lift(el);
    pageMoveTo(el, parseFloat(el.style.left) + d[0], parseFloat(el.style.top) + d[1]);
    clearTimeout(keyTimer);
    keyTimer = window.setTimeout(() => attach(el), 450);
  });
}

export function initStickers(root: ParentNode = document) {
  homes.clear(); // each page load starts fresh (the old body, and its layer, are gone)
  root.querySelectorAll<HTMLElement>('.sticker').forEach((el) => {
    if (!el.closest('.sticker__flap')) bind(el);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-sticker-tidy]').forEach((btn) => {
    if (btn.dataset.tidyBound) return;
    btn.dataset.tidyBound = '1';
    btn.addEventListener('click', tidyStickers);
  });
}
