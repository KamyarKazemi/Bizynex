import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
import { site } from './content/site';
import { store } from './store';

/**
 * Used once, at build time, by scripts/prerender.mjs.
 *
 * The capability store starts in its most conservative state, so what renders
 * here is exactly what the browser renders on its first pass: full copy, static
 * SVG, no canvas. That is both the no-JavaScript experience and a hydration
 * match.
 */
export const render = () =>
  renderToString(
    <Provider store={store}>
      <App />
    </Provider>,
  );

/**
 * Re-exported so the prerender script has a single module to import. It is
 * generated from fa.ts — see src/content/jsonLd.ts for why it is built here
 * rather than written into index.html by hand.
 */
export { jsonLdScript } from './content/jsonLd';

/**
 * The canonical origin, re-exported for the same reason: the prerender step
 * writes the sitemap, and the sitemap's URL and the page's `@id` have to come
 * from one place or they will disagree the first time the domain changes.
 */
export const siteUrl = site.url;
