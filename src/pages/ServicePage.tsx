import { useEffect, useMemo } from 'react';
import { Action } from '../components/Action';
import { Marked } from '../components/Marked';
import { OtherPages } from '../components/OtherPages';
import { PageFigure } from '../components/PageFigure';
import { Reveal } from '../components/Reveal';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { pageLayout } from '../content/pageLayout';
import { ROUTES, type ServiceRouteKey } from '../content/routes';
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
 * — a numbered index of the page's own sections that follows you down it,
 * numbered sections under drawing callouts, and, at the foot, the two things a
 * reader who finished has left to do: read the sibling page or start the
 * conversation.
 *
 * ## The margin column carries exactly one count
 *
 * The page opened on a breadcrumb and on its own number among the four service
 * pages — «۰۳» for /app, in the same margin column, on the same text edge, in
 * the same style as the section numerals below it. That is two counts wearing
 * one uniform: on /delivery the column read ۰۴ ۰۱ ۰۲ ۰۳ ۰۴ ۰۵ ۰۶, where the
 * two «۰۴»s are a page and a section. So the numerals here now belong to the
 * page's own sections and to the action that follows them, and nothing else.
 * The page's number among the four still exists where it means something — the
 * header menu and the sibling links, where the four are listed together.
 *
 * The breadcrumb went with it. The trail said "home, then this page", which the
 * header, the footer and the URL each already say; the `BreadcrumbList` in
 * src/content/jsonLd.ts stays, because that one is read by a crawler deciding
 * what to print above a result and has no visible duplicate to disagree with.
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
  const layout = pageLayout[routeKey];

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

  // `page.sections` is a module-level constant, so this is computed once and the
  // observer inside useActiveSection is built once — which is what that hook
  // requires of its caller.
  const anchors = useMemo(() => page.sections.map((_, index) => sectionAnchor(index)), [page]);
  const activeAnchor = useActiveSection(anchors);
  /* -1 until the reader has reached the first section, which is what keeps the
     index's rule empty while they are still reading the opening. */
  const activeIndex = anchors.indexOf(activeAnchor ?? '');

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
              {/* The margin column, held open and empty — see the note at the
                  top of this file for why nothing is numbered here. The same
                  placeholder the sibling band below uses: `hidden` under `lg`,
                  so the single-column stack does not open on a blank row. */}
              <p aria-hidden="true" className="hidden lg:block" />

              <div>
                {page.title ? (
                  <h1 className="max-w-measure text-display font-semibold text-ink">
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

                  {/* The rule down the start edge fills as the reader goes,
                      one section at a time — the index reports progress rather
                      than only naming a position, which is the same thing the
                      header capsule does with the sections it watches.

                      It fills in whole items rather than by scroll fraction on
                      purpose: the segments are the list items themselves, so
                      the fill lands exactly on a boundary and nothing has to be
                      measured for it to stay aligned. */}
                  <ol className="mt-4">
                    {page.sections.map((section, index) => {
                      const isCurrent = anchors[index] === activeAnchor;
                      const isRead = activeIndex >= 0 && index <= activeIndex;

                      return (
                        <li key={index}>
                          <a
                            href={`#${anchors[index]}`}
                            // `location`, not `page`: every row here points at
                            // the page the reader is already on, and `page`
                            // would announce all of them as the current page.
                            aria-current={isCurrent ? 'location' : undefined}
                            // Colour never carries "you are here" alone — the
                            // current item changes weight and ink as well.
                            className={`flex gap-3 border-s-2 py-2 ps-3 text-label transition-colors duration-500 ${
                              isRead ? 'border-accent-fill' : 'border-rule'
                            } ${
                              isCurrent ? 'font-semibold text-ink' : 'text-muted hover:text-ink'
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
              {page.sections.map((section, index) => {
                const isLimit = index === layout.limitSection;
                // Parallel array — see src/content/pageLayout.ts. A section past
                // the end of it simply renders without a drawing.
                const figure = layout.figures[index] ?? null;

                return (
                  <Reveal key={index} className={index === 0 ? '' : 'mt-14 sm:mt-20'}>
                    {/* The limit section is bounded and the others are not.
                        It is the one section on the page that says "and here
                        is where you should not buy this from us", and a page
                        that argues that and then styles the argument like
                        every other paragraph is not making it. Which section
                        that is comes from src/content/pageLayout.ts. */}
                    <section
                      id={anchors[index]}
                      // The start-edge rule is the same 2px accent the index
                      // uses to say "here" — this block is the one the page
                      // most wants read. Width is the reading measure plus the
                      // block's own padding, derived rather than picked, so the
                      // paragraph inside sits in a box its own size instead of
                      // leaving half the block empty.
                      className={
                        isLimit
                          ? 'max-w-[calc(var(--container-measure)+4rem)] rounded-card border border-rule border-s-2 border-s-accent-fill bg-surface p-6 sm:p-8'
                          : 'border-t border-rule pt-6'
                      }
                    >
                      <p
                        aria-hidden="true"
                        className={`text-label tabular-nums ${
                          isLimit ? 'text-accent-text' : 'text-muted'
                        }`}
                      >
                        {CALLOUTS[index]}
                      </p>

                      {/* The measure line from the home page's SectionHeader:
                          the heading, then a hairline running off to the end of
                          the row. One structural device, repeated, for the cost
                          of a single border pixel.

                          The heading links to itself so a section can be sent
                          to someone. Its accessible name is the heading text,
                          which is why there is no ¶ glyph beside it needing a
                          label of its own. */}
                      {section.heading ? (
                        <div className="mt-2 flex items-center gap-5">
                          <h2 className="text-h2 font-semibold text-ink">
                            <a
                              href={`#${anchors[index]}`}
                              className="transition-colors duration-200 hover:text-accent-text"
                            >
                              {section.heading}
                            </a>
                          </h2>
                          {!isLimit && <span className="h-px flex-1 bg-rule" aria-hidden="true" />}
                        </div>
                      ) : null}

                      {section.body ? (
                        <p className="mt-5 max-w-measure text-body text-ink">
                          <Marked mark={marks.sections[index]} />
                        </p>
                      ) : null}

                      {figure ? <PageFigure kind={figure} className="mt-8" /> : null}
                    </section>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- The other three --------------------------------------------
            Centred and off the page's grid, unlike everything above it. The
            reasoning is in src/components/OtherPages.tsx; the short version is
            that this band is the way out of the page rather than part of it,
            and the home page carries the identical one. */}
        <OtherPages currentKey={routeKey} />

        {/* ---- The one action --------------------------------------------
            The same choice src/sections/Contact.tsx makes, and it has to stay
            the same: Telegram when the bot exists, email when it does not,
            never both as buttons. If that decision changes, it changes in two
            files — this one and that one. */}
        <div className="border-t border-rule">
          <div className="mx-auto max-w-page px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <div className={COLUMNS}>
              {/* The last callout on the page. The four sections were numbered;
                  so is the thing to do at the end of them. */}
              <p
                aria-hidden="true"
                className="border-s-2 border-transparent ps-3 text-label tabular-nums text-muted"
              >
                {CALLOUTS[page.sections.length]}
              </p>

              <div>
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
          </div>
        </div>
      </main>

      <Footer currentPath={currentPath} />
    </>
  );
};
