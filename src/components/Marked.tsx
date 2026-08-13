import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import type { Mark } from '../content/emphasis';

type MarkedProps = {
  /** The sentence and the phrases in it worth drawing on. See content/emphasis.ts. */
  mark: Mark;
  className?: string;
};

type Segment = {
  readonly text: string;
  /** Its position among the marked phrases, which is what staggers them. */
  readonly order: number | null;
};

/**
 * The sentence, cut into plain runs and marked runs.
 *
 * Phrases are matched at their first occurrence and taken in the order they
 * appear in the sentence rather than the order they were listed, so the stagger
 * is always reading order. Two phrases that overlap keep the earlier one — the
 * alternative is nested marks, which would draw one wash on top of another.
 */
const segmentsOf = (mark: Mark): readonly Segment[] => {
  const hits = mark.phrases
    .map((phrase) => ({ phrase, at: mark.text.indexOf(phrase) }))
    .filter((hit) => hit.at !== -1)
    .sort((first, second) => first.at - second.at);

  const segments: Segment[] = [];
  let cursor = 0;
  let order = 0;

  for (const { phrase, at } of hits) {
    if (at < cursor) continue;
    if (at > cursor) segments.push({ text: mark.text.slice(cursor, at), order: null });
    segments.push({ text: phrase, order: order++ });
    cursor = at + phrase.length;
  }

  if (cursor < mark.text.length) segments.push({ text: mark.text.slice(cursor), order: null });
  return segments;
};

/** Between two marks in the same sentence. Long enough to read as a sequence. */
const STAGGER_MS = 120;

/**
 * A sentence whose important phrases draw themselves on when the reader reaches
 * them.
 *
 * `<strong>` rather than `<span>` because that is what these are: the phrases
 * the page would raise its voice on. The tag carries the emphasis to a screen
 * reader, which the colour cannot, and the weight is left inherited — the mark
 * is already the emphasis, and bolding it as well would make a page of marked
 * sentences read as a page of shouting. See the `.mark` rules in index.css.
 *
 * ## One attribute, and no re-render
 *
 * The whole effect hangs off `data-lit`, and the observer writes that attribute
 * straight onto the node instead of going through state. Two reasons, and the
 * second is the real one: a page with twenty marked sentences would otherwise
 * schedule twenty renders during a scroll, and — more importantly — the element
 * being observed is the element being changed, which is the definition of a
 * side effect on an external system rather than a piece of application state.
 *
 * Until it turns on, this renders the sentence and nothing else. That is what
 * the server sends, what a crawler reads, and what someone with JavaScript
 * blocked keeps: no text is ever hidden waiting for an animation.
 */
export const Marked = ({ mark, className }: MarkedProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver: light the marks rather than never lighting them.
    // Withholding an effect is fine; withholding the emphasis is not.
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.lit = 'on';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset.lit = 'on';
        // Once only. A phrase that re-draws itself every time it scrolls back
        // into view is a page that will not sit still while you re-read it.
        observer.disconnect();
      },
      // A little inside the bottom edge: a phrase should light up once the
      // reader has arrived at it, not while it is still clipped by the fold.
      { rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} data-lit="off" className={className}>
      {segmentsOf(mark).map((segment, index) =>
        segment.order === null ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <strong
            key={index}
            className="mark"
            style={{ '--mark-delay': `${segment.order * STAGGER_MS}ms` } as CSSProperties}
          >
            {segment.text}
          </strong>
        ),
      )}
    </span>
  );
};
