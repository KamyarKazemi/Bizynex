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
   * Effort out, nothing back.
   *
   * The top run is crossed by three passes — the work being done. It turns the
   * corner and comes all the way home along the bottom, and the bottom run is
   * bare. The accented legs are the return, because the section's point is that
   * you arrive back exactly where you started.
   */
  payback: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 20h-8v8h8z' },
      { d: 'M228 24H40' },
      { d: 'M188 20v8' },
      { d: 'M148 20v8' },
      { d: 'M108 20v8' },
      { d: 'M40 24V72' },
      { d: 'M40 72H228', accent: true },
      { d: 'M228 72V28', accent: true },
    ],
  },

  /**
   * A dimension line, which is what «اول اندازه می‌گیریم» describes.
   *
   * The run along the bottom is the work as it happens today, ticked where it
   * repeats. Above it, extension lines and a span with end ticks: the number
   * taken before anything is built. The span is the accent — it is the thing
   * the section says comes first.
   */
  measure: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 68H24' },
      { d: 'M196 68v8' },
      { d: 'M148 68v8' },
      { d: 'M100 68v8' },
      { d: 'M228 68V36' },
      { d: 'M52 68V36' },
      { d: 'M228 44H52', accent: true },
      { d: 'M228 36v16', accent: true },
      { d: 'M52 36v16', accent: true },
    ],
  },

  /**
   * The step that will not fit inside the box.
   *
   * A bounded system with a run inside it that is ticked where it works. Then
   * one leg drops straight through the wall and finishes at a node outside —
   * the few stages done in a spreadsheet every time. The accent is the part
   * that had to leave, because that is what the section is about.
   */
  overflow: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M228 16H52v48h176z' },
      { d: 'M220 40H140' },
      { d: 'M204 36v8' },
      { d: 'M172 36v8' },
      { d: 'M140 40V84', accent: true },
      { d: 'M140 84H100', accent: true },
      { d: 'M100 80h-8v8h8z', accent: true },
    ],
  },

  /**
   * Three separate things, brought onto one line.
   *
   * Three boxes that do not touch, each dropping to a single run below them
   * that gathers all three and carries on downward. The gathering run is the
   * accent: the boxes already existed, the line between them is what gets
   * built.
   */
  connect: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M232 12h-40v24h40z' },
      { d: 'M160 12h-40v24h40z' },
      { d: 'M88 12h-40v24h40z' },
      { d: 'M212 36V56' },
      { d: 'M140 36V56' },
      { d: 'M68 36V56' },
      { d: 'M212 56H68', accent: true },
      { d: 'M140 56V80', accent: true },
      { d: 'M132 72l8 8l8-8', accent: true },
    ],
  },

  /**
   * Two sizes on one baseline.
   *
   * A large ruled box and, beside it, one a fraction of its height. The small
   * one is accented, which is the whole inversion the section performs: it says
   * buy the smaller thing when the smaller thing solves it, so the drawing
   * points at the smaller thing.
   */
  scale: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 88H4', rule: true },
      { d: 'M236 20h-96v68h96z' },
      { d: 'M228 40h-80' },
      { d: 'M228 60h-80' },
      { d: 'M116 64h-32v24h32z', accent: true },
      { d: 'M108 76h-16', accent: true },
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

  /**
   * Outside the building, on a link that keeps dropping.
   *
   * The ruled box on the start side is the office and the stable connection.
   * The line reaching out of it is broken into three pieces, and at the far end
   * is the accented device that has to keep working anyway — which is the one
   * case the section says an app earns.
   */
  offline: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 16H140v64h96z' },
      { d: 'M228 36h-80' },
      { d: 'M228 60h-80' },
      { d: 'M140 48H124' },
      { d: 'M116 48H100' },
      { d: 'M92 48H76' },
      { d: 'M68 28h-28v40h28z', accent: true },
      { d: 'M60 60H48', accent: true },
    ],
  },

  /**
   * A staircase that does not arrive.
   *
   * Four landings, each with a node sitting on it — a year, and the release it
   * had to be updated for. The accented leg is the next step and the arrow past
   * it, which is the section's point: this is the one cost that never closes.
   */
  upkeep: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 84H196V68H156V52H116V36H76' },
      { d: 'M196 60h-8v8h8z' },
      { d: 'M156 44h-8v8h8z' },
      { d: 'M116 28h-8v8h8z' },
      { d: 'M76 36V20H36', accent: true },
      { d: 'M44 12l-8 8l8 8', accent: true },
    ],
  },

  /**
   * Held in your name, with the way out left open.
   *
   * The accented box is the repository. It hangs off your account on the start
   * side, and the run continuing past it to a second node is the handover to
   * another team — drawn unobstructed, because the section's claim is that
   * nothing has to be asked of us for it. The stub dropping below is our
   * access: it reaches the box, and the box does not depend on it.
   */
  ownership: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 36h-24v20h24z' },
      { d: 'M212 46H148' },
      { d: 'M148 24h-64v44h64z', accent: true },
      { d: 'M84 46H44' },
      { d: 'M44 36h-24v20h24z' },
      { d: 'M116 68V84' },
      { d: 'M128 84h-24v10h24z' },
    ],
  },

  /**
   * One link cut, and the thing still standing.
   *
   * The accented box is the site, sitting on a rule that does not move. One
   * link runs to your account and stays whole; the other is broken, struck
   * through at 45°, and the box is unaffected by it. That is «اگر همکاری تمام
   * شود، سایت سر جایش می‌ماند» with nothing written down.
   */
  detach: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M176 76H68', rule: true },
      { d: 'M160 28h-64v40h64z', accent: true },
      { d: 'M236 40h-16v16h16z' },
      { d: 'M220 48H160' },
      { d: 'M96 48H76' },
      { d: 'M72 40l-12 12' },
      { d: 'M56 48H40' },
      { d: 'M40 40h-16v16h16z' },
    ],
  },

  /**
   * A page, with the line you start from picked out.
   *
   * Four ruled lines inside a folded sheet. The accented one is shorter than
   * the others and sits in the middle of them, which is the section's
   * distinction: not a list of everything, but the one place to start when
   * something has stopped working.
   */
  document: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M180 32L164 16H60v64h120z' },
      { d: 'M164 16v16h16' },
      { d: 'M164 36H76' },
      { d: 'M164 48H76' },
      { d: 'M140 60H76', accent: true },
      { d: 'M164 72H76' },
    ],
  },

  /**
   * A bracketed window over the front of a much longer run.
   *
   * The run carries on past the end of the drawing; the accented bracket covers
   * only its first stretch. The ticks that fall outside the bracket are the
   * changes and additions the section says do not fit inside it. The proportion
   * is the argument, so it is drawn to scale and not generously.
   */
  window: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M236 60H24' },
      { d: 'M32 52l-8 8l8 8' },
      { d: 'M236 40H156', accent: true },
      { d: 'M236 40v12', accent: true },
      { d: 'M156 40v12', accent: true },
      { d: 'M124 60v8' },
      { d: 'M92 60v8' },
      { d: 'M60 60v8' },
    ],
  },

  /**
   * A run that stops short of the line it may not cross.
   *
   * The hairline is the budget. The grey run above reaches it exactly — the
   * page that only just fits, which is the page everyone else ships. The
   * accented run below stops well before it and its end tick says where. The
   * gap between the accent and the hairline is the whole section.
   */
  ceiling: {
    viewBox: '0 0 240 96',
    strokes: [
      { d: 'M40 12v72', rule: true },
      { d: 'M236 24h-8v8h8z' },
      { d: 'M228 28H40' },
      { d: 'M236 52h-8v8h8z', accent: true },
      { d: 'M228 56H76', accent: true },
      { d: 'M76 48v16', accent: true },
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
