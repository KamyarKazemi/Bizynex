import type { CSSProperties, RefObject } from 'react';
import { fa } from '../content/fa';
import { servicePageRoutes } from '../content/routes';
import { CALLOUTS, SECTION_IDS } from '../content/site';

type PageMenuProps = {
  /** What the trigger's `aria-controls` points at. */
  id: string;
  open: boolean;
  /* Named `panelRef` rather than `ref`: the header needs to reach inside this
     panel to move focus into it, and a prop with an explicit name says so at
     both ends. */
  panelRef?: RefObject<HTMLDivElement | null>;
  /**
   * Prepended to the in-page anchor only. The four page links are absolute
   * paths and are the same from anywhere; the overview row points at a section
   * of the home page, so from a service page it has to travel home first.
   */
  hrefPrefix: string;
  /** The page this menu is on, so the row for it can say so. */
  currentPath?: string;
  /** Called when a row is followed, so the menu is not left open behind it. */
  onNavigate: () => void;
};

/**
 * The four service pages, hung under the header capsule.
 *
 * ## Why they are in the header at all now
 *
 * They were footer-only, and the note that put them there was right at the
 * time: the capsule is a reading-position indicator for the home page's
 * sections, and hanging a second kind of navigation off it would make one
 * control mean two things. What changed is that the four pages stopped being an
 * appendix. They are the pages that answer the search someone actually typed,
 * and a page reachable only from the foot of a long document is a page most
 * visitors never learn exists.
 *
 * The objection is answered rather than ignored: the capsule still means one
 * thing. It reports where you are. This is a separate surface that opens
 * *below* it, on a deliberate press, and it never moves, resizes or renames the
 * capsule. Two objects, two jobs, one press between them.
 *
 * ## What is in the markup, always
 *
 * The whole menu is rendered on the server and on every page, open or closed —
 * `inert` and a hidden state are what close it, not an absence. Two things fall
 * out of that and both are wanted: every page carries a real link to every
 * other page in its HTML rather than in a click handler, and there is no layout
 * work to do at the moment it opens. What does *not* fall out of it is a
 * keyboard trap: `inert` takes the closed menu out of the tab order entirely.
 *
 * ## Geometry
 *
 * The panel is centred under the capsule and carries a radius closer to the
 * capsule's than to the site's 4px card. That is the same departure the capsule
 * itself already documents, extended for the same reason: a 4px box hanging off
 * a fully round pill reads as two systems, not one object opening.
 */
export const PageMenu = ({
  id,
  open,
  panelRef,
  hrefPrefix,
  currentPath,
  onNavigate,
}: PageMenuProps) => {
  const routes = servicePageRoutes();

  return (
    <div
      id={id}
      ref={panelRef}
      inert={!open}
      data-menu={open ? 'open' : 'closed'}
      // `top-full` plus padding rather than a margin: the padding is part of the
      // panel's hit area, so a mouse crossing the gap between the capsule and
      // the panel never leaves the capsule and never closes what it is reaching
      // for. `left-1/2` is symmetric, so it centres in both directions.
      // Closed is `opacity-0`, not `invisible`, and that is not a style choice.
      // `visibility` is a transitionable property, and during the first frame of
      // hidden → visible its computed value is still `hidden` — so the header's
      // "open, then move focus into it" would call focus() on an element the
      // browser still considers unfocusable, and silently do nothing. `inert`
      // is already what makes the closed panel unreachable, by keyboard and by
      // pointer and to a screen reader, so nothing is lost by dropping it.
      className={`absolute left-1/2 top-full z-10 w-[min(23rem,calc(100vw-1.5rem))] -translate-x-1/2 pt-2 transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
      }`}
    >
      <nav
        aria-label={fa.ui.servicePages}
        className="rounded-3xl border border-rule bg-paper p-2"
      >
        <ul>
          {routes.map((route, index) => {
            const page = fa.pages[route.key];
            const isCurrent = route.path === currentPath;

            return (
              <li
                key={route.key}
                className="menu-row"
                style={{ '--row': index } as CSSProperties}
              >
                <a
                  href={route.path}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={onNavigate}
                  className={`flex gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-surface focus-visible:bg-surface ${
                    isCurrent ? 'bg-surface' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-px text-label tabular-nums ${
                      isCurrent ? 'text-accent-text' : 'text-muted'
                    }`}
                  >
                    {CALLOUTS[index]}
                  </span>

                  <span>
                    <span className="block text-label font-semibold text-ink">{page.title}</span>
                    <span className="mt-1 block text-label text-muted">{page.blurb}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* The way back to the home page's own services section. Separated by a
            rule because it is a different kind of destination from the four
            above it — a section of a page, not a page. */}
        <div
          className="menu-row mt-2 border-t border-rule pt-2"
          style={{ '--row': routes.length } as CSSProperties}
        >
          <a
            href={`${hrefPrefix}#${SECTION_IDS.services}`}
            onClick={onNavigate}
            className="block rounded-2xl px-3 py-2 text-label text-ink-soft transition-colors duration-200 hover:bg-surface hover:text-accent-text focus-visible:bg-surface"
          >
            {fa.ui.servicesOverview}
          </a>
        </div>
      </nav>
    </div>
  );
};
