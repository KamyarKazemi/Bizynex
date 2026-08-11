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

    {/* The page's spine. It is the only sentence on the site that talks about
        the site, which is exactly why it is set apart rather than run on from
        the paragraph above — a reader skimming should still catch it. */}
    <p className="mt-8 max-w-measure text-body text-muted">{fa.problem.bridge}</p>
  </Section>
);
