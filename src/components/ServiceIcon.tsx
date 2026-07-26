export type ServiceIconName = 'credibility' | 'capability' | 'efficiency' | 'endurance';

type ServiceIconProps = {
  name: ServiceIconName;
  className?: string;
};

/**
 * Drawn on the same grid as everything else on this page: right angles and
 * 45-degree diagonals only, one stroke weight, butt caps. They label the
 * services, they do not decorate them — which is why a generic icon pack was
 * not used (CONTEXT.md section 7).
 */
const PATHS: Record<ServiceIconName, readonly string[]> = {
  // A frame with a chamfered corner — a site, drawn.
  credibility: ['M3 4h14l4 4v12H3z', 'M3 8h18'],
  // Two interlocking arms and a diagonal broken at the crossing: the weave.
  capability: ['M4 12V4h8', 'M20 12v8h-8', 'M7 7l3.5 3.5', 'M13.5 13.5L17 17'],
  // A routed path that steps and terminates in an arrow.
  efficiency: ['M3 19h5l4-4h4l4-4', 'M16 11h4v4'],
  // A held form with a mark inside it.
  endurance: ['M4 3h16v9l-8 8-8-8z', 'M9 10l2.5 2.5L16 8'],
};

export const ServiceIcon = ({ name, className }: ServiceIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {PATHS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
