/**
 * Every page the site can serve, in one table.
 *
 * There is no router here and there does not need to be one. Every route below
 * is prerendered to its own HTML file at build time — `vercel.json` sets
 * `cleanUrls`, so `dist/automation.html` is served at `/automation` — which
 * means choosing a page is only ever "look up the path we were asked for".
 * A routing library would ship kilobytes to answer a question the file system
 * has already answered.
 *
 * Two things read this table and nothing else: `src/App.tsx`, to pick the page
 * component, and `scripts/prerender.mjs`, to decide which files to write and
 * what goes in the sitemap. Adding a page is one entry here plus its copy.
 */

export type RouteKey = 'home' | 'automation' | 'software' | 'app' | 'delivery' | 'work';

/** Every route except home: the four Tier-1 service pages, plus the case study. */
export type ServiceRouteKey = Exclude<RouteKey, 'home'>;

export type Route = {
  readonly key: RouteKey;
  /** Served path. '/' for home; '/automation' etc. for the rest. */
  readonly path: string;
  /**
   * True while the Persian copy for this page does not exist yet. A draft route
   * is not built, not linked, and not in the sitemap — the site stays correct
   * and deployable at every moment, and a page appears the day its copy lands.
   */
  readonly draft: boolean;
};

export const ROUTES: readonly Route[] = [
  { key: 'home', path: '/', draft: false },
  { key: 'automation', path: '/automation', draft: false },
  { key: 'software', path: '/software', draft: false },
  { key: 'app', path: '/app', draft: false },
  { key: 'delivery', path: '/delivery', draft: false },

  /**
   * The case study.
   *
   * Draft for a different reason than the four above: those are waiting on
   * copy, this one is waiting on a *fact*. No competitor in this market
   * publishes a case study with a measured outcome — they publish portfolio
   * links, which are logos and URLs. A named problem with a number attached to
   * the result is therefore the cheapest way this company can be structurally
   * different rather than only quieter.
   *
   * Which is exactly why it cannot be written until there is a real project and
   * a real measurement. An invented outcome is not a weaker version of this
   * page, it is the opposite of it: the whole argument is that we say what
   * actually happened. Leave this draft until a client result exists, and see
   * the brief in PRODUCTION.md for what to record while the work is happening
   * rather than trying to reconstruct it afterwards.
   */
  { key: 'work', path: '/work', draft: true },
];

/**
 * The routes this build knows about.
 *
 * Drafts are reachable in `npm run dev` and nowhere else. The founder writing
 * the copy needs to open the page and see how it reads while it is still half
 * written; a visitor must never find it. `import.meta.env.DEV` is the only line
 * that separates those two audiences, and Vite folds it to a constant at build
 * time, so the draft entries drop out of the production bundle entirely.
 */
export const publishedRoutes = (): readonly Route[] =>
  import.meta.env.DEV ? ROUTES : ROUTES.filter((route) => !route.draft);

/**
 * `vercel.json` sets `trailingSlash: false`, so nothing we link to ever carries
 * one — but a hand-typed or pasted `/automation/` should still land on the page
 * rather than on a fallback.
 */
const withoutTrailingSlash = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

export const routeForPath = (pathname: string): Route | undefined =>
  publishedRoutes().find((route) => route.path === withoutTrailingSlash(pathname));
