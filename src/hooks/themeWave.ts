/**
 * The theme change, drawn.
 *
 * Rather than the palette swapping everywhere at once, the new page opens from
 * the point the reader pressed and grows out over the old one through a soft
 * circular edge — the browser's view transition, with the old page held beneath
 * as a still image until it is completely covered.
 *
 * The direction matters and is not arbitrary. It has to be the *new* layer that
 * moves. See the note in index.css: eating the old layer away instead leaves an
 * opaque snapshot sitting on top of the live page for the whole transition, and
 * removing it at the end is a blink.
 *
 * Nothing on the live page animates alongside it. The wave is the whole effect:
 * a second layer of movement underneath it — headings and paragraphs rising as
 * the edge uncovers them — reads as the page reloading rather than as the theme
 * changing, and it cannot be made to end cleanly. Those animations outlive the
 * transition, so the browser drops its composited layers while they are still
 * running and the page re-rasters in one visible step.
 */

/** Viewport coordinates. Where the wave opens from. */
export type WaveOrigin = { x: number; y: number };

/**
 * How long a pixel of travel takes.
 *
 * Constant speed, not constant duration — a wave that crosses a 360px phone and
 * a 1440px monitor in the same 500ms is two different gestures, and only one of
 * them looks like a physical thing. Bounded at both ends so it is never a
 * flicker on a small screen and never a wait on a large one.
 */
const MS_PER_PIXEL = 0.4;
const MIN_MS = 380;
const MAX_MS = 620;

/**
 * Runs `change` inside the wave — or plainly, if the wave is unavailable or
 * unwanted: a browser without view transitions, a reader who asked for reduced
 * motion, or a caller with no origin to open from.
 *
 * Every one of those paths still changes the theme. The animation is the
 * enhancement; it is never the mechanism.
 */
export const withThemeWave = (change: () => void, origin?: WaveOrigin) => {
  // Read here rather than from the store: this is a plain module with no access
  // to it, and reduced motion has to change behaviour rather than just duration,
  // so the global CSS rule in index.css cannot cover it.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!origin || prefersReducedMotion || typeof document.startViewTransition !== 'function') {
    change();
    return;
  }

  // The distance to the furthest corner. Anything shorter finishes the wave
  // before it has crossed the viewport and leaves a patch of the old theme in
  // whichever corner is furthest from the control. The edge's own width is added
  // in the stylesheet, which is where that width is defined.
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  const waveMs = Math.min(Math.max(radius * MS_PER_PIXEL, MIN_MS), MAX_MS);

  // The keyframes are declarative and live in the stylesheet; these four numbers
  // are the only part of the wave that has to be measured at the moment of the
  // press. They are left in place afterwards — the next toggle overwrites them,
  // and a stale value can only be read while a transition is running.
  const root = document.documentElement;
  root.style.setProperty('--theme-wave-x', `${origin.x}px`);
  root.style.setProperty('--theme-wave-y', `${origin.y}px`);
  root.style.setProperty('--theme-wave-radius', `${radius}px`);
  root.style.setProperty('--theme-wave-duration', `${waveMs}ms`);

  /* The marker that says *which* view transition this is.
   *
   * There are two of them on this site now — this one, and the cross-document
   * one that runs between pages — and they share one set of
   * `::view-transition-*` pseudo-elements. Without this attribute the wave's
   * rules in index.css are simply "how a view transition looks here", so every
   * page navigation would open through a circular mask centred on nothing, at
   * whatever radius the last toggle happened to leave behind.
   *
   * Set before `startViewTransition` because the old snapshot is taken inside
   * that call, and removed on `finished` — which resolves after the animation
   * has ended and the pseudo-elements are gone, so nothing can be mid-wave when
   * the styling that describes it disappears. `finally`, not `then`: a
   * transition can be skipped, and a skipped wave must still clean up after
   * itself or every later navigation inherits the mask. */
  root.dataset.themeWave = '';

  document
    .startViewTransition(change)
    .finished.finally(() => delete root.dataset.themeWave);
};
