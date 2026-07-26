import { buildLattice, EXTENT, STROKE } from './geometry';

const PADDING = 1.5;
const SPAN = (EXTENT + PADDING) * 2;
const SHEET_STROKE = 0.05;

/**
 * The assembled drawing, flat.
 *
 * This is the default: it paints with the HTML, it is what every visitor sees
 * first, and it is all a visitor with reduced motion, no WebGL, or a low-memory
 * device ever sees. It reads from the same module the canvas does, so the
 * fallback is a frame of the animation rather than a substitute for it.
 *
 * Only the layers of the sheet nearest the viewer are drawn. Depth in the canvas
 * comes from perspective, which a flat SVG has no way to earn — so rather than
 * fake it, this shows less and stays honest.
 */
const SEGMENTS = buildLattice().filter(
  (segment) => segment.core === 1 || segment.a[2] > -4.5,
);

export const LatticeFallback = ({ className }: { className?: string }) => (
  <svg
    viewBox={`${-(EXTENT + PADDING)} ${-(EXTENT + PADDING)} ${SPAN} ${SPAN}`}
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {/* SVG's y axis points down; the figure is authored in maths coordinates. */}
    <g transform="scale(1 -1)" strokeLinecap="butt" fill="none">
      {SEGMENTS.map((segment, index) => (
        <line
          key={index}
          x1={segment.a[0]}
          y1={segment.a[1]}
          x2={segment.b[0]}
          y2={segment.b[1]}
          strokeWidth={segment.core === 1 ? STROKE : SHEET_STROKE}
          strokeOpacity={segment.core === 1 ? 1 : 0.22}
          className={segment.accent === 1 ? 'stroke-teal-fill' : 'stroke-navy-800'}
        />
      ))}
    </g>
  </svg>
);
