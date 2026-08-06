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

const graph = [
  {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORGANISATION_ID,
    name: fa.ui.brandName,
    alternateName: 'Bizynex',
    url: `${site.url}/`,
    email: site.email,
    description: fa.hero.subtitle,
    slogan: fa.hero.title,
    logo: {
      '@type': 'ImageObject',
      url: `${site.url}/brand/bizynex-stacked.png`,
    },
    image: `${site.url}/brand/bizynex-stacked.png`,
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
      itemListElement: fa.services.items.map((item) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: item.deliverable,
          description: item.body,
          serviceType: item.title,
          areaServed: { '@type': 'City', name: site.city },
          provider: { '@id': ORGANISATION_ID },
        },
      })),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: site.email,
      availableLanguage: ['fa', 'en'],
      areaServed: site.countryCode,
    },
  },

  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${site.url}/`,
    name: fa.ui.brandName,
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
