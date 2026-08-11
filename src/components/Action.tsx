type ActionProps = {
  href: string;
  children: string;
  /**
   * `primary` is the teal fill. CONTEXT.md section 4 allows one teal element per
   * viewport — so there is exactly one primary action in the hero and one in the
   * contact section. Two in total, never two in the same frame. The pricing
   * section deliberately renders none — see src/sections/Pricing.tsx. Nothing
   * else on the page uses it.
   */
  tone?: 'primary' | 'quiet';
  /**
   * Leaves the site. Opens in a new tab, with `noopener` so the destination
   * cannot reach back through `window.opener`.
   *
   * Only the Telegram link uses this. `mailto:` and `#anchor` are not external
   * in the sense that matters here — neither navigates the page away.
   */
  external?: boolean;
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
} as const;

export const Action = ({ href, children, tone = 'primary', external = false }: ActionProps) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className={`${BASE} ${TONES[tone]}`}
  >
    {children}
  </a>
);
