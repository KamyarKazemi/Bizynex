import { Marked } from '../components/Marked';
import { PriceRange } from '../components/PriceRange';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX, site } from '../content/site';

/**
 * Money and time, in the open, instead of at FAQ position five.
 *
 * These are the two questions every visitor has and the previous page made them
 * hunt for both. Putting them in a section of their own is the single clearest
 * signal on the page that we are not going to be cagey — which is worth more
 * than the number we still cannot publish.
 *
 * Four paragraphs rather than one: how long, why there is no published range,
 * what moves the number, and what protects it once agreed. Run together they
 * read as a company talking itself out of quoting; separated, each answers
 * something.
 *
 * **No button here, deliberately.** The page has exactly one call to action and
 * it is at the bottom, where someone who has read everything decides to get in
 * touch. A button in the middle asks for the decision before the argument for
 * it has finished. What this section does instead is explain what the bot will
 * ask for — so by the time the reader reaches تماس, the single button there is
 * not a leap.
 *
 * The one bot-dependent paragraph still renders only when `site.telegram` is
 * set, so switching the bot off leaves a section that reads correctly.
 *
 * ## The drawing beside it
 *
 * This section is four paragraphs at the reading measure inside a 76rem page,
 * so above `lg` it left about 34rem of empty paper next to it — not restraint,
 * just an unfinished column. `PriceRange` fills it with the one thing this
 * section is actually about: a published range narrowing, in three steps,
 * onto a number that then stops moving. It is the argument, drawn, and the
 * prose column keeps its measure either way.
 */
export const Pricing = () => (
  <Section id={SECTION_IDS.pricing}>
    <SectionHeader index={SECTION_INDEX.pricing} title={fa.pricing.title} />

    {/* One column until there is room for two. The prose column is the reading
        measure itself rather than a fraction, so the paragraphs are the same
        width here as in every other section — the drawing takes the remainder
        instead of the text giving any up. */}
    <div className="grid gap-y-14 lg:grid-cols-[minmax(0,var(--container-measure))_1fr] lg:items-center lg:gap-x-16">
      <div className="max-w-measure">
        {/* The two durations are marked, and the refusal to publish a price is
            not. Marking the refusal would make a decision look like an excuse. */}
        <p className="text-lead text-ink">
          <Marked mark={emphasis.pricing.time} />
        </p>
        <p className="mt-6 text-body text-ink">{fa.pricing.money}</p>
        {/* `botLead` opens with «به جایش», so it only reads correctly directly
            after `money` refuses the range. If the bot is ever switched off, this
            paragraph goes with it and `drivers` becomes the answer instead — which
            is why drivers is last rather than tucked in the middle. */}
        {site.telegram && <p className="mt-4 text-body text-ink">{fa.pricing.botLead}</p>}
        <p className="mt-6 text-body text-ink">{fa.pricing.drivers}</p>
        <p className="mt-6 text-body text-ink">
          <Marked mark={emphasis.pricing.guarantee} />
        </p>
      </div>

      <PriceRange className="justify-self-center" />
    </div>
  </Section>
);
