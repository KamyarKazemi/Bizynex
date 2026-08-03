import { Action } from '../components/Action';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX, mailtoHref, site } from '../content/site';

/**
 * One action. No form: eleven fields would ask the visitor to do work before we
 * have done any, and an inbox is something three founders can actually answer.
 */
export const Contact = () => (
  <Section id={SECTION_IDS.contact} surface>
    <SectionHeader index={SECTION_INDEX.contact} title={fa.contact.title} />

    <p className="max-w-measure text-lead text-ink">{fa.contact.body}</p>

    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
      <Action href={mailtoHref}>{fa.contact.cta}</Action>

      {/* Shown as well as linked: a visible address is checkable, and a mailto
          that opens nothing is a dead end on a shared machine. */}
      <a
        href={mailtoHref}
        dir="ltr"
        lang="en"
        aria-label={fa.ui.emailUs}
        className="text-body text-ink underline decoration-rule underline-offset-8 transition-colors duration-200 hover:decoration-ink"
      >
        {site.email}
      </a>
    </div>
  </Section>
);
