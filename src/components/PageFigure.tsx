import type { CSSProperties } from 'react';
import type { FigureKind } from '../content/pageLayout';
import { useArrival } from '../hooks/useArrival';

type Stroke = {
  readonly d: string;
  /** The one line in the drawing that is the point. Everything else is grey. */
  readonly accent?: boolean;
  /** A hairline divider — the same weight the page's rules are. */
  readonly rule?: boolean;
};

type Figure = {
  readonly viewBox: string;
  readonly strokes: readonly Stroke[];
};

/**
 * The drawings, on the same grid as everything else on this site: right angles
 * and 45° diagonals only, one stroke weight, butt caps. They are the same
 * system as `ServiceIcon`, drawn larger.
 *
 * ## They carry no words, deliberately
 *
 * A diagram with labels is a second piece of copy, written by whoever drew it,
 * and this site's Persian is written by a founder. So these are unlabelled and
 * `aria-hidden`, and each one sits inside the section whose paragraph is
 * already its caption. Delete every figure on the site and not one thing it
 * says goes missing — which is the only basis on which a decorative drawing
 * earns space on a page that budgets its own weight.
 *
 * They read right to left, because the page does.
 */
const FIGURES: Record<FigureKind, Figure> = {
  /**
   * Five hand-made passes, and one line that runs.
   *
   * Above the divider: five identical figures — a node and a short run, over
   * and over, with a gap between each. Below it, the same distance covered
   * once, continuously, ending in an arrow. The repetition is the argument;
   * the drawing does not need to say "every week" because the paragraph does.
   */
  repetition: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 22h-8v8h8z' },
      { d: 'M228 26H198' },
      { d: 'M190 22h-8v8h8z' },
      { d: 'M182 26H152' },
      { d: 'M144 22h-8v8h8z' },
      { d: 'M136 26H106' },
      { d: 'M98 22h-8v8h8z' },
      { d: 'M90 26H60' },
      { d: 'M52 22h-8v8h8z' },
      { d: 'M44 26H14' },

      { d: 'M236 50H4', rule: true },

      { d: 'M236 70h-8v8h8z', accent: true },
      { d: 'M228 74H24', accent: true },
      { d: 'M32 66l-8 8l8 8', accent: true },
    ],
  },

  /**
   * The fork the whole page turns on.
   *
   * One path arrives and splits. The upper branch is crossed by tick after
   * tick — someone opening the thing again and again — and ends in a handset.
   * The lower branch is one uncrossed run to a page. The lower one is the
   * accented line, because that is the answer this page gives most readers.
   */
  decision: {
    viewBox: '0 0 240 120',
    strokes: [
      { d: 'M236 56h-8v8h8z' },
      { d: 'M228 60H140' },

      { d: 'M140 60V28H60' },
      { d: 'M120 22v12' },
      { d: 'M104 22v12' },
      { d: 'M88 22v12' },
      { d: 'M60 14H40v28h20z' },

      { d: 'M140 60V92H60', accent: true },
      { d: 'M60 82H28v20h32z', accent: true },
      { d: 'M28 89h32', accent: true },
    ],
  },
};

type PageFigureProps = {
  kind: FigureKind;
  className?: string;
};

export const PageFigure = ({ kind, className }: PageFigureProps) => {
  const figure = FIGURES[kind];

  return (
    <div
      ref={useArrival<HTMLDivElement>('draw')}
      aria-hidden="true"
      className={className}
    >
      <svg
        viewBox={figure.viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        focusable="false"
        className="h-auto w-full max-w-[24rem] text-ink-soft"
      >
        {figure.strokes.map((stroke, index) => (
          <path
            key={stroke.d}
            d={stroke.d}
            // Every path is told it is one unit long, so a 20px tick and a
            // 200px run take the same time to draw and the stagger stays even.
            pathLength="1"
            className={`figure-stroke ${
              stroke.rule ? 'text-rule' : stroke.accent ? 'text-accent-text' : ''
            }`}
            style={{ '--stroke': index } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
};
