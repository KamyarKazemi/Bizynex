import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { fa } from '../content/fa';
import { HERO_ID, NAV_LINKS } from '../content/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useAppSelector } from '../store';
import { selectReducedMotion } from '../store/capabilitySlice';

/**
 * The hero, plus the four sections the nav links to. Stable identity, so the
 * observer inside useActiveSection is built once.
 *
 * The hero is in the list without being in the nav on purpose: it is how the
 * pill knows the reader is back at the top and has nothing to report. Without
 * it, `useActiveSection` would hold the last section forever and the pill would
 * still be naming it while the reader looked at the hero.
 */
const OBSERVED_IDS = [HERO_ID, ...NAV_LINKS.map((link) => link.href.slice(1))];

/**
 * The strip's padding, in pixels — `p-1.5`. It is the room the focus ring needs,
 * so the clip that hides the other links cannot cut the outline off the first
 * and last one. Every offset below is derived from it, which is why it is a
 * number here and not only a class.
 */
const RING_ROOM = 6;

/** Confident arrival, no bounce. 200ms sits inside CONTEXT.md section 7's band. */
const MORPH = 'duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]';

/**
 * Where the capsule has to be. Three numbers, measured once from the live
 * layout, and everything that moves is derived from them — which is the only
 * reason the capsule, the window and the strip cannot drift apart mid-animation.
 */
type Capsule = {
  /** From the strip's leading edge to the active link's leading edge. */
  start: number;
  /** The active link's width — the pill's width once it has condensed. */
  width: number;
  /** The strip's full width — the pill's width while it is open. */
  full: number;
};

/**
 * A single floating capsule, centred, that changes shape to report where the
 * reader is.
 *
 * ## What is borrowed, and what is not
 *
 * The reference is the Dynamic Island, and the part worth taking is not its look
 * — it is its one idea: *a single object whose shape reports state.* That is
 * CONTEXT.md's "Systems" and "Clarity" rendered as a control, and it is not tied
 * to a year, which is what section 7's five-year test asks.
 *
 * What is not borrowed is the material. The real Dynamic Island is opaque black,
 * not frosted, so there is no blur here, no translucency and no glass. Section 7
 * rejects glassmorphism by name and nothing below argues with it: a solid
 * surface, a hairline border, and the 1px rule doing the work a shadow would.
 *
 * Two deliberate departures from section 7, both asked for: the pill is centred
 * where the site is otherwise start-aligned, and it carries a full radius where
 * the site is otherwise 4px.
 *
 * No logo. The hero draws the name in 3D directly below this, and section 3
 * allows one logo per surface — two marks in one frame is the thing that rule
 * exists to prevent. The footer still carries the horizontal lockup.
 *
 * ## The mechanism: a strip, and a window onto it
 *
 * The four links are one strip that never reflows. In front of them sits one
 * capsule, and around them sits a window that clips whatever the capsule is not
 * standing on. Three things move, all from the same measurement:
 *
 *   - the **capsule** slides and resizes to the active link,
 *   - the **window** narrows from the whole strip to that one link,
 *   - the **strip** slides so the link the window narrowed onto is the one still
 *     inside it.
 *
 * So the active section is never repainted from one link to another — the same
 * object travels there, and condensing is that object staying put while the
 * context reels away behind it. An instrument settling on a reading, which is
 * the register section 7 asks for, rather than a menu opening and closing.
 *
 * Offsets are measured from the strip's *leading* edge, not its left, so every
 * one of them can be a logical property. The control mirrors to LTR for free;
 * the single direction check lives in `measure` and nowhere else.
 *
 * ## What happens before, and without, JavaScript
 *
 * Nothing is measured until the strip is on screen, and until then there is no
 * capsule and no condensed state — the prerendered header is a plain, complete,
 * readable nav. That is also exactly what a reader with JavaScript blocked
 * keeps, which is the requirement rather than a consolation.
 *
 * ## Reaching it, on every input
 *
 * Condensing puts navigation behind a gesture, so each way in is deliberate:
 *
 *   - **Mouse** — hovering the pill expands it.
 *   - **Keyboard** — the links stay in the tab order even while clipped, and
 *     focus entering the pill expands it. Tab therefore lands on a link that is
 *     on screen by the time it is focused, and focus is never parked on
 *     something invisible.
 *   - **Touch** — neither of the above happens, so the first tap on the pill
 *     opens it instead of following the link.
 *
 * And a reader who asked for reduced motion is never given the condensed state
 * at all — a control that collapses out of reach is a different control, not a
 * calmer one.
 */
