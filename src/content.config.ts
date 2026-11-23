/**
 * Content schemas. Every word, photo, price, review and hour on the site
 * lives in /content and is validated here. A typo in a content file becomes
 * a clear build error (with the file and field name) instead of a broken page.
 *
 * Editors never touch this file: Pages CMS (.pages.yml) mirrors these rules
 * as friendly forms.
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

/** Any visible text. Blocks emoji: emoji are only allowed as sticker art. */
// (c), (r) and TM are technically pictographic but fine in text.
const EMOJI = /(?![\u00A9\u00AE\u2122])[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
const text = (min = 1) =>
  z
    .string()
    .trim()
    .min(min)
    .refine((s) => !EMOJI.test(s), {
      message: 'Emoji are only allowed as sticker artwork (content/stickers.yml), not in text.',
    });
const optText = () => text().optional();
/** Optional text that may also be left blank in the CMS. */
const maybeText = () =>
  z.string().trim().refine((v) => !EMOJI.test(v), { message: 'Emoji are only allowed as sticker artwork.' }).optional();

/** A photo. Alt text is required; placeholder flags it for the CI check. */
const photo = ({ image }: SchemaContext) =>
  z.object({
    src: image(),
    alt: text(8).describe('Describe the photo for people using screen readers.'),
    placeholder: z.boolean().default(false),
  });

const href = z
  .string()
  .trim()
  .refine((s) => /^(https?:\/\/|\/|#|mailto:|tel:)/.test(s), {
    message: 'Links must start with https://, /, #, mailto: or tel:',
  });

/** Hand-drawn sticker art available in the SVG sprite (src/components/StickerSprite.astro). */
export const DRAWN_ART = [
  'star', 'sparkle', 'squiggle', 'arrow', 'arrow-curl', 'bubble', 'bolt', 'heart', 'swoosh',
  'megaphone', 'phone', 'calendar', 'chart', 'pen', 'camera', 'handshake', 'laptop',
  'clipboard', 'target', 'crown', 'badge', 'flag', 'mic', 'thumbs', 'check', 'clock',
] as const;

/** Icons used for services (subset of the drawn art that reads well as an icon). */
const SERVICE_ICON = z.enum([
  'megaphone', 'phone', 'calendar', 'chart', 'pen', 'camera', 'handshake', 'laptop',
  'clipboard', 'target', 'crown', 'mic', 'bubble', 'bolt', 'star', 'flag',
]);

const PASTEL = z.enum(['mint', 'blush', 'mustard', 'peri', 'tangerine', 'cream']);

const SOCIAL = z.enum(['facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube', 'threads', 'google']);

/** Reference to a sticker id defined in content/stickers.yml */
const stickerRef = z.string().regex(/^[a-z0-9-]+$/, 'Sticker ids are lowercase words joined by dashes.');

const cta = z.object({
  label: text(),
  hoverLabel: optText().describe('Optional cheeky text shown on hover.'),
});

/* ------------------------------------------------------------------ */
/* Site-wide settings: content/site.yml                                */
/* ------------------------------------------------------------------ */
const site = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './content' }),
  schema: z.object({
    name: text(),
    shortName: text(),
    legalName: text(),
    tagline: text(),
    description: text(50).max(170, 'Search engines cut descriptions off around 160 characters.'),
    url: z.url(),
    phone: z.object({
      display: text(),
      tel: z.string().regex(/^\+?[0-9]{7,15}$/, 'Digits only, with the country code, e.g. +15551234567'),
      placeholder: z.boolean().default(false),
    }),
    email: z.object({
      address: z.email(),
      placeholder: z.boolean().default(false),
    }),
    hours: z.object({
      rows: z.array(z.object({ days: text(), time: text() })).min(1),
      note: optText(),
      placeholder: z.boolean().default(false),
    }),
    serviceArea: optText(),
    socials: z
      .array(
        z.object({
          platform: SOCIAL,
          label: text(),
          handle: optText(),
          url: z.url(),
          placeholder: z.boolean().default(false),
        }),
      )
      .default([]),
    announcement: z.object({
      enabled: z.boolean().default(false),
      text: text(),
      link: z.object({ label: text(), href }).optional(),
    }),
    analytics: z.object({
      ga4Id: z
        .string()
        .regex(/^(G-[A-Z0-9]{4,12})?$/, 'GA4 IDs look like G-ABC123XYZ. Leave blank to turn analytics off.')
        .default(''),
      consent: z.object({
        message: text(),
        accept: text(),
        decline: text(),
        moreLabel: text(),
      }),
    }),
    nav: z.object({
      links: z
        .array(
          z.object({
            label: text(),
            href,
            tab: z.boolean().default(true).describe('Show in the mobile bottom tab bar'),
            icon: z.enum(['home', 'services', 'pricing', 'reviews', 'about']),
            color: PASTEL,
          }),
        )
        .min(2),
      callLabel: text(),
      callShort: text(),
      emailLabel: text(),
      themeToLight: text(),
      themeToDark: text(),
      skipLink: text(),
      homeLabel: text(),
    }),
    footer: z.object({
      signoff: text(),
      signoffSub: text(),
      callLabel: text(),
      hoursHeading: text(),
      socialHeading: text(),
      legalHeading: text(),
      smallprint: text(),
      easterEgg: z.object({ trigger: text(), reveal: text() }),
      backToTop: text(),
    }),
    legalLinks: z.array(z.object({ label: text(), href })).min(1),
    notFound: z.object({
      title: text(),
      heading: text(),
      body: text(),
      cta: text(),
    }),
    a11y: z.object({
      mainNav: text(),
      tabNav: text(),
      announcement: text(),
      newTab: text(),
      stickerPile: text(),
    }),
    ui: z.object({
      ratingLabel: text().refine((s) => s.includes('{rating}'), 'Must contain {rating}'),
      reviewSources: z.object({ email: text(), message: text(), yelp: text(), facebook: text(), google: text() }),
      lightboxClose: text(),
      lightboxNext: text(),
      lightboxPrev: text(),
      lightboxOpen: text(),
      tocLabel: text(),
      updatedLabel: text(),
      callBandLabel: text(),
      moveHelp: text(),
      reset: text(),
    }),
    loadingText: text(),
    intro: z.object({ enabled: z.boolean().default(true), skipLabel: text(), caption: text() }),
    brochure: z
      .object({
        label: text(),
        blurb: optText(),
        file: z.string().regex(/^\/downloads\/.+\.pdf$/, 'Upload the PDF to public/downloads/ and use /downloads/name.pdf'),
        placeholder: z.boolean().default(false),
      })
      .optional(),
    logo: z.object({
      text: text().describe('Wordmark text used until the real logo file arrives'),
      placeholder: z.boolean().default(false),
    }),
  }),
});

