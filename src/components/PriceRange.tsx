import type { CSSProperties } from 'react';
import { useArrival } from '../hooks/useArrival';

type PriceRangeProps = {
  className?: string;
};

/** Shorthand for the stagger index `.figure-stroke` reads. */
const at = (index: number) => ({ '--stroke': index }) as CSSProperties;

/**
 * The published range, closing onto one written number.
 *
 * ## What it is drawing, and why it is this and not decoration
 *
 * `fa.pricing` makes one argument across four paragraphs: a public price range
 * is either so wide it says nothing or puts you in a category you are not in,
 * so we do not publish one — three things move the number, and what you get
 * instead is a figure in writing that then stops moving.
 *
 * That is a shape, so it is drawn as one and nothing here is invented:
 *
 *   - the wide span at the top is the public range, at the width that says
 *     nothing;
 *   - the rails close inward in **exactly three steps**, with a node sitting on
 *     each — the same three drivers the paragraph names, and the same count, so
 *     the drawing and the sentence can be checked against each other;
 *   - the marker hunts across the range and its travel gets shorter every pass,
 *     because the rails have closed in behind it. The amplitude is the
 *     argument;
 *   - it lands, the number is written, and a bracket closes on it. Nothing
 *     moves again.
 *
 * No words in it, `aria-hidden`, and the paragraph beside it is its caption —
 * the same terms every other drawing on this site is held to. Delete it and the
 * section loses nothing it says.
 *
 * ## The numbers in here are derived, not eyeballed
 *
 * The marker's offsets in the `price-seek` keyframes are the funnel's own
 * half-widths at the four heights, minus the room the stroke needs. Move a rail
 * and those move with it, which is the only reason the marker cannot end up
 * travelling through a rail it is supposed to be caught by.
 *
 * ## What it looks like when it does not play
 *
 * Everything below is drawn at rest. The animation is only ever *added*, by
 * `useArrival`, to a figure that was off screen at load — so a reader with
 * JavaScript blocked, or with reduced motion on, or who scrolled past before
 * the bundle arrived, gets the finished diagram with the marker already on the
 * number. That is the same rule the section drawings follow, and it is why the
 * resting state is the final frame rather than the first one.
 */
export const PriceRange = ({ className }: PriceRangeProps) => (
  <div ref={useArrival<HTMLDivElement>('draw')} aria-hidden="true" className={className}>
    <svg
      viewBox="0 0 240 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      focusable="false"
      className="h-auto w-full max-w-[22rem] text-ink-soft"
    >
      {/* ---- The range as everyone else publishes it -------------------- */}
      <path className="figure-stroke" pathLength="1" style={at(0)} d="M216 24H24" />
      <path className="figure-stroke" pathLength="1" style={at(1)} d="M24 16v16" />
      <path className="figure-stroke" pathLength="1" style={at(1)} d="M216 16v16" />

      {/* ---- The two rails, closing in three steps ----------------------- */}
      <path className="figure-stroke" pathLength="1" style={at(2)} d="M24 32V88H60V148H88V200H100V236" />
      <path className="figure-stroke" pathLength="1" style={at(2)} d="M216 32V88H180V148H152V200H140V236" />

      {/* One node per step: اندازهٔ کار، تعداد سیستم‌ها، از صفر یا روی چیز
          موجود. Three, because the sentence says three. */}
      <path className="figure-stroke" pathLength="1" style={at(4)} d="M46 84h-8v8h8z" />
      <path className="figure-stroke" pathLength="1" style={at(5)} d="M78 144h-8v8h8z" />
      <path className="figure-stroke" pathLength="1" style={at(6)} d="M98 196h-8v8h8z" />

      {/* ---- The number, and the bracket that holds it ------------------- */}
      <path className="price-settle text-accent-text" pathLength="1" style={at(0)} d="M140 252H100" />
      <path className="price-settle" pathLength="1" style={at(1)} d="M92 240H80v24h12" />
      <path className="price-settle" pathLength="1" style={at(1)} d="M148 240h12v24h-12" />

      {/* ---- The marker, still looking for it ---------------------------- */}
      <path className="price-seek text-accent-text" d="M120 242v20" />
    </svg>
  </div>
);
