import { fa } from './fa';
import { SECTION_IDS, site } from './site';

/**
 * Structured data for the one page, built from the same objects the page
 * renders from.
 *
 * This exists as a build step rather than a static block in index.html for one
 * reason: schema whose text disagrees with the visible text is worse than no
 * schema at all, and a hand-maintained copy of seven FAQ answers would disagree
 * with fa.ts within a month. Nothing here is written twice.
 *
 * Imported only by src/entry-server.tsx, so it is in the SSR bundle and never
 * in the client bundle — it costs the visitor nothing.
 *
 * Verify after changing it: https://validator.schema.org
 */

const ORGANISATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;
const WEBPAGE_ID = `${site.url}/#webpage`;

/**
 * `</script>` inside a JSON string would close the tag the JSON is sitting in.
 * Escaping every `<` is the blunt fix and it stays valid JSON, which is why it
 * is preferred here over matching the sequence.
 */
const escapeForScriptTag = (json: string) => json.replace(/</g, '\\u003c');

/**
 * Every profile we can prove is us, in the one property Google reads for it.
 *
 * `sameAs` is how a name becomes an entity. Until these exist, «بیزینکس» is a
 * string that happens to appear on a page; once three independent profiles
 * point back at the same site, it is a company Google can hold an opinion
 * about. The Business Profile is listed first because it is the entry that
 * does local ranking work rather than only disambiguation.
 *
 * Empty by design until src/content/site.ts is filled in. An empty array is
 * dropped below rather than emitted, because `"sameAs": []` is a claim to have
 * checked and found nothing.
 */
const sameAs = [site.googleBusinessProfile, ...site.socialProfiles].filter(
  (url): url is string => typeof url === 'string' && url.length > 0,
);

/**
 * Drops keys whose value is null, undefined, or an empty array.
 *
 * The alternative is a chain of spreads at every optional property, which is
 * the kind of line that is correct and unreadable at the same time. This exists
 * so that a field nobody has filled in yet simply is not in the output —
 * structured data that asserts a blank is structured data that asserts a lie.
 */
const withoutBlanks = <T extends Record<string, unknown>>(object: T) =>
  Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== null && value !== undefined && !(Array.isArray(value) && !value.length),
    ),
  );

const graph = [
  withoutBlanks({
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORGANISATION_ID,
    name: fa.ui.brandName,
    alternateName: 'Bizynex',
    url: `${site.url}/`,
    email: site.email,
    telephone: site.phone,
    description: fa.hero.subtitle,
    slogan: fa.hero.title,
    foundingDate: site.foundingYear,
    sameAs,
    /* Google's own documentation asks for a logo it can measure, so the
       dimensions are stated rather than left to be discovered. */
    logo: {
      '@type': 'ImageObject',
      url: `${site.url}/brand/bizynex-stacked.png`,
      width: 384,
      height: 331,
      caption: fa.ui.brandName,
    },
    /* The share card, not the logo. This is the image a rich result is most
       likely to actually show, and it is the one sized for it. */
    image: {
      '@type': 'ImageObject',
      url: `${site.url}/brand/og-cover.png`,
      width: 1200,
      height: 630,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: site.countryCode,
    },
    areaServed: [
      { '@type': 'City', name: site.city },
      { '@type': 'Country', name: 'ایران' },
    ],
    knowsLanguage: ['fa-IR', 'en'],
    /* No `priceRange`. The page publishes no prices, so claiming a band in the
       markup would be telling a crawler something we do not tell a reader. */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: fa.services.title,
      /* Each service gets a stable `@id` so the WebPage below can point at the
         same four things rather than describing them a second time. One node,
         many references, is what @graph is for. */
      itemListElement: fa.services.items.map((item, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          '@id': `${site.url}/#service-${index + 1}`,
          name: item.deliverable,
          description: item.body,
          serviceType: item.title,
          areaServed: { '@type': 'City', name: site.city },
          provider: { '@id': ORGANISATION_ID },
        },
      })),
    },
    contactPoint: withoutBlanks({
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: site.email,
      telephone: site.phone,
      availableLanguage: ['fa', 'en'],
      areaServed: site.countryCode,
    }),
    /* Three founders, stated plainly. CONTEXT.md §7 turns the smallest thing
       about us into the reason to choose us, and the FAQ already says it out
       loud — so the markup should not be vaguer than the page. */
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 3,
    },
  }),

  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${site.url}/`,
    name: fa.ui.brandName,
    alternateName: 'Bizynex',
    description: fa.hero.subtitle,
    inLanguage: 'fa-IR',
    publisher: { '@id': ORGANISATION_ID },
  },

  {
    /* The page is both. Typing it as an FAQPage is what lets the questions
       below be understood as questions rather than as body copy. */
    '@type': ['WebPage', 'FAQPage'],
    '@id': WEBPAGE_ID,
    url: `${site.url}/`,
    name: fa.hero.title,
    description: fa.hero.subtitle,
    inLanguage: 'fa-IR',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANISATION_ID },
    /* Names the image a result should reach for, instead of leaving it to pick
       whichever asset it happened to find first. */
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${site.url}/brand/og-cover.png`,
      width: 1200,
      height: 630,
    },
    /*
      The sections, as a crawler's table of contents.

      Every one of them is a real element with a real id on the page, so these
      are not a claim about structure — they are the structure, restated in the
      one form a crawler reads without inference. It is also what makes the
      anchors eligible to be offered as jump links under the result.
    */
    hasPart: Object.entries(SECTION_IDS).map(([key, id]) => ({
      '@type': 'WebPageElement',
      '@id': `${site.url}/#${id}`,
      name: fa[key as keyof typeof SECTION_IDS].title,
      url: `${site.url}/#${id}`,
    })),
    mainEntity: fa.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      /* Anchors the answer to where it actually is on the page. */
      url: `${site.url}/#${SECTION_IDS.faq}`,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
];

/** The full `<script type="application/ld+json">` element, ready to paste. */
export const jsonLdScript = `<script type="application/ld+json">${escapeForScriptTag(
  JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
)}</script>`;