/* ------------------------------------------------------------------ */
/* Stickers: content/stickers.yml                                      */
/* ------------------------------------------------------------------ */
const stickers = defineCollection({
  loader: glob({ pattern: 'stickers.yml', base: './content' }),
  schema: z.object({
    stickers: z
      .array(
        z.discriminatedUnion('kind', [
          z.object({
            kind: z.literal('drawn'),
            id: stickerRef,
            label: text().describe('What the sticker says or shows, for screen readers'),
            art: z.enum(DRAWN_ART),
            caption: optText().describe('Short handwritten text on the sticker'),
            color: PASTEL.default('mustard'),
            rotate: z.number().min(-25).max(25).default(-6),
            decorative: z.boolean().default(true),
          }),
          z.object({
            kind: z.literal('label'),
            id: stickerRef,
            label: text(),
            caption: text().max(28, 'Label stickers stay short: 28 characters max.'),
            color: PASTEL.default('cream'),
            rotate: z.number().min(-25).max(25).default(-4),
            decorative: z.boolean().default(true),
          }),
          z.object({
            kind: z.literal('emoji'),
            id: stickerRef,
            label: text(),
            /** File name in public/stickers/emoji (bundled Noto Emoji SVG, Apache 2.0). */
            emoji: z.string().regex(/^[a-z0-9_-]+\.svg$/, 'Use the file name of an SVG in public/stickers/emoji'),
            caption: optText(),
            rotate: z.number().min(-25).max(25).default(5),
            decorative: z.boolean().default(true),
          }),
        ]),
      )
      .min(1),
  }),
});

