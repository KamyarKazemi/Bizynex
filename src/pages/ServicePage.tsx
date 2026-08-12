import { useEffect, useMemo } from 'react';
import { Action } from '../components/Action';
import { Marked } from '../components/Marked';
import { Reveal } from '../components/Reveal';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { ROUTES, servicePageRoutes, type ServiceRouteKey } from '../content/routes';
import { CALLOUTS, mailtoHref, site } from '../content/site';
import { removeCover } from '../hooks/introCover';
import { useActiveSection } from '../hooks/useActiveSection';
import { useCapabilityDetection } from '../hooks/useCapabilityDetection';
import { Footer } from '../sections/Footer';
import { Header } from '../sections/Header';

type ServicePageProps = {
  routeKey: ServiceRouteKey;
};

/**
 * Anchor for section `n`. ASCII, because this ends up in a URL that gets pasted
 * into a message and percent-encoded Persian in a link is unreadable.
 */
const sectionAnchor = (index: number) => `section-${index + 1}`;

/**
 * The page's one grid: a narrow margin column for the callout and the index,
 * and the reading column beside it. Declared once because the opening band and
 * the body both have to sit on it — that is the whole point of it.
 */
const COLUMNS = 'grid gap-y-6 lg:grid-cols-[13rem_1fr] lg:gap-x-16 lg:gap-y-12';

/**
 * The shell all four service pages share.
 *
 * One component rather than four files, because the four pages differ only in
 * their words — and the day one of them needs a different structure, it gets
 * its own file rather than a prop that makes this one grow a branch.
 *
 * ## What this page is shaped like, and why
 *
 * The reference is a page of technical documentation, which is what CONTEXT.md
 * section 7 asks for and what these pages actually are: a named question, the
 * cases where the answer is no, and what happens first. So it is built like one
 * — a trail at the top saying where you are, a numbered index of the page's own
 * sections that follows you down it, numbered sections under drawing callouts,
 * and, at the foot, the two things a reader who finished has left to do: read
 * the sibling page or start the conversation.
 *
 * That the index is a duplicate of the headings is the point. On a phone it is
 * a two-second summary of the whole page before you commit to scrolling it; on
 * a wide screen it stays put and reports which section you are in, using the
 * same `useActiveSection` the header capsule uses. One mechanism, two readouts.
 *
 * ## Empty slots
 *
 * Every string comes from `fa.pages`, and a slot that is still `''` renders
 * *nothing at all* rather than an empty element — so a draft page opened in
 * `npm run dev` looks plainly unfinished instead of looking broken. The
 * prerender guard will not let a route with empty slots ship.
 */
