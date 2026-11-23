/**
 * Smooth expandables. Every <details> on the site keeps its native,
 * accessible behaviour (keyboard, screen readers, works without JS), and this
 * layers on:
 *  - an eased height animation for opening and closing, with the contents
 *    fading in, instead of the native instant snap
 *  - exclusive groups (details sharing a `name`) close the previous one with
 *    the same animation
 *  - row sync: inside a [data-sync-row] grid, opening one card's details opens
 *    the others in the same visual row too, so no card is left stretched and
 *    empty. Closing works the same way.
 * Reduced motion: no height animation, just the state change.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DURATION = 420;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new WeakMap<HTMLDetailsElement, Animation>();

function summaryOf(d: HTMLDetailsElement) {
  return d.querySelector(':scope > summary') as HTMLElement;
}

/** Animate a details element open or closed. Resolves when finished. */
function setOpen(d: HTMLDetailsElement, open: boolean): Promise<void> {
  if (d.open === open && !running.has(d)) return Promise.resolve();
  running.get(d)?.cancel();
  if (reduce()) { d.open = open; return Promise.resolve(); }

  // Layout heights (offsetHeight), not getBoundingClientRect: many cards are
  // rotated, and a rotated bounding box is taller than the real box.
  const cs = getComputedStyle(d);
  const chrome = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, k) => n + parseFloat(cs[k as keyof CSSStyleDeclaration] as string), 0);
  const startH = d.offsetHeight;
  const closedH = summaryOf(d).offsetHeight + chrome;
  if (open) d.open = true;
  const endH = open ? (d.style.height = 'auto', d.offsetHeight) : closedH;
  d.style.overflow = 'clip';
  d.dataset.animating = open ? 'opening' : 'closing';

  const anim = d.animate([{ height: `${startH}px` }, { height: `${endH}px` }], { duration: DURATION, easing: EASE });
  running.set(d, anim);
  // Fade the body in/out alongside the height.
  const body = [...d.children].filter((c) => c.tagName !== 'SUMMARY') as HTMLElement[];
  body.forEach((el) => el.animate(
    open ? [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 1 }, { opacity: 0 }],
    { duration: open ? DURATION : DURATION * 0.6, easing: EASE, fill: 'both' },
  ));

  const finish = () => {
    if (!open) d.open = false;
    d.style.height = '';
    d.style.overflow = '';
    delete d.dataset.animating;
    running.delete(d);
    body.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  };
  return anim.finished.then(finish, () => { /* cancelled by a newer toggle */ });
}

/** Other details that should follow this one: same row in a [data-sync-row] grid. */
function rowMates(d: HTMLDetailsElement): HTMLDetailsElement[] {
  const grid = d.closest<HTMLElement>('[data-sync-row]');
  if (!grid) return [];
  const item = [...grid.children].find((c) => c.contains(d)) as HTMLElement | undefined;
  if (!item) return [];
  const top = item.getBoundingClientRect().top;
  const tolerance = 40; // cards are slightly rotated, so allow a little wobble
  return [...grid.children]
    .filter((c) => c !== item && Math.abs((c as HTMLElement).getBoundingClientRect().top - top) < tolerance)
    .map((c) => c.querySelector('details'))
    .filter((x): x is HTMLDetailsElement => !!x);
}

function bind(d: HTMLDetailsElement) {
  if (d.dataset.accordionBound) return;
  d.dataset.accordionBound = '1';
  // Take over exclusive groups so closing the old one can animate too.
  const group = d.getAttribute('name');
  if (group) { d.dataset.group = group; d.removeAttribute('name'); }

  summaryOf(d)?.addEventListener('click', (e) => {
    e.preventDefault();
    const opening = !(d.open && d.dataset.animating !== 'closing');
    const targets = [d, ...rowMates(d)];
    if (opening && d.dataset.group) {
      document.querySelectorAll<HTMLDetailsElement>(`details[data-group="${CSS.escape(d.dataset.group)}"]`).forEach((other) => {
        if (other !== d && other.open) setOpen(other, false);
      });
    }
    targets.forEach((t) => setOpen(t, opening));
  });
}

export function initAccordions(root: ParentNode = document) {
  root.querySelectorAll<HTMLDetailsElement>('details').forEach(bind);
}