/* ------------------------------------------------------------------ */
/* Home page copy: content/home.yml                                    */
/* ------------------------------------------------------------------ */
const sectionCopy = z.object({
  eyebrow: optText(),
  heading: text(),
  intro: optText(),
  cta: cta.optional(),
  stickers: z.array(stickerRef).max(3, 'Max 3 stickers per section keeps it loud, not cluttered.').default([]),
});

const home = defineCollection({
  loader: glob({ pattern: 'home.yml', base: './content' }),
  schema: z.object({
    seo: z.object({ title: text(), description: text(50).max(170) }),
    hero: z.object({
      eyebrow: text(),
      headline: text(),
      headlineAccent: text().describe('The words in the headline that get the hand-drawn underline'),
      sub: text(),
      callLabel: text(),
      emailLabel: text(),
      dragHint: text(),
      stickers: z.array(stickerRef).min(3).max(9),
    }),
    services: sectionCopy.extend({ detailsLabel: text() }),
    pricing: sectionCopy,
    contact: sectionCopy.extend({
      callHeading: text(),
      emailHeading: text(),
      hoursHeading: text(),
      afterHours: text(),
      emailBody: text(),
      brochureHeading: text(),
    }),
    about: sectionCopy.extend({ body: z.array(text()).min(1).max(4) }),
    process: sectionCopy,
    reviews: sectionCopy.extend({ dragHint: text(), listToggle: text(), wallToggle: text() }),
    faq: sectionCopy,
  }),
});

/* ------------------------------------------------------------------ */
/* Services: content/services/*.md                                     */
/* ------------------------------------------------------------------ */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/services' }),
  schema: z.object({
    title: text(),
    order: z.number().int().default(10),
    icon: SERVICE_ICON,
    color: PASTEL,
    summary: text(20).max(160, 'Keep the card summary short: 160 characters max.'),
    highlights: z.array(text()).min(2).max(5),
    sticker: stickerRef.optional(),
    keywords: z.array(z.string()).default([]).describe('SEO phrases, used for the page meta only'),
    placeholder: z.boolean().default(false).describe('True until the client confirms this service'),
  }),
});

