import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/**
 * Replaced «چرا بیزینکس», which was six promises, four of which the page had
 * already made somewhere else.
 *
 * Everything else on this page is a claim about how we will behave. This is the
 * only section that is a list of objects — things that either end up in the
 * client's hands or do not. The founders stay anonymous, so "you talk to the
 * person who builds it" cannot be proved by showing people; it can be proved by
 * showing what gets handed over.
 *
 * A list, deliberately, and not a grid of cards with headings. Cards would ask
 * each line to carry a title it does not need and would make six short facts
 * look like six arguments. The rule running down the start edge is the same
 * hairline device the section headers use — it groups the list without drawing
 * a box around it.
 */
export const Delivered = () => (
  <Section id={SECTION_IDS.delivery} surface>
    <SectionHeader index={SECTION_INDEX.delivery} title={fa.delivery.title} />

    <p className="max-w-measure text-lead text-ink">{fa.delivery.lead}</p>

    <ul className="mt-10 max-w-measure border-s border-rule ps-6">
      {fa.delivery.items.map((item) => (
        <li key={item} className="border-t border-rule py-4 text-body text-ink first:border-t-0 first:pt-0">
          {item}
        </li>
      ))}
    </ul>

    {/* Outside the list because it is conditional, and a conditional item
        inside an unconditional list is how a list stops being trustworthy. */}
    <p className="mt-8 max-w-measure text-body text-muted">{fa.delivery.note}</p>
  </Section>
);
