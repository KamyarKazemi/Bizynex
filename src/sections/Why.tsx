import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

export const Why = () => (
  <Section id={SECTION_IDS.why}>
    <SectionHeader index={SECTION_INDEX.why} title={fa.why.title} />

    <ul className="grid gap-x-16 gap-y-10 sm:grid-cols-2">
      {fa.why.items.map((item) => (
        <li key={item.title} className="border-t border-rule pt-5">
          <h3 className="text-h3 font-semibold text-navy-800">{item.title}</h3>
          <p className="mt-3 max-w-measure text-body text-navy-800">{item.body}</p>
        </li>
      ))}
    </ul>
  </Section>
);