/* ------------------------------------------------------------------ */
/* Pricing: content/pricing.yml (every price on the site lives here)    */
/* ------------------------------------------------------------------ */
const pricing = defineCollection({
  loader: glob({ pattern: 'pricing.yml', base: './content' }),
  schema: z
    .object({
      seo: z.object({ title: text(), description: text(50).max(170) }),
      eyebrow: text(),
      heading: text(),
      intro: text(),
      stickers: z.array(stickerRef).max(3).default([]),
      currency: z.string().default('USD'),
      priceLabels: z.object({ flex: text(), monthly: text(), or: text() }),
      includesLabel: text(),
      bestForLabel: text(),
      exampleLabel: text(),
      moreLabel: text().refine((v) => v.includes('{n}'), 'Must contain {n} (the number of extra items)'),
      tiers: z
        .array(
          z.object({
            name: text(),
            tab: text().max(18).describe('Short label on the folder tab'),
            price: text().describe('Main (12-Month Flex) price as shown, e.g. "$1,500"'),
            altPrice: maybeText().describe('Month-to-month price, e.g. "$1,750"'),
            cadence: text().describe('e.g. "per month"'),
            pitch: text(),
            bestFor: text(),
            features: z.array(text()).min(2).max(20),
            example: maybeText(),
            notes: z.array(text()).default([]),
            featured: z.boolean().default(false),
            sticker: stickerRef.optional(),
            color: PASTEL,
            cta: text(),
            placeholder: z.boolean().default(false),
          }),
        )
        .min(1)
        .max(4),
      compare: z.object({
        button: text(),
        heading: text(),
        intro: optText(),
        close: text(),
        featureLabel: text(),
        yesLabel: text(),
        noLabel: text(),
        rows: z.array(z.object({ label: text(), values: z.array(text()).min(1).max(4) })).min(1),
      }),
      extrasHeading: text(),
      extras: z.array(z.object({ name: text(), price: text(), note: optText(), href })).default([]),
      projectsHeading: text(),
      projectsIntro: text(),
      whenLabel: text(),
      projects: z
        .array(z.object({ name: text(), price: text(), when: text(), details: text(), icon: z.enum(DRAWN_ART), placeholder: z.boolean().default(false) }))
        .default([]),
      eventsHeading: text(),
      eventsIntro: text(),
      events: z
        .array(z.object({ name: text(), price: text(), tagline: text(), includes: z.array(text()).min(1), icon: z.enum(DRAWN_ART), placeholder: z.boolean().default(false) }))
        .default([]),
      eventBoundariesHeading: text(),
      eventBoundaries: z.array(text()).default([]),
      sponsorshipNote: z.object({ heading: text(), body: text() }).optional(),
      matcher: z.object({
        heading: text(),
        intro: optText(),
        rows: z.array(z.object({ says: text(), pointTo: text(), href })).min(1),
      }),
      addonsHeading: text(),
      addons: z
        .array(z.object({ name: text(), price: text(), note: optText(), placeholder: z.boolean().default(false) }))
        .default([]),
      footnote: optText(),
      faqHeading: text(),
      faq: z.array(z.object({ question: text(), answer: text() })).default([]),
      cta: z.object({ heading: text(), body: text(), label: text() }),
    })
    .refine((p) => p.tiers.filter((t) => t.featured).length <= 1, {
      message: 'Only one pricing tier can be featured.',
      path: ['tiers'],
    }),
});

/* ------------------------------------------------------------------ */
/* Policies: content/policies.yml (shown on the Pricing page)           */
/* ------------------------------------------------------------------ */
const feeTable = z.object({
  heading: text(),
  summary: optText(),
  intro: optText(),
  whenLabel: text(),
  feeLabel: text(),
  rows: z.array(z.object({ when: text(), fee: text() })).min(1),
  note: optText(),
});
const policies = defineCollection({
  loader: glob({ pattern: 'policies.yml', base: './content' }),
  schema: z.object({
    heading: text(),
    intro: text(),
    twoWays: z.object({
      heading: text(),
      intro: optText(),
      flex: z.object({ title: text(), badge: optText(), points: z.array(text()).min(1) }),
      monthly: z.object({ title: text(), badge: optText(), points: z.array(text()).min(1) }),
    }),
    factsHeading: text(),
    flex: z.object({
      heading: text(),
      summary: optText(),
      tagline: text(),
      rulesHeading: text(),
      rules: z.array(text()).min(1),
      benefitsHeading: text(),
      benefits: z.array(text()).min(1),
    }),
    community: z.object({ heading: text(), summary: optText(), tagline: text(), badge: text().max(6), body: text(), points: z.array(text()).default([]) }),
    noSurprises: z.object({ heading: text(), summary: optText(), body: text() }),
    notIncluded: z.object({ heading: text(), summary: optText(), intro: optText(), items: z.array(text()).min(1) }),
    rush: feeTable,
    eventRush: feeTable,
    delays: z.object({ heading: text(), summary: optText(), body: text(), options: z.array(text()).min(1) }),
    travel: z.object({ heading: text(), summary: optText(), local: text(), outside: text(), expenses: text() }),
    noKickbacks: z.object({ heading: text(), body: text(), items: z.array(text()).min(1), kicker: text() }),
    relationships: z.object({ heading: text(), summary: optText(), body: text() }),
    revisions: z.object({ heading: text(), summary: optText(), body: text() }),
    payments: z.object({
      heading: text(),
      summary: optText(),
      intro: optText(),
      monthly: z.array(text()).min(1),
      projectsHeading: text(),
      projectLabel: text(),
      scheduleLabel: text(),
      projects: z.array(z.object({ project: text(), schedule: text() })).default([]),
      placeholder: z.boolean().default(false).describe('True until reviewed by an Alaska attorney/accountant'),
    }),
  }),
});

