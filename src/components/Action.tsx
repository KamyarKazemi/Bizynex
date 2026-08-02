type ActionProps = {
  href: string;
  children: string;
  /**
   * `primary` is the teal fill. CONTEXT.md section 4 allows one teal element per
   * viewport, so there is exactly one primary action in the hero and one in the
   * contact section — nothing else on the page uses it.
   */
  /**
   * `quiet-on-dark` is `quiet` for the hero panel, which is navy in both themes.
   * The plain `quiet` tone is built from semantic tokens that flip with the
   * theme, so in light mode it would put navy ink on a navy panel.
   */
  tone?: 'primary' | 'quiet' | 'quiet-on-dark';
  className?: string;
};

const BASE =
  'inline-flex items-center justify-center rounded-card font-semibold transition-colors duration-200';

/**
 * The label on the teal fill is navy, not white. White on #17A096 is 3.23:1 and
 * fails body-text contrast; navy-900 on the same fill is 5.47:1 and passes.
 * Hover brightens to teal-300 (9.9:1) rather than darkening, because darkening
 * would push the navy label back below the floor.
 */
const TONES = {
  primary: 'bg-accent-fill px-6 py-3 text-on-accent hover:bg-accent-hover',
  quiet: 'px-1 py-3 text-ink underline decoration-rule underline-offset-8 hover:decoration-ink',
  // Palette tokens, deliberately: navy-100 on navy-900 is 15.1:1 and teal-300 is
  // the documented pairing for teal on navy. Neither may follow the theme here.
  'quiet-on-dark':
    'px-1 py-3 text-navy-100 underline decoration-navy-600 underline-offset-8 hover:decoration-teal-300',
} as const;

export const Action = ({ href, children, tone = 'primary', className }: ActionProps) => (
  <a href={href} className={`${BASE} ${TONES[tone]} ${className ?? ''}`}>
    {children}
  </a>
);
