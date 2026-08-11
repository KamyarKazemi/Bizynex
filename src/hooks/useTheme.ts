import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { selectTheme, setTheme, type Theme } from '../store/capabilitySlice';
import { withThemeWave, type WaveOrigin } from './themeWave';

/** Also read by the inline boot script in index.html. Keep the two in step. */
const STORAGE_KEY = 'bizynex:theme';

const readFromDocument = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

const readStoredChoice = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Puts the theme on screen and keeps the browser chrome in step.
 *
 * The colour handed to `theme-color` is read back out of the token rather than
 * written here, so there is still exactly one place a hex value lives.
 *
 * index.html ships two `theme-color` tags, scoped to the light and dark media
 * queries, so the first paint is right before any of this runs. Once the theme
 * is being driven from here that scoping is no longer the truth, so `media`
 * comes off both and both carry the resolved colour.
 */
const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;

  const colour = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-paper')
    .trim();

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute('media');
    meta.setAttribute('content', colour);
  });
};

/**
 * The theme is owned by the document, not by React. The boot script decides it
 * before first paint; this reads that decision back and offers a way to change
 * it. Until a visitor chooses explicitly we keep following the system, so
 * someone whose machine flips at sunset sees the site flip with it.
 */
export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    dispatch(setTheme(readFromDocument()));

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => {
      if (readStoredChoice() !== null) return;
      const next: Theme = query.matches ? 'dark' : 'light';
      apply(next);
      dispatch(setTheme(next));
    };

    query.addEventListener('change', followSystem);
    return () => query.removeEventListener('change', followSystem);
  }, [dispatch]);

  /**
   * `origin` is where on screen the change should appear to come from — the
   * control that was pressed. Omitting it swaps the theme with no animation,
   * which is also what happens on a browser or a reader that cannot take one.
   */
  const toggle = useCallback(
    (origin?: WaveOrigin) => {
      const next: Theme = readFromDocument() === 'dark' ? 'light' : 'dark';

      // Everything the change consists of has to happen inside the callback:
      // the wave is the browser diffing the page before and after it runs.
      withThemeWave(() => {
        apply(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Private mode. The choice holds for this page view and that is enough.
        }
        dispatch(setTheme(next));
      }, origin);
    },
    [dispatch],
  );

  return { theme, toggle };
};
