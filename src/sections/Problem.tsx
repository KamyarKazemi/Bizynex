import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

export const Problem = () => (
  <Section id={SECTION_IDS.problem} surface>
    <SectionHeader index={SECTION_INDEX.problem} title={fa.problem.title} />
    <p className="max-w-measure text-lead text-navy-800">{fa.problem.body}</p>
  </Section>
);
