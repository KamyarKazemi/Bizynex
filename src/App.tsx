import { Analytics } from '@vercel/analytics/react';
import { routeForPath } from './content/routes';
import { HomePage } from './pages/HomePage';
import { ServicePage } from './pages/ServicePage';

type AppProps = {
  /**
   * Which page to render. The prerender passes the route it is building; the
   * browser leaves it out and the URL answers instead.
   */
  path?: string;
};

/**
 * The route switch, and nothing else.
 *
 * Every page is prerendered to its own file, so by the time this runs the
 * browser has already been handed the right HTML — this only has to agree with
 * it, which is why reading `window.location.pathname` is enough and a router
 * would be dead weight. See src/content/routes.ts.
 */
const App = ({ path }: AppProps) => {
  const route = routeForPath(path ?? window.location.pathname);

  // No route means a path that was never built. That cannot happen in
  // production — Vercel serves its own 404 for anything without a file — but
  // `npm run dev` hands every path to this bundle, so a typo lands on home.
  if (!route || route.key === 'home') {
    return (
      <>
        <HomePage />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <ServicePage routeKey={route.key} />
      <Analytics />
    </>
  );
};

export default App;
