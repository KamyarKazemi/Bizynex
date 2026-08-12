import { useEffect, useRef, useState } from 'react';

/**
 * A phrase with an accent rule drawn under it, once, as it arrives on screen.
 *
 * CONTEXT.md section 7 used to end its typography rule with "never color or
 * decoration". It was amended on 2026-08-11 to allow exactly this, with edges:
 * **at most two per page**, accent colour only, never on a heading, and never
 * standing in for hierarchy that size and weight should be carrying. Read the
 * amendment before adding a third one to a page.
 *
 * ## The copy stays one string
 *
 * The phrase to mark is delimited inside the Persian itself with `[[…]]`:
 *
 *   'یک تیم کوچک در شیراز. [[کسی که با او حرف می‌زنید]] همان کسی است که…'
 *
 * so `fa.ts` stays a file of sentences rather than a file of fragments and
 * arrays. A translator or a founder correcting the copy moves the brackets and
 * the mark moves with them; nobody has to touch a component to re-emphasise a
 * clause. Text with no brackets renders as plain text, so this is safe to wrap
 * around any string.
 *
 * ## Why the rule starts at zero rather than animating in from JavaScript
 *
 * The underline is `scaleX(0)` in the markup and grows to `1` when the phrase
 * intersects. The alternative — render it drawn, then hide it on mount, then
 * animate — flashes a finished mark for one frame before erasing it, which is
 * the same class of defect as a theme flash and this codebase does not ship
 * those.
 *
 * The cost of that choice is that a visitor with JavaScript disabled never sees
 * the rule. That is the right trade: the mark is decoration, the sentence is
 * the content, and the sentence is in the prerendered HTML either way.
 *
 * Under `prefers-reduced-motion` the rule is simply present from the start —
 * see the media query in src/index.css. No entrance, no observer work that
 * changes anything, nothing to opt out of.
 */

type MarkedProps = {
  /** Persian copy, optionally containing one `[[…]]` span. */
  children: string;
};

/** `a [[b]] c` → `['a ', 'b', ' c']`; odd indices are the marked parts. */
const split = (text: string) => text.split(/\[\[(.+?)\]\]/);

export const Marked = ({ children }: MarkedProps) => {
  const parts = split(children);

  // No brackets means nothing to mark, and nothing to observe. Bail before
  // spending an IntersectionObserver on a plain paragraph.
  if (parts.length === 1) return <>{children}</>;

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Mark key={index}>{part}</Mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
};

const Mark = ({ children }: { children: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const element = ref.current;
    // Already drawn means the observer has done its one job. A mark that has
    // arrived stays arrived — the amendment allows an entrance, not a thing
    // that redraws itself every time the reader scrolls past.
    if (!element || drawn) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setDrawn(true);
        observer.disconnect();
      },
      // Not the very bottom edge: a rule that starts drawing the instant one
      // pixel of the phrase appears is drawing off-screen. Wait until the line
      // is properly in the page.
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [drawn]);

  return (
    <span ref={ref} className="relative whitespace-pre-wrap">
      {children}
      <span
        aria-hidden="true"
        data-mark-rule
        data-drawn={drawn ? 'true' : undefined}
        className="pointer-events-none absolute inset-x-0 -bottom-0.5 block h-px bg-accent-fill"
      />
    </span>
  );
};
