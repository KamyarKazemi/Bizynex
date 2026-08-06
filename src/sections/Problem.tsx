import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/**
 * Two paragraphs, and the break between them is doing real work: the first
 * names what the reader has already lived through and then stops, instead of
 * rushing on to the sales answer. Run together they read as a company
 * defending itself. Apart, the first one listens.
 *
 * The second drops to body size. The section opens at lead size and settles —
 * the same move the copy makes.
 */
export const Problem = () => (
  <Section id={SECTION_IDS.problem} surface>
    <SectionHeader index={SECTION_INDEX.problem} title={fa.problem.title} />
    <p className="max-w-measure text-lead text-ink">{fa.problem.lead}</p>
    <p className="mt-6 max-w-measure text-body text-ink">{fa.problem.body}</p>
  </Section>
);
