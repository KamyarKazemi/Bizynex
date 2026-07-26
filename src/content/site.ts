/**
 * Non-copy site data: identifiers, links, and the nav-to-section map.
 * Kept apart from fa.ts so that translatable copy and hard facts never mix.
 */

export const SECTION_IDS = {
  problem: 'problem',
  services: 'services',
  process: 'process',
  why: 'why',
  team: 'team',
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
  team: '۰۵',
  contact: '۰۶',
} as const;

export const site = {
  email: 'kamiyarkazemii@gmail.com',
  /** Gregorian. Switch to the Jalali year if that is the house convention. */
  year: '۲۰۲۶',
} as const;

export const mailtoHref = `mailto:${site.email}`;

/**
 * Four nav items for seven sections — the nav is a shortcut, not a table of
 * contents. "درباره ما" points at the team section: it is literally who "ما"
 * is, and it sits directly after "چرا بیزینکس", so a visitor who wanted the
 * commitments has just scrolled past them.
 */
export const NAV_LINKS = [
  { key: 'services', href: `#${SECTION_IDS.services}` },
  { key: 'process', href: `#${SECTION_IDS.process}` },
  { key: 'about', href: `#${SECTION_IDS.team}` },
  { key: 'contact', href: `#${SECTION_IDS.contact}` },
] as const;
