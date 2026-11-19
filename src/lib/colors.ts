/** Maps the pastel names used in /content to token variables. */
export const PASTEL_VAR = {
  mint: 'var(--c-mint)',
  blush: 'var(--c-blush)',
  mustard: 'var(--c-mustard)',
  peri: 'var(--c-peri)',
  tangerine: 'var(--c-tangerine)',
  cream: 'var(--c-paper)',
} as const;

/** Theme-aware block colours (deepen in dark mode, carry --on-block text). */
export const BLOCK_VAR = {
  mint: 'var(--block-services)',
  blush: 'var(--block-about)',
  mustard: 'var(--block-pricing)',
  peri: 'var(--block-contact)',
  tangerine: 'var(--block-hero)',
  cream: 'var(--bg)',
} as const;

export type Pastel = keyof typeof PASTEL_VAR;
