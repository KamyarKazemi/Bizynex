import { fa } from '../content/fa';
import { useTheme } from '../hooks/useTheme';

/**
 * A square split on the diagonal, half filled — the same right-angle-and-45
 * system as the mark, and the conventional glyph for contrast. A sun and a moon
 * would be the obvious choice and both are curved, which nothing else here is.
 *
 * The icon does not change between themes. What changes is the label, because
 * the button is named for what it will do, not for what is currently on screen.
 */
export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? fa.ui.switchToLight : fa.ui.switchToDark}
      title={theme === 'dark' ? fa.ui.switchToLight : fa.ui.switchToDark}
      className="-m-2 p-2 text-ink-soft transition-colors duration-200 hover:text-accent-text"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 4v16H4z" fill="currentColor" />
      </svg>
    </button>
  );
};
