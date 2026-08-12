import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
import { jsonLdScript, jsonLdScriptForPage } from './content/jsonLd';
import { pageMetaFor } from './content/meta';
import { publishedRoutes } from './content/routes';
import { site } from './content/site';
import { store } from './store';

/**
 * Used at build time, once per page, by scripts/prerender.mjs.
 *
 * The capability store starts in its most conservative state, so what renders
 * here is exactly what the browser renders on its first pass: full copy, static
 * SVG, no canvas. That is both the no-JavaScript experience and a hydration
 * match.
 *
 * `path` is the route being built. In the browser App reads the URL instead —
 * there is no URL here, so the caller supplies it.
 */
export const render = (path: string) =>
  renderToString(
    <Provider store={store}>
      <App path={path} />
    </Provider>,
  );

/**
 * Re-exported so the prerender script has a single module to import. It is
 * generated from fa.ts — see src/content/jsonLd.ts for why it is built here
 * rather than written into index.html by hand.
 */
export { jsonLdScript };

/**
 * The build guard's other half. The script decides *whether* to fail; this
 * decides what counts as unfinished, because that is a question about the shape
 * of the copy and the copy lives in TypeScript. See src/content/fa.ts.
 */
export { emptyCopySlots } from './content/fa';

/**
 * The same guard, for the emphasis marks: every phrase the page draws on has to
 * still be inside the sentence it points at. Exported here so the prerender has
 * one module to import — see src/content/emphasis.ts for why a mark going
 * missing has to be a build failure rather than a silently plain sentence.
 */
export { unmatchedMarks } from './content/emphasis';

/**
 * Every page this build should emit, in one array, so the script never has to
 * restate the route table. Drafts are already filtered out — see
 * src/content/routes.ts.
 */
export const prerenderRoutes = publishedRoutes().map((route) => ({
  key: route.key,
  path: route.path,
  /**
   * Everything the script needs to write this page's head, resolved here where
   * the copy and the origin both live. `null` for home, whose head is authored
   * in index.html and left alone — see src/content/meta.ts.
   */
  meta: pageMetaFor(route),
}));

/**
 * The structured data for one page. Home gets the graph it always had; a
 * service page gets its own WebPage, Service and breadcrumb on top of the same
 * Organization and WebSite.
 */
export const jsonLdFor = (route: { key: string; path: string }) => {
  const meta = pageMetaFor(route as Parameters<typeof pageMetaFor>[0]);

  if (meta === null) return jsonLdScript;

  return jsonLdScriptForPage({
    key: route.key,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
  });
};

/**
 * The canonical origin, re-exported for the same reason: the prerender step
 * writes the sitemap, and the sitemap's URL and the page's `@id` have to come
 * from one place or they will disagree the first time the domain changes.
 */
export const siteUrl = site.url;
