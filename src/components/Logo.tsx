import { fa } from '../content/fa';

type LogoProps = {
  /**
   * One member today. Kept as a union because the stacked master still exists in
   * brand/ and is still built — this is the seam it comes back through.
   */
  variant: 'horizontal';
  className?: string;
};

/**
 * Logo masters are supplied by the founders and live in brand/ — they are brand
 * assets, not something this codebase draws. `npm run build:images` generates
 * both the light files and the dark ones, in which the navy is repainted to the
 * dark theme's ink and the two teal segments are left alone.
 *
 * Both the light and the dark file are in the markup, with CSS choosing between
 * them — `variant` above is a separate axis. Swapping the
 * `src` from JavaScript instead would cost nothing in bytes but would show a
 * navy mark on a navy page until hydration caught up — up to a second on the
 * connections CONTEXT.md section 8 tells us to assume.
 */
const SOURCES = {
  horizontal: { file: 'bizynex-horizontal', width: 448, height: 102 },
} as const;

export const Logo = ({ variant, className }: LogoProps) => {
  const source = SOURCES[variant];
  const shared = {
    width: source.width,
    height: source.height,
    // The wrapper carries the accessible name, so the images themselves are
    // decorative — otherwise assistive technology announces the mark twice.
    alt: '',
    // The only mark on the page is in the footer, which is never above the fold.
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };

  return (
    <span role="img" aria-label={fa.ui.brandName} className={`inline-block ${className ?? ''}`}>
      <img {...shared} src={`/brand/${source.file}.png`} className="h-full w-auto dark:hidden" />
      <img
        {...shared}
        src={`/brand/${source.file}-dark.png`}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
};
