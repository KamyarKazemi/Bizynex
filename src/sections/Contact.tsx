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
  <Section id={SECTION_IDS.contact}>
    <SectionHeader index={SECTION_INDEX.contact} title={fa.contact.title} />

    <p className="max-w-measure text-lead text-ink">{fa.contact.body}</p>

    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
      {/* The only button on the page.

          Telegram when it exists, email when it does not — one or the other,
          never both. Two buttons side by side ask the reader to choose a
          channel at the exact moment they have decided to get in touch, which
          is the worst possible moment to hand them a decision. The address
          below stays either way: it is a link, not a button, and a visible
          address is checkable in a way a `mailto:` is not. */}
      {site.telegram ? (
        <Action href={site.telegram} external>
          {fa.contact.botCta}
        </Action>
      ) : (
        <Action href={mailtoHref}>{fa.contact.cta}</Action>
      )}

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
