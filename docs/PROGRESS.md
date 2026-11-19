# Build Log: Oddly Perfect "Sticker Sheet"

Working notes for developers. The source of truth for *what* to build is
`DESIGN_BRIEF.md` (Part 1) and `OddlyPerfect_Direction-C-Sticker-Sheet.md`
(Part 2). This file tracks *where we are*, decisions made along the way, and
what's left. The editor-facing guide is `README.md`; open client asks are in
`NEEDS_FROM_CLIENT.md`.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold: Astro + React, content schemas, tokens, fonts, CI, Pages CMS | Done |
| 2 | Shell: layout, glass nav, tab bar + Call FAB, theme toggle, footer, transitions | Done, awaiting look approval |
| 3 | Home page, 7 sections | Not started |
| 4 | Inner pages | Not started |
| 5 | Motion and delight | Not started |
| 6 | Hardening: axe, Lighthouse, keyboard, reduced motion, perf, README | Not started |

## Stack

- Astro 7 static output, `@astrojs/react` for islands, `@astrojs/sitemap`.
- Content layer: `glob()` loaders reading `/content`, Zod 4 via `astro/zod`.
- Vanilla CSS on tokens (`src/styles/tokens.css`). No CSS framework.
- GSAP + Three.js only through dynamic `import()` behind a capability check.
- Node 22 in CI.

## Decisions

- **Content lives at repo root `/content`, not `src/content`,** so the editor
  sees a short, obvious folder in Pages CMS.
- **Photos live in `content/media`** and are referenced as `../media/x.jpg`
  from files one folder deep (`team/`, `gallery/`). That's why no root-level
  content file has an image field: Pages CMS writes one output prefix.
- **Placeholders are explicit.** Phone, email, hours, socials, prices,
  reviews, services, team and photos carry `placeholder: true`. Strict lint
  (`npm run lint:content:strict`) is what production deploys run, so the site
  physically can't launch with stand-ins. A manual "Allow placeholders" deploy
  exists for client previews.
- **Fonts are committed** as tight subsets in `public/fonts` (about 60 KB for
  all four files). Regenerate with `scripts/subset-fonts.sh`.
- **Emoji are blocked in text twice:** by the Zod `text()` helper at build time
  and by the content lint. Emoji stickers are SVG files in
  `public/stickers/emoji`, referenced by filename from `content/stickers.yml`.
- **American spelling** throughout (US LLC, US review sources).
- **Dark mode** deepens block hues and flips block text to cream (each pairing
  is noted with its ratio in `tokens.css`). Muted text is never used on blocks.
- **Pages CMS:** no YAML merge keys in `.pages.yml` (its parser doesn't apply
  them). `scripts/check-cms-config.mjs` (in CI) proves every content key has a
  form field, so CMS saves can't drop data.

## Contrast table (verified with scripts/contrast.mjs)

| Pair | Ratio |
| --- | --- |
| Ink #2E2238 on cream #F6EEDC | 12.97 |
| Ink on paper #FBF6EA | 13.89 |
| Ink on tangerine #E98B5B (Call button) | 5.93 |
| Ink on mustard / blush / mint / peri | 8.18 / 8.58 / 9.19 / 7.58 |
| Muted #5B4A66 on cream | 6.95 (never on blocks: 4.38 on mustard) |
| Tangerine-ink #B5481A on cream (accent as text) | 4.65 |
| Cream #F3EAD8 on plum #2A2033 / surface #372B42 | 12.99 / 11.07 |
| Cream on dark tangerine / mustard / blush / mint / peri | 5.20 / 5.23 / 6.08 / 5.57 / 6.37 |
| Cream on footer plum #1F1726 | 14.54 |
| Tangerine on plum (accent text, dark) | 6.14 |

## Phase 2 notes

- Shell behaviour is one small vanilla module (`src/scripts/shell.ts`), re-bound
  on `astro:page-load`. No React on the critical path yet.
- No-flash theme: inline head script reads `localStorage['op-theme']` and also
  re-applies to the incoming document on `astro:before-swap`.
- Page transitions: Astro's root animation is disabled; a persisted
  `.page-wipe` block in the destination link's colour (`data-wipe`) sweeps up,
  the page swaps underneath, and it sweeps off. Skipped under reduced motion.
  Hidden with `visibility` when idle.
- Mobile Call FAB docks bottom-right above the tab bar so it never covers a tab.
  Its phone-ring wiggle runs 3 times then stops (WCAG 2.2.2).
- Every aria-label and visible string comes from content (`site.a11y.*`).
- Emoji sticker art: Noto via `@iconify-json/noto` (`scripts/extract-emoji.mjs`),
  Apache-2.0 notice in `public/stickers/emoji/LICENSE-noto-emoji.txt`.
- Astro 7 `astro preview` is a background daemon, so scripts use
  `scripts/serve-dist.mjs` instead.
- Screenshots: `npm run build && node scripts/screenshots.mjs <dir> / /services/`.

## To do / open threads

- [x] Phase 2 screenshots for approval (375 and 1440, light and dark).
- [x] Noto Emoji SVGs into `public/stickers/emoji`, Apache-2.0 notice.
- [x] Hand-drawn sticker sprite (26 drawings, `src/lib/sticker-art.ts`).
- [ ] OG share image (`/og.png`) referenced in head; generate in Phase 4.
- [ ] 404 page (copy already in `site.yml`).
- [ ] Legal page copy (privacy covers GA4 + consent).
- [ ] Brochure PDF: generate a branded one-pager if the client has none.
- [ ] Confirm the private-repo Pages plan before first deploy.
