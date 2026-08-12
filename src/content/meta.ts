import { fa, plain } from './fa';
import type { Route } from './routes';
import { site } from './site';

/**
 * What a page claims about itself: its `<title>`, its description, and the one
 * URL it declares as its own.
 *
 * This exists so that those three answers are computed once. Three consumers
 * need them and they must agree exactly:
 *
 *   scripts/prerender.mjs   the head tags it rewrites per page
 *   scripts/prerender.mjs   the `<loc>` it writes into sitemap.xml
 *   src/content/jsonLd.ts   the `url` and `@id` of the page's nodes
 *
 * A canonical that disagrees with the sitemap is the most common way a
 * multi-page site quietly loses pages — the crawler is told twice where the
 * page lives and believes neither. Deriving all of them from `canonicalFor`
 * makes disagreement impossible rather than unlikely.
 */

/** A route as the prerender hands it over: no `draft`, because it is published. */
export type PageRoute = Pick<Route, 'key' | 'path'>;

export type PageMeta = {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
};

/**
 * The one absolute URL for a page. `site.url` carries no trailing slash and
 * `route.path` always opens with one, so home comes out as `https://…/` and a
 * service page as `https://…/automation` — which is exactly what `cleanUrls`
 * in vercel.json serves.
 */
export const canonicalFor = (route: PageRoute) => `${site.url}${route.path}`;

/**
 * Head metadata for a service page — or `null` for home.
 *
 * Home returns nothing on purpose. Its title, description and canonical are
 * written in index.html and that file *is* home's head; re-deriving them here
 * would mean two copies of the same three strings, and the first edit to
 * either one would make the built page disagree with the source. Everything
 * else rewrites those tags; home leaves them exactly as authored.
 *
 * A service page's title is its `h1` and its description is the paragraph
 * under it, unchanged. No brand suffix is appended: composing new Persian —
 * even by concatenation — is not this file's job, and the founder can put the
 * brand in the `h1` if it belongs there.
 *
 * Both fields are `''` until the copy is written. The prerender guard refuses
 * to build a published route in that state; see scripts/prerender.mjs.
 */
export const pageMetaFor = (route: PageRoute): PageMeta | null => {
  if (route.key === 'home') return null;

  const page = fa.pages[route.key];

  return {
    title: plain(page.title),
    description: plain(page.intro),
    canonical: canonicalFor(route),
  };
};