export const Header = () => {
  const prefersReducedMotion = useAppSelector(selectReducedMotion);
  const activeId = useActiveSection(OBSERVED_IDS);
  const [isOpen, setIsOpen] = useState(false);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);

  // Undefined in the hero, and in the two sections the nav does not link to.
  // The pill only condenses when it has a section to name, so those stretches
  // are simply the open state — no fallback, and nothing claimed that is untrue.
  const activeLink = NAV_LINKS.find((link) => link.href.slice(1) === activeId);
  const isCondensed = capsule !== null && !isOpen && !prefersReducedMotion;

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const measure = () => {
      const active = strip.querySelector<HTMLElement>('[aria-current]');

      if (!active) {
        setCapsule(null);
        return;
      }

      const stripBox = strip.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      const isRtl = getComputedStyle(strip).direction === 'rtl';

      setCapsule({
        start: isRtl ? stripBox.right - activeBox.right : activeBox.left - stripBox.left,
        width: activeBox.width,
        // Rounded up, and only here: a subpixel width on the window would clip
        // the last column of the outermost focus ring. The capsule's own numbers
        // stay fractional, because it has to land on the link exactly.
        full: Math.ceil(stripBox.width),
      });
    };

    measure();

    // The strip is `w-max`, so the window closing around it never resizes it and
    // this cannot feed back on itself. What does resize it is Vazirmatn arriving
    // after first paint and the breakpoint changing the link padding — both move
    // the capsule, and neither is a React render we could hook instead.
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [activeId]);

  // Escape, and a tap anywhere else. Between them they cover the ways out that a
  // mouse's leave and a keyboard's blur do not — which is every touch device.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!pillRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* The pill is fixed and holds no space of its own. This gives it the space
          it would have taken, and matches scroll-padding-top in index.css so
          anchor links do not land underneath it. */}
      <div aria-hidden="true" className="h-16 sm:h-20" />

      <div className="pointer-events-none fixed inset-x-0 top-3 z-20 flex justify-center px-3 sm:top-4">
        <div
          ref={pillRef}
          // `pointerType`, not `mouseenter`: Android fires a synthetic mouse
          // enter immediately before a tap's click. Opening on that would let
          // the same tap fall straight through to the link, and the nav it just
          // opened would never be seen.
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') setIsOpen(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') setIsOpen(false);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(event) => {
            // Focus moving between two controls inside the pill is not focus
            // leaving it, so the pill must not close underneath the reader.
            if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
          }}
          className="pointer-events-auto flex items-center rounded-full border border-rule bg-paper p-1"
        >
          {/* The window. Its width is the whole strip, or one link plus the room
              its focus ring needs. */}
          <div
            // `overflow-hidden` still scrolls: focusing a clipped link makes the
            // browser scroll it into view, which is a second mechanism moving the
            // strip and it fights the margin below. Focus expands the pill
            // anyway, so the reveal is already handled — take the offset back.
            onScroll={(event) => {
              event.currentTarget.scrollLeft = 0;
            }}
            className={`overflow-hidden transition-[width] ${MORPH}`}
            style={{
              width: capsule
                ? isCondensed
                  ? capsule.width + RING_ROOM * 2
                  : capsule.full
                : undefined,
            }}
          >
            <nav
              aria-label={fa.ui.mainNav}
              // Condensed, the only link on screen is the section the reader is
              // already in, so a tap on it has nowhere to go. Spend it on
              // opening the pill instead. Mouse and keyboard never arrive here:
              // both have already opened it, by hover or by focus.
              onClickCapture={(event) => {
                if (!isCondensed) return;
                event.preventDefault();
                setIsOpen(true);
              }}
            >
              <ul
                ref={stripRef}
                className={`relative flex w-max items-center p-1.5 transition-[margin-inline-start] ${MORPH}`}
                style={{ marginInlineStart: isCondensed && capsule ? RING_ROOM - capsule.start : 0 }}
              >
                {/* One capsule for four links. It is a sibling rather than a
                    background so that it can travel between them. */}
                {capsule && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-1.5 rounded-full bg-ink transition-[inset-inline-start,width] ${MORPH}`}
                    style={{ insetInlineStart: capsule.start, width: capsule.width }}
                  />
                )}

                {NAV_LINKS.map((link) => {
                  const isActive = link === activeLink;

                  return (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => setIsOpen(false)}
                        // `relative` to sit above the capsule, which is earlier
                        // in the DOM. The inverted label waits for the capsule
                        // to have been measured, so that it is never paper on
                        // paper in the frame before it arrives.
                        className={`relative block whitespace-nowrap px-2 py-1 text-label transition-colors duration-200 sm:px-3.5 ${
                          isActive && capsule ? 'text-paper' : 'text-ink-soft hover:text-accent-text'
                        }`}
                      >
                        {fa.nav[link.key]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div aria-hidden="true" className="mx-0.5 h-5 w-px bg-rule sm:mx-1" />

          <ThemeToggle className="p-1.5 sm:p-2" />
        </div>
      </div>
    </>
  );
};
