import { useCallback, useState } from 'react';
import { Action } from '../components/Action';
import { fa } from '../content/fa';
import { HERO_ID, SECTION_IDS } from '../content/site';
import { HeroCanvas } from '../three/HeroCanvas';
import { Marked } from '../components/Marked';

/**
 * A single framed panel: the woven figure standing in front of the name.
 *
 * The panel takes the page background in either theme, so there is no visible
 * frame around it — the room opens out of the paper. The drama is still bounded,
 * but by the fog and the falloff of the key light rather than by an edge, which
 * is what keeps a lit 3D scene inside CONTEXT.md section 7.
 *
 * Two arrangements of it, not one squeezed. A letterbox has width to spare, so
 * the copy goes into the room and stands between the figure and the name. A
 * phone has none: the room becomes a square the figure fills, the words sit on
 * the paper directly under it, and the sheet dissolves at the bottom of the
 * stage so the two meet without a canvas edge between them.
 *
 * It follows the theme like everything else — see the panel tokens in
 * styles/tokens.css, which are the only place the room's colours are written.
 *
 * ## Why the heading appears twice
 *
 * On a letterbox the words are drawn inside the scene, at a real depth, so the
 * mark can pass in front of them. Canvas text is invisible to a screen reader,
 * unfindable by find-in-page, and absent entirely without WebGL — so the real
 * <h1> and <p> stay here in the DOM, and are hidden *visually only*, and only
 * while the scene genuinely has words on screen. Both read from the same
 * `fa.hero`, so there is one source of truth and the two cannot drift apart.
 *
 * A phone never reaches that state. The scene has no width to put a reading
 * column in, so it draws the room and nothing else and says so — see
 * `onCopyDrawn` in three/HeroCanvas.tsx — and the heading below stays visible and
 * stays the only one. Hiding it on the paint rather than on the words is how a
 * hero ends up with no heading at all on the devices most people arrive on.
 *
 * Delete the canvas, block the chunk, turn WebGL off, or let the scene fail, and
 * this section is the plain readable hero it always was. That is the design, not
 * the fallback.
 *
 * The actions are never drawn in the scene. A click target belongs on a surface
 * that holds still and holds its contrast, so they sit on the paper below the
 * panel rather than floating over a moving light.
 */
export const Hero = () => {
  const [isSceneDrawingCopy, setIsSceneDrawingCopy] = useState(false);
  const handleCopyDrawn = useCallback((drawing: boolean) => setIsSceneDrawingCopy(drawing), []);

  return (
    <section id={HERO_ID} className="bg-paper">
      <div className="mx-auto max-w-page px-6 py-8 sm:px-10 sm:py-12 lg:px-16">
        <div className="relative isolate overflow-hidden rounded-card bg-panel">
          {/* The room. A square on a phone, a letterbox above `sm` — the scene
              composes itself against whichever frame it is handed, so this line
              is the only place the two arrangements are chosen between. Aspect
              rather than a height, so the panel never collapses while the chunk
              loads and nothing shifts when it lands. */}
          <div className="relative mb-7 aspect-square sm:mb-0 sm:aspect-16/10 lg:aspect-16/7">
            <HeroCanvas
              targetId={HERO_ID}
              className="absolute inset-0"
              onCopyDrawn={handleCopyDrawn}
            />
          </div>

          {/* Under the room on a phone, over it on a letterbox.
              Under: no horizontal padding, because the panel takes the page
              background in both themes — so there is no box to inset from, and
              flush is the heading landing on the same gutter as the actions
              below it and the header above it.
              Over: matches the reading column the scene draws into — see WIDE in
              HeroScene. Only ever seen when the scene is *not* drawing, so the
              two need to agree in spirit, not to the pixel. */}
          <div
            className={
              isSceneDrawingCopy
                ? 'sr-only'
                : 'sm:absolute sm:inset-0 sm:flex sm:flex-col sm:justify-end sm:p-10 lg:p-14'
            }
          >
            <h1 className="max-w-measure text-display font-semibold text-ink">{fa.hero.title}</h1>
            <p className="mt-4 max-w-measure text-lead text-ink/80"><Marked>{fa.hero.subtitle}</Marked></p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 sm:mt-10">
          <Action href={`#${SECTION_IDS.contact}`}>{fa.hero.cta}</Action>
          <Action href={`#${SECTION_IDS.services}`} tone="quiet">
            {fa.hero.ctaSecondary}
          </Action>
        </div>
      </div>
    </section>
  );
};
