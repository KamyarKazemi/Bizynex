import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { ServiceIcon, type ServiceIconName } from '../components/ServiceIcon';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/** Parallel to fa.services.items — outcome first, deliverable second. */
const ICONS: readonly ServiceIconName[] = ['credibility', 'capability', 'efficiency', 'endurance'];

export const Services = () => (
  <Section id={SECTION_IDS.services}>
    <SectionHeader index={SECTION_INDEX.services} title={fa.services.title} />

    <ul className="grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
      {fa.services.items.map((item, index) => (
        <li key={item.title} className="flex flex-col bg-paper p-6 lg:p-7">
          {/* Navy, not teal. Four teal icons in one viewport would spend the
              whole accent budget on decoration. */}
          <ServiceIcon name={ICONS[index]} className="text-ink-soft" />
          <h3 className="mt-6 text-h3 font-semibold text-ink">{item.title}</h3>
          <p className="mt-1 text-label text-muted">{item.deliverable}</p>
          <p className="mt-4 text-body text-ink">{item.body}</p>
        </li>
      ))}
    </ul>
  </Section>
);
