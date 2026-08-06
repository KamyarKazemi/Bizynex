/**
 * Non-copy site data: identifiers, links, and the nav-to-section map.
 * Kept apart from fa.ts so that translatable copy and hard facts never mix.
 */

/**
 * The hero's anchor. It lives here rather than in Hero.tsx because the header
 * needs it too, and importing it from the section would drag the three.js chunk
 * into the header's module graph — which is the one thing that must never
 * happen to the first thing on the page.
 */
export const HERO_ID = 'top';

export const SECTION_IDS = {
  problem: 'problem',
  services: 'services',
  process: 'process',
  why: 'why',
  faq: 'faq',
  contact: 'contact',
} as const;

/**
 * The drawing-callout numbering beside each section title. Persian numerals, to
 * match the numerals in the process steps — the page never mixes numeral sets.
 */
export const SECTION_INDEX = {
  problem: '۰۱',
  services: '۰۲',
  process: '۰۳',
  why: '۰۴',
  faq: '۰۵',
  contact: '۰۶',
} as const;

export const site = {
  /**
   * Canonical origin. No trailing slash — every URL built from it adds its own.
   * Used by the sitemap, the JSON-LD @id, and the og:url in index.html; if this
   * changes, public/sitemap.xml and index.html change with it.
   */
  url: 'https://bizynex.ir',

  email: 'info@bizynex.ir',

  /**
   * Where we are. Not decoration: this is the single strongest ranking signal
   * available to a services business, and it is carried in the copy, in the
   * JSON-LD, and in the geo meta tags in index.html.
   */
  city: 'شیراز',
  cityEn: 'Shiraz',
  region: 'استان فارس',
  countryCode: 'IR',

  /** Gregorian. Switch to the Jalali year if that is the house convention. */
  year: '۲۰۲۶',

  /**
   * The Telegram bot, once it exists. Null until then, and the contact section
   * renders nothing for it — a dead link to a bot that does not answer costs
   * more trust than a missing channel does.
   */
  telegram: null as string | null,
} as const;

export const mailtoHref = `mailto:${site.email}`;

/**
 * Three nav items for seven sections — the nav is a shortcut, not a table of
 * contents.
 */
export const NAV_LINKS = [
  { key: 'services', href: `#${SECTION_IDS.services}` },
  { key: 'process', href: `#${SECTION_IDS.process}` },
  { key: 'contact', href: `#${SECTION_IDS.contact}` },
] as const;
