import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/**
 * Type and rules only. There are no real photographs, and stock portraits are
 * on the rejected list — a fake face costs more trust than a blank space does.
 */
export const Team = () => (
  <Section id={SECTION_IDS.team} surface>
    <SectionHeader index={SECTION_INDEX.team} title={fa.team.title} />

    <p className="max-w-measure text-lead text-ink">{fa.team.body}</p>

    <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
      {fa.team.members.map((member) => (
        <li key={member.role} className="border-t border-ink pt-5">
          <h3 className="text-h3 font-semibold text-ink">{member.role}</h3>
          <p className="mt-3 text-body text-ink">{member.body}</p>
        </li>
      ))}
    </ul>
  </Section>
);
