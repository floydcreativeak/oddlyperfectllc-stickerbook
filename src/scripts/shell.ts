/**
 * Site shell behaviour (tiny, no framework, loaded on every page):
 *  - theme toggle (persists choice, syncs labels + <meta name="theme-color">)
 *  - header hides on scroll down, returns on scroll up / on focus
 *  - footer easter egg
 *  - colour-block page wipe for Astro view transitions
 * Everything re-binds on `astro:page-load` because the ClientRouter swaps pages.
 */

import { initDrag } from './drag';
import { initStickers } from './stickers';
import { initTilt, initReveal } from './tilt';

const STORAGE_KEY = 'op-theme';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Theme ---------------- */
function effectiveTheme(): 'light' | 'dark' {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeUi() {
  const theme = effectiveTheme();
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', theme === 'dark' ? btn.dataset.labelLight! : btn.dataset.labelDark!);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'dark' ? '#2a2033' : '#f6eedc');
}

function bindTheme() {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode: fine, just not remembered */ }
      syncThemeUi();
    });
  });
  syncThemeUi();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeUi);

/* ---------------- Header hide/show ---------------- */
let lastY = 0;
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    const y = window.scrollY;
    if (header && !header.contains(document.activeElement)) {
      const delta = y - lastY;
      if (y < 80 || delta < -4) header.removeAttribute('data-hidden');
      else if (delta > 6) header.setAttribute('data-hidden', '');
    }
    lastY = y;
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
document.addEventListener('focusin', (e) => {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (header?.contains(e.target as Node)) header.removeAttribute('data-hidden');
});

/* ---------------- Easter egg ---------------- */
function bindEgg() {
  document.querySelectorAll<HTMLButtonElement>('[data-egg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      const target = document.getElementById(btn.getAttribute('aria-controls')!);
      if (target) target.hidden = !open;
    });
  });
}

/* ---------------- Colour-block page wipe ----------------
   On navigation a block in the destination page's colour sweeps up over the
   page, the new page swaps in underneath, and the block sweeps off the top. */
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
document.addEventListener('astro:before-preparation', (ev) => {
  const wipe = document.querySelector<HTMLElement>('[data-page-wipe]');
  if (!wipe || reducedMotion()) return;
  const source = (ev as Event & { sourceElement?: Element }).sourceElement;
  const color = source?.closest<HTMLElement>('[data-wipe]')?.dataset.wipe ?? 'var(--c-tangerine)';
  wipe.style.setProperty('--wipe', color);
  wipe.dataset.active = '';
  const anim = wipe.animate(
    [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }],
    { duration: 360, easing: EASE, fill: 'forwards' },
  );
  const e = ev as Event & { loader: () => Promise<void> };
  const original = e.loader;
  e.loader = async () => { await Promise.all([original(), anim.finished]); };
});

document.addEventListener('astro:after-swap', () => {
  const wipe = document.querySelector<HTMLElement>('[data-page-wipe]');
  if (!wipe || !('active' in wipe.dataset)) return;
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  const anim = wipe.animate(
    [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }],
    { duration: 420, easing: EASE, fill: 'forwards', delay: 40 },
  );
  anim.finished.then(() => { delete wipe.dataset.active; }).catch(() => {});
});

/* ---------------- Boot ---------------- */
document.addEventListener('astro:page-load', () => {
  lastY = window.scrollY;
  document.querySelector('[data-site-header]')?.removeAttribute('data-hidden');
  bindTheme();
  bindEgg();
  initDrag();
  initStickers();
  initTilt();
  initReveal();
});
