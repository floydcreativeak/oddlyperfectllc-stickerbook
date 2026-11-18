# Oddly Perfect LLC: Part 1, Shared Foundation

## Part 1: Shared Foundation (identical in all three directions)

### 1. Basics
- **Business:** Oddly Perfect LLC. A PR management firm that tailors each client's experience to fit their needs perfectly.
- **Domain:** oddlyperfectllc.com (custom domain on GitHub Pages, via `public/CNAME`).
- **Site type:** Business/service brochure site, hybrid structure (long home page plus dedicated pages).
- **Pages:** Home, About, Services, Reviews, Pricing, plus legal pages: Privacy Policy, Terms, Accessibility Statement.
- **Home page section order:** 1 Hero, 2 Services, 3 Pricing, 4 Contact, 5 About, 6 Reviews, 7 FAQ, then a big playful footer.
- **Repo:** `oddlyperfectllc`, private. (Note: GitHub Pages from a private repo needs a paid GitHub plan. Confirm before the first deploy.)

### 2. Audience and goals
- **Visitors:** Ages 25-60. Business owners, politicians, entrepreneurs. They arrive from Facebook ads, Chamber of Commerce and referrals. Mobile and desktop usage is about equal.
- **Number one action:** Call. Click-to-call is the primary button everywhere. Email link is secondary.
- **Five-second feeling:** Fun professionalism.
- **What competitors get wrong:** Boring, walls of text, too formal, a corporate HR or law-firm feel. This site must be the opposite: short, scannable, confident, funny.
- **SEO terms to work in naturally:** Social Media Manager, Marketing Manager, Public Relations, PR, Marketing.

### 3. Voice and copy
- Claude writes all copy. Nothing is lorem ipsum, "TBD" or "Your text here".
- **Voice:** Witty. The site is the embodiment of an extroverted Type A personality with confidence through the roof. Think: organized, a little bossy in a charming way, always three steps ahead, never mean.
- Short sentences. Punchy headings in Title Case. Clever microcopy in buttons, hover states, 404, empty states, form confirmations, footer and loading text.
- Professional underneath the fun: claims stay credible, no invented client names, statistics or awards. Reviews and prices are placeholder-flagged in content until the client supplies real ones.
- Call-to-action language should be consistent in spirit ("Call Us", "Let's Talk") but varied in wit.

### 4. Navigation
- **Desktop:** Logo left, page links, visible phone number (click-to-call), social icons, light/dark toggle. Blurred-glass background. Hides on scroll down and reappears on scroll up. Active page shown with a small dot.
- **Mobile:** Slim top bar with logo, phone number and theme toggle (hides and shows the same way). **Bottom tab bar** with Home, Services, Pricing, Reviews, About, with a floating Call button docked above it. Blurred glass, safe-area aware, 44px+ touch targets.
- Skip link, visible focus rings, and correct `aria-current` on the active page.

### 5. Shared components
- **Reviews:** A wall of sticky notes with SVG star ratings (stars are never emoji). Source label per review (email, message, Yelp, Facebook, Google). Notes can be nudged or dragged on pointer devices. Keyboard-accessible and readable as a plain list for screen readers.
- **Pricing table:** Tiers plus add-ons, driven by `content/pricing.yml`. A highlighted tier. Collapses into stacked cards on mobile with no horizontal scroll.
- **Team cards:** Photo, name, title, fun fact. Lift and tilt on hover.
- **Gallery:** Masonry, click to enlarge into an accessible lightbox (focus trap, Esc, arrow keys, alt text and captions).
- **Downloads:** Services brochure PDF (a branded one-pager can be generated if the client has none).
- **Social link grid:** Large playful tiles driven by `site.yml`.
- **FAQ:** Accessible accordion.
- **Contact:** Click-to-call and email link, plus hours. No form needed (static site).
- **Footer:** Big and playful, with a huge sign-off headline, phone number, hours, socials, legal links, and a tiny easter egg.
- **Announcement bar:** Optional, controlled from `site.yml`.

