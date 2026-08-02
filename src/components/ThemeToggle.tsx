import { fa } from '../content/fa';
import { useTheme } from '../hooks/useTheme';

/**
 * A square split on the diagonal, half filled — the same right-angle-and-45
 * system as the mark, and the conventional glyph for contrast. A sun and a moon
 * would be the obvious choice and both are curved, which nothing else here is.
 *
 * The glyph is the same in both themes; what changes is which way up it is. A
 * half turn puts the filled half on the other side, so the control performs the
 * thing that just happened to the page rather than swapping to a second icon.
 * The label changes too, because the button is named for what it will do, not
 * for what is currently on screen.
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      // The new theme opens from the middle of this control, so the change looks
      // like it came out of the thing that was pressed. See src/hooks/themeWave.ts.
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? fa.ui.switchToLight : fa.ui.switchToDark}
      title={theme === 'dark' ? fa.ui.switchToLight : fa.ui.switchToDark}
      // The default hit area pulls itself back out of the flow so the icon takes
      // only the space it looks like it takes. A caller that already provides
      // padding — the header pill does — passes its own instead.
      // `scale`, not `transform`: Tailwind v4 writes the individual transform
      // properties, and a transition on `transform` would never fire.
      className={`text-ink-soft transition-[color,scale] duration-200 hover:text-accent-text active:scale-90 ${
        className ?? '-m-2 p-2'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
        // Turns with the wave rather than after it, and on the same curve. The
        // control sits inside the circle from its very first frame, so this is
        // already moving before the edge has reached anything else.
        className="transition-[rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] dark:rotate-180"
      >
        <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 4v16H4z" fill="currentColor" />
      </svg>
    </button>
  );
};
