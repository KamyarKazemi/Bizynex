import { useEffect } from 'react';
import { fa } from '../content/fa';
import { ROUTES, type ServiceRouteKey } from '../content/routes';
import { removeCover } from '../hooks/introCover';
import { useCapabilityDetection } from '../hooks/useCapabilityDetection';
import { Footer } from '../sections/Footer';
import { Header } from '../sections/Header';

type ServicePageProps = {
  routeKey: ServiceRouteKey;
};

/**
 * The shell all four service pages share: header, one heading, a body, footer.
 *
 * One component rather than four files, because the four pages differ only in
 * their words — and the day one of them needs a different structure, it gets
 * its own file rather than a prop that makes this one grow a branch.
 *
 * ## Empty slots
 *
 * Every string it renders comes from `fa.pages`, and today every one of them is
 * `''` — the copy is written natively and has not been written yet. An empty
 * slot renders *nothing at all*, not an empty element, so a draft page opened
 * in `npm run dev` looks plainly unfinished instead of looking broken. These
 * routes are `draft` until the words land, and the prerender guard will not let
 * them ship before that.
 */
export const ServicePage = ({ routeKey }: ServicePageProps) => {
  const page = fa.pages[routeKey];
  /* Looked up rather than passed in: the route table already knows every
     path, and a second copy travelling down as a prop is a second place for
     it to be wrong. */
  const currentPath = ROUTES.find((route) => route.key === routeKey)?.path;

  useCapabilityDetection();

  // The inline script in index.html covers the page before first paint, and on
  // the home page it is the intro gate that takes the cover off again. There is
  // no opening here, so nothing else would: without this the visitor stares at
  // a navy rectangle until index.html's eight-second safety timer fires.
  useEffect(removeCover, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-3 focus:rounded-card focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {fa.ui.skipToContent}
      </a>

      {/* The nav links are in-page anchors that only exist on the home page. */}
      <Header hrefPrefix="/" />

      <main id="main" className="bg-paper">
        <div className="mx-auto max-w-page px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-32">
          {page.title ? (
            <h1 className="max-w-measure text-display font-semibold text-ink">{page.title}</h1>
          ) : null}

          {page.intro ? (
            <p className="mt-6 max-w-measure text-lead text-muted">{page.intro}</p>
          ) : null}

          {/* Keyed by index because this is a fixed list of copy, not a list
              that reorders or filters — the position is the identity. */}
          {page.sections.map((section, index) => (
            <section key={index} className="mt-16">
              {section.heading ? (
                <h2 className="max-w-measure text-h2 font-semibold text-ink">{section.heading}</h2>
              ) : null}

              {section.body ? (
                <p className="mt-4 max-w-measure text-body text-ink-soft">{section.body}</p>
              ) : null}
            </section>
          ))}
        </div>
      </main>

      <Footer currentPath={currentPath} />
    </>
  );
};