### 6. Motion rules (all directions)
- Amount: lively and playful, present in every section. Personality: bouncy. Spring-like easing via CSS `linear()`.
- Always-on basics: buttons animate on hover, cards lift and tilt, text reveals line by line or word by word, custom cursor (fine pointers only), brief skippable intro animation (under 1.5 seconds, once per session), playful page transitions (Astro view transitions), sticky storytelling on at least one section.
- Text moving along paths for headers (inspired by getartcraft.com), Three.js interactivity and drag-and-drop for the hero moment.
- **Performance contract:** Must stay fast on slow phones. Target LCP under 2.5s on throttled mid-range Android over slow 4G. Initial JS under about 100 KB gzipped. Three.js, GSAP and heavy islands are lazy-loaded after first paint and only on capable devices. Everyone else gets a lightweight CSS/SVG version of the same moment.
- **`prefers-reduced-motion`:** Replaces movement with simple fades or no animation, disables the intro, custom cursor effects, tilt, parallax and Three.js, and never removes content.

### 7. Content, editing and technical
- **Editor:** Somewhat comfortable with technology. Uses **Pages CMS** (friendly web forms). Changes rarely: reviews, hours, announcements, prices, photos, services.
- **All text, photos, reviews, prices and hours live in `/content`.** Never hard-coded in markup. Zod schemas in `content.config.ts` so a typo is a clear build error.
- **Design tokens** (colors, fonts, spacing, radii, shadows, motion timing) live in one commented `src/styles/tokens.css`, light and dark sets.
- **Stack:** Astro (static) with React islands, vanilla CSS with tokens, GSAP (free) for text-on-path and reveals, Three.js (lazy) for the hero, Astro view transitions.
- **Images:** Optimized at build time (AVIF/WebP, multiple widths, explicit dimensions, lazy loading). Logo is inline SVG (client will supply files).
- **Photos:** None available yet. Use a series of clearly flagged placeholder images in varied aspect ratios (`placeholder: true` in content) that already match the final studio-and-polished direction. Real photos will be phone shots, so frames and crops must forgive imperfect photos. A CI check blocks production if any placeholder remains.
- **Deploy:** GitHub Actions to GitHub Pages. Custom domain. **Analytics:** Google Analytics (GA4) with a consent banner, documented in the Privacy page.
- **README:** Plain-English guide for a non-developer: how to edit with Pages CMS, how to swap a photo, add a review, change prices, publish, and what to do if something breaks.

### 8. Accessibility
- WCAG 2.1 AA. Contrast checked for both themes and for every sticky-note and accent color pairing. Visible focus on every interactive element. Alt text required in the schema. Semantic landmarks and heading order. Keyboard access for every interaction (including drag-and-drop alternatives). Touch targets 44px+. No information conveyed by color alone. Accessibility statement page.

### 9. Never do
- Stock photos, emoji anywhere except as sticker content (see the sticker-emoji rule below), pop-ups, auto-playing video, all-caps everywhere, non-responsive layouts, neon, pure white (#FFF), pure black (#000), dark gray on black, gradients.

### 9a. Sticker-emoji rule (the one exception to the emoji ban)
- Emoji are allowed **only as sticker artwork**: a die-cut, slightly rotated sticker with a cream outline and soft shadow whose face is an emoji (for example a coffee cup, a megaphone or a 100 badge on a "Fueled By Coffee" sticker).
- They never appear in headings, body copy, buttons, navigation, form or error messages, review text, star ratings, icons, page titles or meta descriptions, and never inline in a sentence. If it isn't visibly a sticker, it isn't allowed.
- Only where stickers already exist in the design, and sparingly: no more than 1-2 emoji stickers per viewport, and most stickers stay hand-drawn so the hand-drawn look leads.
- Render them as bundled SVG or image assets (an open-licensed set such as Noto Emoji, license noted in the README), not as system font glyphs, so they look identical on every device and don't depend on the user's OS. Emoji stickers get the same die-cut treatment as the hand-drawn ones.
- Content-driven: each sticker is defined in `/content` with a `label` (accessible text) and an `emoji` or asset reference. Decorative ones are `aria-hidden`. Meaningful ones have a text alternative, and no information is conveyed by emoji alone.
- Reduced motion, performance and contrast rules apply to emoji stickers like any other sticker.

### 10. Still needed from the client
- Logo files (SVG preferred), real photos, real reviews (with source), service list and prices, hours, phone, email, social URLs, GA4 measurement ID, brochure PDF (or approval to generate one), team bios.

---
