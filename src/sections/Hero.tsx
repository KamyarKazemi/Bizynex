import { Action } from '../components/Action';
import { Logo } from '../components/Logo';
import { fa } from '../content/fa';
import { SECTION_IDS } from '../content/site';
import { LatticeCanvas } from '../three/LatticeCanvas';

export const HERO_ID = 'top';

/**
 * The lattice sits beside the words rather than behind them. Persian at 1.8
 * line height over a moving field is a legibility problem no amount of opacity
 * fixes, and a contained panel reads more like a drawing on a sheet anyway.
 */
export const Hero = () => (
  <section id={HERO_ID} className="bg-paper">
    <div className="mx-auto grid max-w-page items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20 lg:px-16 lg:py-28">
      <div>
        <Logo variant="stacked" className="h-20 w-auto sm:h-24" priority />

        <h1 className="mt-10 max-w-measure text-display font-semibold text-ink">
          {fa.hero.title}
        </h1>

        <p className="mt-6 max-w-measure text-lead text-ink">{fa.hero.subtitle}</p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Action href={`#${SECTION_IDS.contact}`}>{fa.hero.cta}</Action>
          <Action href={`#${SECTION_IDS.services}`} tone="quiet">
            {fa.hero.ctaSecondary}
          </Action>
        </div>
      </div>

      <LatticeCanvas
        targetId={HERO_ID}
        className="relative order-first aspect-square w-full max-w-[20rem] justify-self-center text-ink lg:order-0 lg:max-w-none"
      />
    </div>
  </section>
);
