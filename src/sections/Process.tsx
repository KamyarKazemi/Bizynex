import { Marked } from '../components/Marked';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/**
 * The only numbered list on the page. Numbers are used here because the order
 * carries information the reader needs, not because numbers look tidy — hence
 * a real `ol`, and hence no numbering anywhere else.
 */
export const Process = () => (
  <Section id={SECTION_IDS.process} surface>
    <SectionHeader index={SECTION_INDEX.process} title={fa.process.title} />

    <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
      {fa.process.steps.map((step, index) => (
        <li key={step.n} className="border-t border-ink pt-5">
          <p className="text-h3 font-semibold tabular-nums text-ink">{step.n}</p>
          <h3 className="mt-4 text-h3 font-semibold text-ink">{step.title}</h3>
          {/* The marked phrase in each step is the artefact or the cadence —
              the part that either arrives or does not. */}
          <p className="mt-3 text-body text-ink">
            <Marked mark={emphasis.process.steps[index]} />
          </p>
        </li>
      ))}
    </ol>
  </Section>
);
