import { Marked } from '../components/Marked';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { emphasis } from '../content/emphasis';
import { fa } from '../content/fa';
import { SECTION_IDS, SECTION_INDEX } from '../content/site';

/**
 * Four questions, all of them open.
 *
 * No accordion. An accordion here would cost keyboard handling, ARIA state and
 * a hydration boundary, and it would buy nothing: the answers are short, the
 * page is long already, and text hidden behind a click is text a reader has to
 * decide to want. Everything is in the DOM, in the prerendered HTML, findable
 * with ctrl-F, and readable with JavaScript switched off.
 *
 * The wording here is duplicated verbatim into FAQPage structured data by
 * src/content/jsonLd.ts. Both read from `fa.faq`, so schema and visible text
 * cannot disagree — which is the thing Google actually penalises.
 */
export const Faq = () => (
  <Section id={SECTION_IDS.faq} surface>
    <SectionHeader index={SECTION_INDEX.faq} title={fa.faq.title} />

    <ul className="grid gap-x-16 gap-y-10 sm:grid-cols-2">
      {fa.faq.items.map((item, index) => (
        <li key={item.q} className="border-t border-rule pt-5">
          <h3 className="text-h3 font-semibold text-ink">{item.q}</h3>
          {/* Two of the four answers carry a mark. The other two are already
              the whole answer and have nothing in them to raise. */}
          <p className="mt-3 max-w-measure text-body text-ink">
            <Marked mark={emphasis.faq.items[index]} />
          </p>
        </li>
      ))}
    </ul>
  </Section>
);
