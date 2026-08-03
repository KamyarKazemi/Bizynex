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
  contact: '۰۵',
} as const;

export const site = {
  email: 'kamiyarkazemii@gmail.com',
  /** Gregorian. Switch to the Jalali year if that is the house convention. */
  year: '۲۰۲۶',
} as const;

export const mailtoHref = `mailto:${site.email}`;

/**
 * Three nav items for six sections — the nav is a shortcut, not a table of
 * contents.
 */
export const NAV_LINKS = [
  { key: 'services', href: `#${SECTION_IDS.services}` },
  { key: 'process', href: `#${SECTION_IDS.process}` },
  { key: 'contact', href: `#${SECTION_IDS.contact}` },
] as const;
