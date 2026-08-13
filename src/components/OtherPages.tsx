import { fa } from '../content/fa';
import { servicePageRoutes, type ServiceRouteKey } from '../content/routes';
import { CALLOUTS } from '../content/site';

type OtherPagesProps = {
  /**
   * The page this band is standing on, so it is not listed on itself. Absent on
   * the home page, which is not one of them and therefore lists all four.
   */
  currentKey?: ServiceRouteKey;
};

/**
 * The service pages, as a band — centred, and the same band on every page that
 * carries it.
 *
 * ## Why it is a component now
 *
 * `CLAUDE.md` §1 says no abstraction until the same pattern appears three
 * times, and this is the second use. It is a component anyway, because this is
 * not an abstraction over variation — it is one block that has to stay
 * *identical* in two places. The argument the service pages already make about
 * their own cross-links applies with more force across pages than within one:
 * two presentations of one set is one set the reader has to learn twice. A
 * copy-paste of thirty lines of JSX is the version of this that drifts.
 *
 * ## Centred, where the rest of the site is start-aligned
 *
 * Everything else on this site hangs off the start edge, and that is the house
 * rule. This band is the exception on purpose: it is not part of the argument
 * either page is making, it is the way out of it — a short, self-contained menu
 * that arrives after the reading is done. Centring it is what stops it reading
 * as one more paragraph in the column above it, and it is the only element on
 * the page that gets to say "the page is over, here is where to go next".
 *
 * On a service page it used to sit in the reading column of that page's
 * two-column grid, which left the whole margin column empty beside it and hung
 * the band visibly off one side of the page.
 *
 * ## The column count follows the card count
 *
 * Three cards on a service page, four on home. Both class strings are written
 * out in full rather than composed, because Tailwind scans source text — a
 * class assembled from a variable is a class that is not in the stylesheet.
 */
export const OtherPages = ({ currentKey }: OtherPagesProps) => {
  /* Numbered before the current page is dropped, so «۰۳» is the third service
     page everywhere it appears rather than the third card in this particular
     list. Same rule the header menu and the footer follow. */
  const pages = servicePageRoutes()
    .map((route, index) => ({ route, callout: CALLOUTS[index] }))
    .filter(({ route }) => route.key !== currentKey);

  if (pages.length === 0) return null;

  const columns =
    pages.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="border-t border-rule bg-surface">
      <div className="mx-auto max-w-page px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-16">
        <h2 className="text-h2 font-semibold text-ink">{fa.ui.otherPages}</h2>

        {/* The same anatomy as the header menu's rows — numeral, title, one
            line under it — because these are the same pages. Stacked rather
            than side by side here, which is what lets the card centre on its
            own axis instead of centring a left-aligned block. */}
        <ul
          className={`mt-10 grid gap-px overflow-hidden rounded-card border border-rule bg-rule ${columns}`}
        >
          {pages.map(({ route, callout }) => (
            <li key={route.key} className="bg-paper">
              <a
                href={route.path}
                className="group flex h-full flex-col items-center gap-2 p-6 transition-colors duration-200 hover:bg-surface sm:p-8"
              >
                <span
                  aria-hidden="true"
                  className="text-label tabular-nums text-muted transition-colors duration-200 group-hover:text-accent-text"
                >
                  {callout}
                </span>

                <span className="text-h3 font-semibold text-ink">
                  {fa.pages[route.key].title}
                </span>
                <span className="text-label text-muted">{fa.pages[route.key].blurb}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
