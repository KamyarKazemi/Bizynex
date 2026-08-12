import { Marked } from '../components/Marked';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { ServiceIcon, type ServiceIconName } from '../components/ServiceIcon';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/** Positional, parallel to fa.services.items. Reorder one and reorder both. */
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
          {/* The heading is the deliverable — the thing someone would type into
              a search box. The outcome it buys is inside the sentence below,
              where there is room to make it mean something. The previous draft
              had these inverted, so the only place a service was named was a
              muted line styled as the least important thing in the card. */}
          <h3 className="mt-6 text-h3 font-semibold text-ink">{item.title}</h3>
          {/* One marked phrase per card, and it is the outcome rather than the
              service — the heading has already named the service. */}
          <p className="mt-4 text-body text-ink">
            <Marked mark={emphasis.services.items[index]} />
          </p>
        </li>
      ))}
    </ul>
  </Section>
);
