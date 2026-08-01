/**
 * The dark panel that is already on screen before React starts.
 *
 * It is created by the inline script and styles in index.html, because it has to
 * exist on the first painted frame and nothing that ships as a separate file
 * can promise that. All this module does is take it back off again — but every
 * path out of the opening has to do that, so the two lines live together rather
 * than being remembered in four places.
 *
 * `data-intro` on <html> is the contract: `pending` means covered, `lifting`
 * means fading out over the page, absent means gone.
 */

/** Fade the cover out over the page. Must match the transition in index.html. */
export const COVER_LIFT_MS = 500;

/**
 * Start revealing the page underneath. Used when the opening is playing its own
 * exit, so the two fade together instead of the cover flashing in between.
 */
export const liftCover = () => {
  if (document.documentElement.dataset.intro) {
    document.documentElement.dataset.intro = 'lifting';
  }
};

/** Take it off outright. Used whenever the opening ends without an exit. */
export const removeCover = () => {
  delete document.documentElement.dataset.intro;
};

/**
 * Runs `start` at the moment the page underneath becomes visible — immediately
 * if there is no opening on this visit.
 *
 * This is what keeps the hero's entrance from being wasted. Without it the
 * lattice assembles itself behind a solid panel and is already finished by the
 * time anyone sees it; with it, the drawing pulls together in the same beat that
 * the opening hands over. Returns a disposer.
 */
export const whenCoverLifts = (start: () => void) => {
  const root = document.documentElement;
  if (!root.dataset.intro) {
    start();
    return () => undefined;
  }

  const observer = new MutationObserver(() => {
    if (root.dataset.intro === 'pending') return;
    observer.disconnect();
    start();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-intro'] });

  return () => observer.disconnect();
};