export const ServicePage = ({ routeKey }: ServicePageProps) => {
  const page = fa.pages[routeKey];
  const marks = emphasis.pages[routeKey];

  /* Looked up rather than passed in: the route table already knows every
     path, and a second copy travelling down as a prop is a second place for
     it to be wrong. */
  const currentPath = ROUTES.find((route) => route.key === routeKey)?.path;

  /* The four pages in the order the header menu and the footer list them, with
     the number each one carries there. Keeping the number attached to the page
     rather than to its position in this list is what stops «۰۲» meaning a
     different page depending on which page you are standing on. */
  const numbered = servicePageRoutes().map((route, index) => ({
    route,
    callout: CALLOUTS[index],
  }));
  const siblings = numbered.filter(({ route }) => route.key !== routeKey);
  const ownCallout = numbered.find(({ route }) => route.key === routeKey)?.callout;

  useCapabilityDetection();

  // The inline script in index.html covers the page before first paint, and on
  // the home page it is the intro gate that takes the cover off again. There is
  // no opening here, so nothing else would: without this the visitor stares at
  // a navy rectangle until index.html's eight-second safety timer fires.
  useEffect(removeCover, []);

  // `page.sections` is a module-level constant, so this is computed once and the
  // observer inside useActiveSection is built once — which is what that hook
  // requires of its caller.
  const anchors = useMemo(() => page.sections.map((_, index) => sectionAnchor(index)), [page]);
  const activeAnchor = useActiveSection(anchors);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-3 focus:rounded-card focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {fa.ui.skipToContent}
      </a>

      {/* The nav links are in-page anchors that only exist on the home page. */}
      <Header hrefPrefix="/" currentPath={currentPath} />

      <main id="main" className="bg-paper">
        {/* ---- The opening band -------------------------------------------
            On `surface` rather than paper so the page starts on a different
            note from the sections under it, and so the one hairline under it
            has two colours to separate rather than one. */}
        <div className="border-b border-rule bg-surface">
          <div className="mx-auto max-w-page px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            {/* The same two columns the body below uses, so the heading starts
                on the exact edge its sections do. A page whose title sits on
                one line and whose content sits on another has two grids, and
                the second one always reads as a mistake. */}
            <div className={COLUMNS}>
              {/* The page's own callout, in the margin — the same device the
                  home page's section headers use, and the same number this
                  page carries in the header menu and in the footer. */}
              {/* The transparent rule is not decoration: it puts this numeral
                  on the exact same text edge as the numerals in the index
                  below, which carry a real one. Without it the two sit 14px
                  apart in the same column, which is the sort of drift
                  CONTEXT.md section 7 is about. */}
              <p
                aria-hidden="true"
                className="border-s-2 border-transparent ps-3 text-label tabular-nums text-muted"
              >
                {ownCallout}
              </p>

              <div>
                <nav aria-label={fa.ui.breadcrumb}>
                  {/* Matches the BreadcrumbList in the structured data exactly —
                      home, then this page, and the last crumb does not link to
                      itself. See src/content/jsonLd.ts. */}
                  <ol className="flex flex-wrap items-center gap-x-2 text-label text-muted">
                    <li>
                      <a
                        href="/"
                        className="underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                      >
                        {fa.ui.home}
                      </a>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page" className="text-ink">
                      {page.title}
                    </li>
                  </ol>
                </nav>

                {page.title ? (
                  <h1 className="mt-6 max-w-measure text-display font-semibold text-ink">
                    <Marked mark={marks.title} />
                  </h1>
                ) : null}

                {page.intro ? (
                  <p className="mt-6 max-w-measure text-lead text-ink">
                    <Marked mark={marks.intro} />
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Index, and the sections it indexes -------------------------- */}
        <div className="mx-auto max-w-page px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className={COLUMNS}>
            {page.sections.length > 0 ? (
              <aside>
                <div className="lg:sticky lg:top-24">
                  <p className="text-label text-muted">{fa.ui.onThisPage}</p>

                  <ol className="mt-4">
                    {page.sections.map((section, index) => {
                      const isCurrent = anchors[index] === activeAnchor;

                      return (
                        <li key={index}>
                          <a
                            href={`#${anchors[index]}`}
                            aria-current={isCurrent ? 'true' : undefined}
                            // The rule is on the start edge and it is the only
                            // teal on this page above the fold — one indicator,
                            // and it is the "you are here". The colour never
                            // carries it alone: the label changes weight too.
                            className={`flex gap-3 border-s-2 py-2 ps-3 text-label transition-colors duration-200 ${
                              isCurrent
                                ? 'border-accent-fill font-semibold text-ink'
                                : 'border-rule text-muted hover:text-ink'
                            }`}
                          >
                            <span aria-hidden="true" className="tabular-nums">
                              {CALLOUTS[index]}
                            </span>
                            <span>{section.heading}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </aside>
            ) : null}

            <div>
              {/* Keyed by index because this is a fixed list of copy, not a list
                  that reorders or filters — the position is the identity. */}
              {page.sections.map((section, index) => (
                <Reveal key={index} className={index === 0 ? '' : 'mt-14 sm:mt-20'}>
                  <section id={anchors[index]} className="border-t border-rule pt-6">
                    <p aria-hidden="true" className="text-label tabular-nums text-muted">
                      {CALLOUTS[index]}
                    </p>

                    {section.heading ? (
                      <h2 className="mt-2 max-w-measure text-h2 font-semibold text-ink">
                        {section.heading}
                      </h2>
                    ) : null}

                    {section.body ? (
                      <p className="mt-5 max-w-measure text-body text-ink">
                        <Marked mark={marks.sections[index]} />
                      </p>
                    ) : null}
                  </section>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ---- The other three -------------------------------------------- */}
        {siblings.length > 0 ? (
          <div className="border-t border-rule bg-surface">
            <div className="mx-auto max-w-page px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
              <h2 className="text-h2 font-semibold text-ink">{fa.ui.otherPages}</h2>

              <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
                {siblings.map(({ route, callout }) => (
                  <li key={route.key} className="bg-paper">
                    <a
                      href={route.path}
                      className="flex h-full flex-col p-6 transition-colors duration-200 hover:bg-surface"
                    >
                      <span aria-hidden="true" className="text-label tabular-nums text-muted">
                        {callout}
                      </span>
                      <span className="mt-5 text-h3 font-semibold text-ink">
                        {fa.pages[route.key].title}
                      </span>
                      <span className="mt-2 text-body text-muted">
                        {fa.pages[route.key].blurb}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* ---- The one action --------------------------------------------
            The same choice src/sections/Contact.tsx makes, and it has to stay
            the same: Telegram when the bot exists, email when it does not,
            never both as buttons. If that decision changes, it changes in two
            files — this one and that one. */}
        <div className="border-t border-rule">
          <div className="mx-auto max-w-page px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <h2 className="max-w-measure text-h2 font-semibold text-ink">{fa.contact.title}</h2>

            <p className="mt-5 max-w-measure text-lead text-ink">
              <Marked mark={emphasis.contact.body} />
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {site.telegram ? (
                <Action href={site.telegram} external>
                  {fa.contact.botCta}
                </Action>
              ) : (
                <Action href={mailtoHref}>{fa.contact.cta}</Action>
              )}

              <a
                href={mailtoHref}
                dir="ltr"
                lang="en"
                aria-label={fa.ui.emailUs}
                className="text-body text-ink underline decoration-rule underline-offset-8 transition-colors duration-200 hover:decoration-ink"
              >
                {site.email}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer currentPath={currentPath} />
    </>
  );
};
