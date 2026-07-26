import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
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
