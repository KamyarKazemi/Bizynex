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
 * The Telegram handle is in here because it is the one profile that actually
 * exists today. It was being used for the contact button and nowhere else,
 * which meant the single provable identity this company has was missing from
 * the one property that reads it.
 *
 * Still thin until the rest of src/content/site.ts is filled in. Whatever is
 * unset drops out rather than being emitted, because `"sameAs": []` is a claim
 * to have checked and found nothing.
 */
const sameAs = [site.googleBusinessProfile, site.telegram, ...site.socialProfiles].filter(
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
          name: item.title,
          description: item.body,
          areaServed: { '@type': 'City', name: site.city },
          provider: { '@id': ORGANISATION_ID },
        },
      })),
    },
    /* Two ways in, and the order is the order the page offers them. The bot is
       the primary intake — «هزینه و زمان» is written around it and تماس renders
       it as the single action — so it is listed first. Email is the quiet
       alternative underneath, and it is a real address rather than a form.

       Both are ContactPoints rather than one with two fields, because they are
       answered differently: the bot qualifies and estimates, a person reads the
       email. `url` is the right property for a chat handle; there is no
       schema.org property for "Telegram" specifically, and inventing one would
       be worse than describing it plainly. */
    contactPoint: [
      withoutBlanks({
        '@type': 'ContactPoint',
        contactType: 'sales',
        url: site.telegram,
        availableLanguage: ['fa'],
        areaServed: site.countryCode,
      }),
      withoutBlanks({
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: site.email,
        telephone: site.phone,
        availableLanguage: ['fa', 'en'],
        areaServed: site.countryCode,
      }),
    ].filter((point) => Object.keys(point).length > 2),
    /* No `numberOfEmployees`, and no `founder`. The site states no headcount
       anywhere, by decision — and structured data is not a back door for a fact
       we chose not to put on the page. It is read by more parties than the page
       is, not fewer. */
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
    mainEntity: [
      ...fa.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        /* Anchors the answer to where it actually is on the page. */
        url: `${site.url}/#${SECTION_IDS.faq}`,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),

      /* The two questions the FAQ section no longer asks out loud.
       *
       * Moving price and timeline into «هزینه و زمان» was right for a reader —
       * they are not really questions, they are the two things everyone wants
       * to know, and burying them at FAQ position five was hiding them. But
       * FAQPage markup is what makes an answer eligible to be shown *as* an
       * answer in search, and «هزینهٔ طراحی سایت در شیراز چقدر است؟» is the
       * highest-intent local query this business can answer. Dropping the
       * markup meant the answers stayed on the page while the page stopped
       * saying they were answers.
       *
       * So the pairing lives here and only here: the section renders prose,
       * the graph declares it as Q&A. Nothing new is claimed — every answer
       * string below is rendered verbatim in the pricing section, which is
       * what keeps this honest markup rather than a keyword play.
       *
       * `url` points at the pricing section, not the FAQ, because that is
       * where a visitor arriving on this answer should land. */
      {
        '@type': 'Question',
        name: fa.pricing.schemaOnlyQuestions.cost,
        url: `${site.url}/#${SECTION_IDS.pricing}`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${fa.pricing.money} ${fa.pricing.drivers}`,
        },
      },
      {
        '@type': 'Question',
        name: fa.pricing.schemaOnlyQuestions.time,
        url: `${site.url}/#${SECTION_IDS.pricing}`,
        acceptedAnswer: { '@type': 'Answer', text: fa.pricing.time },
      },
    ],
  },
];

/* No stripping pass here, and none is needed: `fa.ts` holds sentences and no
   notation at all. The emphasis phrases live in `src/content/emphasis.ts` and
   point *into* the copy, so the forty-odd strings this graph pulls out of fa.ts
   are the same strings a reader sees. The alternative — delimiters inside the
   copy, removed again on the way out — puts a literal `[[` in front of a search
   engine the first time one consumer is forgotten. See the note at the top of
   src/content/emphasis.ts. */
const wrap = (nodes: unknown[]) =>
  `<script type="application/ld+json">${escapeForScriptTag(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }),
  )}</script>`;

/** The full `<script type="application/ld+json">` element, ready to paste. */
export const jsonLdScript = wrap(graph);

/**
 * The graph for a service page.
 *
 * Organization and WebSite are emitted again rather than linked to from afar,
 * because a crawler reads one page at a time and a bare `@id` pointing at a
 * node it has not fetched resolves to nothing. They are byte-identical to the
 * home copies and carry the same `@id`, which is exactly how a crawler knows
 * the two pages are describing one company rather than two.
 *
 * The page's own nodes are new: a `WebPage` for itself, a `Service` for what it
 * sells, and a breadcrumb.
 *
 * ## The breadcrumb reverses an earlier decision, deliberately
 *
 * A previous audit rejected `BreadcrumbList` on the grounds that "a breadcrumb
 * of length one is noise", and that was correct — the site was one page, and a
 * trail from home to home says nothing. That reasoning expired the moment real
 * sub-pages existed: the trail is now home → this page, which is the two-level
 * hierarchy Google renders in place of a bare URL. Recorded here so nobody
 * re-litigates it from the old note.
 *
 * It is the *only* breadcrumb now. The visible trail at the top of the page was
 * removed — the header, the footer and the URL each already say where you are,
 * and it was crowding the one place on the page that should open on the
 * heading. This node stays because it is not a duplicate of anything a visitor
 * reads: it is what a crawler prints above a result in place of a bare URL, and
 * it describes a hierarchy the site genuinely has. Nothing here can disagree
 * with the page, because the page no longer states it twice.
 */
export const jsonLdScriptForPage = (page: {
  key: string;
  url: string;
  name: string;
  description: string;
}) => {
  const pageId = `${page.url}#webpage`;

  return wrap([
    ...graph.filter((node) => {
      const type = ([] as string[]).concat(node['@type'] as string | string[]);
      /* Home's WebPage/FAQPage describes home. Everything else — the company
         and the site — is true on every page. */
      return !type.includes('WebPage');
    }),

    {
      '@type': 'WebPage',
      '@id': pageId,
      url: page.url,
      name: page.name,
      description: page.description,
      inLanguage: 'fa-IR',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORGANISATION_ID },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${site.url}/brand/og-cover.png`,
        width: 1200,
        height: 630,
      },
      breadcrumb: { '@id': `${page.url}#breadcrumb` },
    },

    {
      '@type': 'Service',
      '@id': `${page.url}#service`,
      name: page.name,
      description: page.description,
      serviceType: page.name,
      provider: { '@id': ORGANISATION_ID },
      areaServed: { '@type': 'City', name: site.city },
      inLanguage: 'fa-IR',
      url: page.url,
    },

    {
      '@type': 'BreadcrumbList',
      '@id': `${page.url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: fa.hero.title, item: `${site.url}/` },
        /* No `item` on the last crumb. Google's own guidance is that the
           current page is the end of the trail and does not link to itself. */
        { '@type': 'ListItem', position: 2, name: page.name },
      ],
    },
  ]);
};