/* ------------------------------------------------------------------ */
/* Reviews: content/reviews/*.yml                                      */
/* ------------------------------------------------------------------ */
const reviews = defineCollection({
  loader: glob({ pattern: '*.yml', base: './content/reviews' }),
  schema: z.object({
    quote: text(10).max(420, 'Sticky notes are small. Keep reviews under 420 characters.'),
    name: text(),
    role: optText().describe('e.g. "Owner, a local bakery". Never invent a business name.'),
    source: z.enum(['email', 'message', 'yelp', 'facebook', 'google']),
    rating: z.number().int().min(1).max(5),
    date: z.coerce.date().optional(),
    link: z.url().optional(),
    featured: z.boolean().default(false).describe('Show on the home page'),
    order: z.number().int().default(10),
    placeholder: z.boolean().default(false),
  }),
});

/* ------------------------------------------------------------------ */
/* FAQ + "How we work" story                                            */
/* ------------------------------------------------------------------ */
const faq = defineCollection({
  loader: glob({ pattern: 'faq.yml', base: './content' }),
  schema: z.object({
    items: z.array(z.object({ question: text(), answer: text(), home: z.boolean().default(true) })).min(1),
  }),
});

const howWeWork = defineCollection({
  loader: glob({ pattern: 'process.yml', base: './content' }),
  schema: z.object({
    steps: z
      .array(z.object({ title: text(), body: text(), sticker: stickerRef.optional(), color: PASTEL }))
      .min(3)
      .max(6),
  }),
});

/* ------------------------------------------------------------------ */
/* Team + gallery (photos)                                             */
/* ------------------------------------------------------------------ */
const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/team' }),
  schema: (ctx) =>
    z.object({
      name: text(),
      title: text(),
      funFact: text(),
      photo: photo(ctx),
      order: z.number().int().default(10),
      sticker: stickerRef.optional(),
      placeholder: z.boolean().default(false).describe('True until real name/bio are supplied'),
    }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '*.yml', base: './content/gallery' }),
  schema: (ctx) =>
    z.object({
      photo: photo(ctx),
      caption: text(),
      order: z.number().int().default(10),
    }),
});

/* ------------------------------------------------------------------ */
/* Standalone pages: about, services, reviews, privacy, terms, a11y     */
/* ------------------------------------------------------------------ */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/pages' }),
  schema: z.object({
    title: text().describe('Browser tab title'),
    description: text(50).max(170),
    eyebrow: optText(),
    heading: text(),
    intro: optText(),
    color: PASTEL.default('cream'),
    updated: z.coerce.date().optional(),
    stickers: z.array(stickerRef).max(3).default([]),
    sections: z
      .array(z.object({ heading: text(), body: text(), sticker: stickerRef.optional() }))
      .default([]),
    // Optional labels used by specific page layouts
    jumpLabel: optText(),
    jump: z.array(z.object({ label: text(), href })).default([]),
    monthlyHeading: optText(),
    monthlyIntro: optText(),
    teamHeading: optText(),
    teamIntro: optText(),
    galleryHeading: optText(),
    galleryIntro: optText(),
    filterLabel: optText(),
    allLabel: optText(),
    cta: z.object({ heading: text(), body: text(), label: text() }).optional(),
  }),
});

export const collections = { site, stickers, home, services, pricing, policies, reviews, faq, process: howWeWork, team, gallery, pages };
