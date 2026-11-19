/** Cards lean toward the cursor. Fine pointers only, never with reduced motion. */
export function initTilt(root: ParentNode = document) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tx', `${(px * 9).toFixed(2)}deg`);
      el.style.setProperty('--ty', `${(-py * 9).toFixed(2)}deg`);
      el.classList.add('is-tilting');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
    });
  });
}

/** Adds .is-in to [data-rise] and [data-slap] elements as they scroll into view. */
export function initReveal(root: ParentNode = document) {
  const els = root.querySelectorAll<HTMLElement>('[data-rise], [data-slap]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}
