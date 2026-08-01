/**
 * Where the opening throws the wordmark, and where the hero catches it.
 *
 * The two scenes are separate WebGL contexts with separate cameras, and they are
 * meant to look like one continuous shot. The only thing they have to agree on
 * is a place on screen: the panel the hero's lattice is drawn in. The opening
 * measures it and aims at it; the hero draws in it. Nothing else crosses.
 *
 * This is a 3D scene reading page layout, which is not a thing to do lightly.
 * The alternative is hard-coding a screen position and having the effect miss on
 * every viewport the layout was not tuned on — so the coupling is the honest
 * option, and it is confined to this one attribute.
 */

export const LATTICE_PANEL_ATTR = 'data-lattice-panel';

/**
 * The panel's position in CSS pixels, or null if it is not on the page — which
 * happens when WebGL is off, when the scene failed, or before the hero mounts.
 * Callers are expected to have a fallback rather than to assume this is there.
 */
export const readLatticePanelRect = () => {
  const panel = document.querySelector(`[${LATTICE_PANEL_ATTR}]`);
  if (!panel) return null;

  const rect = panel.getBoundingClientRect();
  // A collapsed rect means the element exists but has not been laid out yet.
  if (rect.width === 0 || rect.height === 0) return null;
  return rect;
};
