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
   * ⚠ FILL THIS IN BEFORE LAUNCH.
   *
   * In E.164, because that is the only format every consumer of it agrees on:
   * `+989xxxxxxxxx`. Null until it is real — a number in the structured data
   * that rings nowhere is worse than no number, and Google will surface it.
   *
   * When it is set, it appears in three places at once: the ContactPoint in the
   * structured data, and — because a phone number is a conversion device before
   * it is an SEO one — a visible `tel:` link in the contact section. Add the
   * label to fa.ui when you do.
   */
  phone: null as string | null,

  /**
   * ⚠ FILL THESE IN BEFORE LAUNCH.
   *
   * Profile URLs, one per line, full https URLs and nothing else. This becomes
   * `sameAs` in the structured data, and it is the single strongest signal
   * available for saying "the بیزینکس on this page and the بیزینکس on that
   * Instagram are one company" — which is what has to be true before Google
   * will treat us as an entity rather than as a string.
   *
   * Order does not matter. Only add profiles that are actually maintained: a
   * linked account with four posts from last year argues against us.
   *
   * Examples of what belongs here:
   *   'https://www.instagram.com/bizynex'
   *   'https://www.linkedin.com/company/bizynex'
   *   'https://github.com/bizynex'
   *   'https://t.me/bizynex'
   */
  socialProfiles: [] as string[],

  /**
   * The Google Business Profile URL, once the profile is verified. Also goes
   * into `sameAs`, and it is the one entry there that does local ranking work
   * rather than only entity work.
   */
  googleBusinessProfile: null as string | null,

  /** When the three of us started. Used for `foundingDate`. ISO, year is enough. */
  foundingYear: '2026',

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
