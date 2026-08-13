import { fa } from './fa';
import type { ServiceRouteKey } from './routes';

/**
 * Which phrases the page draws a mark under, and nothing else.
 *
 * ## Why this is not in fa.ts
 *
 * The obvious version of this feature puts brackets in the copy — `[[…]]`
 * around the important words — and a parser in the component. It is one file
 * instead of two and it is wrong here for a specific reason: `fa.ts` is not
 * only rendered. `src/content/jsonLd.ts` copies those same strings into the
 * structured data and `src/content/meta.ts` copies them into `<title>` and the
 * meta description. Markup in the source string would travel into all three,
 * and the first place anyone would notice is a search result with `[[` in it.
 *
 * So the copy stays a plain string and the emphasis is a separate list that
 * points at it. `fa.ts` is untouched by this feature — which is also what keeps
 * the rule in CLAUDE.md section 2 intact: nothing here writes, edits or
 * reflows a single Persian word. It only says which existing ones matter.
 *
 * ## The phrase has to be in the sentence
 *
 * Each entry carries the sentence *and* the phrases, so the two cannot be
 * separated. `unmatchedMarks` walks everything below and reports any phrase
 * that is no longer inside its own sentence; `scripts/prerender.mjs` calls it
 * and refuses to build. Editing a marked sentence therefore fails the build
 * with the phrase named, instead of quietly dropping the mark and leaving
 * nobody to notice — the same arrangement `emptyCopySlots` already has.
 *
 * ## How much to mark
 *
 * One phrase per paragraph, two where the paragraph is genuinely making two
 * points. Never a whole sentence, never a heading the reader is already going
 * to read, and never a word that is only decorative — «سریع» marks nothing,
 * «سه تا شش هفته» marks the promise. If everything is marked, the marks say
 * nothing and the page has bought a colour wash and sold its emphasis.
 */

export type Mark = {
  /** The sentence exactly as `fa.ts` holds it. */
  readonly text: string;
  /** Substrings of it, each drawn on. Order does not matter. */
  readonly phrases: readonly string[];
};

const marked = (text: string, ...phrases: string[]): Mark => ({ text, phrases });

type PageMarks = {
  readonly title: Mark;
  readonly intro: Mark;
  /** Parallel to `fa.pages[key].sections`, by position. Short is allowed. */
  readonly sections: readonly Mark[];
};

const pages: Record<ServiceRouteKey, PageMarks> = {
  automation: {
    title: marked(fa.pages.automation.title),
    intro: marked(fa.pages.automation.intro, 'لازم نیست دستی انجام شود'),
    sections: [
      marked(fa.pages.automation.sections[0].body, 'کسی بابتش حقوق می‌گیرد'),
      marked(fa.pages.automation.sections[1].body, 'در جلسهٔ اول می‌گوییم'),
      marked(fa.pages.automation.sections[2].body, 'از اول می‌گوییم'),
    ],
  },

  software: {
    title: marked(fa.pages.software.title),
    intro: marked(fa.pages.software.intro, 'سیستم را دور خودِ کار می‌سازیم'),
    sections: [
      marked(fa.pages.software.sections[0].body, 'ما هم همین را می‌گوییم'),
      marked(fa.pages.software.sections[1].body, 'همه تحت وب'),
      marked(fa.pages.software.sections[2].body, 'به نفع هیچ‌کس نیست'),
    ],
  },

  app: {
    title: marked(fa.pages.app.title),
    intro: marked(fa.pages.app.intro, 'سایتی که روی موبایل درست کار کند کافی است'),
    sections: [
      marked(fa.pages.app.sections[0].body, 'یک سایت خوب روی موبایل'),
      marked(fa.pages.app.sections[1].body, 'یا نمی‌تواند یا خوب نمی‌تواند'),
      marked(fa.pages.app.sections[2].body, 'نه سال دوم'),
    ],
  },

  delivery: {
    title: marked(fa.pages.delivery.title),
    intro: marked(fa.pages.delivery.intro, 'دقیقاً به چه کارتان می‌آید'),
    sections: [
      marked(fa.pages.delivery.sections[0].body, 'چیزی از ما نمی‌خواهید'),
      marked(fa.pages.delivery.sections[1].body, 'سایت سر جایش می‌ماند'),
      marked(fa.pages.delivery.sections[2].body, 'کسی در تیم شما بخواندش'),
      marked(fa.pages.delivery.sections[3].body, 'سه ماه بدون هزینه درستش می‌کنیم'),
      marked(fa.pages.delivery.sections[4].body, 'کمتر از ۶۰ کیلوبایت'),
    ],
  },

  /* The case study has no copy yet, so there is nothing to mark. It stays in
     the table rather than being special-cased at every call site. */
  work: {
    title: marked(fa.pages.work.title),
    intro: marked(fa.pages.work.intro),
    sections: [],
  },
};

export const emphasis = {
  hero: {
    title: marked(fa.hero.title, 'می‌شود روی آن حساب کرد'),
    subtitle: marked(
      fa.hero.subtitle,
      'یک تیم کوچک در شیراز',
      'همان کسی است که کار را می‌سازد',
    ),
  },

  problem: {
    lead: marked(fa.problem.lead, 'اگر محتاط شده‌اید، حق دارید'),
    bridge: marked(fa.problem.bridge, 'این اتفاق نیفتد'),
  },

  services: {
    items: [
      marked(fa.services.items[0].body, 'سریع روی اینترنت ایران'),
      marked(fa.services.items[1].body, 'دور همان می‌سازیم'),
      marked(fa.services.items[2].body, 'فقط از آدم برمی‌آید'),
      marked(fa.services.items[3].body, 'همان سیستم نیست'),
    ],
  },

  process: {
    steps: [
      marked(fa.process.steps[0].body, 'رایگان و بدون تعهد'),
      marked(fa.process.steps[1].body, 'چه چیزی ساخته می‌شود، چه چیزی نمی‌شود'),
      marked(fa.process.steps[2].body, 'هفته‌ای یک گزارش کوتاه'),
      marked(fa.process.steps[3].body, 'یک جلسهٔ آموزش برای تیم شما'),
    ],
  },

  delivery: {
    /* Parallel to fa.delivery.items. Three of the six are marked: the two that
       decide whether you are locked in, and the one that costs us money. */
    items: [
      marked(fa.delivery.items[0]),
      marked(fa.delivery.items[1], 'به نام خودتان است'),
      marked(fa.delivery.items[2], 'هیچ‌چیز نزد ما قفل نمی‌ماند'),
      marked(fa.delivery.items[3]),
      marked(fa.delivery.items[4]),
      marked(fa.delivery.items[5], 'بدون هزینه'),
    ],
  },

  pricing: {
    time: marked(fa.pricing.time, 'سه تا شش هفته', 'از دو ماه به بالا'),
    guarantee: marked(fa.pricing.guarantee, 'هزینهٔ پنهان نداریم'),
  },

  faq: {
    items: [
      marked(fa.faq.items[0].a, 'واسطه‌ای در کار نیست'),
      marked(fa.faq.items[1].a),
      marked(fa.faq.items[2].a, 'ترجیح می‌دهیم کاری را نپذیریم'),
      marked(fa.faq.items[3].a),
    ],
  },

  contact: {
    body: marked(fa.contact.body, 'در یک روز کاری جواب می‌دهیم'),
  },

  pages,
} as const;

const isMark = (value: unknown): value is Mark =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Mark).text === 'string' &&
  Array.isArray((value as Mark).phrases);

const collect = (node: unknown, path: string, found: string[]) => {
  if (isMark(node)) {
    for (const phrase of node.phrases) {
      if (!node.text.includes(phrase)) found.push(`${path}: «${phrase}»`);
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child, index) => collect(child, `${path}[${index}]`, found));
    return;
  }

  if (typeof node === 'object' && node !== null) {
    for (const [key, child] of Object.entries(node)) {
      collect(child, path === '' ? key : `${path}.${key}`, found);
    }
  }
};

/**
 * Every marked phrase that is no longer inside the sentence it belongs to.
 *
 * Empty means every mark still lands. Called by scripts/prerender.mjs, which
 * fails the build on anything it returns — see the note at the top of this
 * file. A phrase can go missing from an edit as small as a comma or a ZWNJ, and
 * neither is visible in a diff.
 */
export const unmatchedMarks = (): string[] => {
  const found: string[] = [];
  collect(emphasis, '', found);

  /* The page section lists are indexed by position against `fa.pages`, so a
     section added to the copy without a mark added here would be read past the
     end of this array at render time. Checked rather than defended against at
     the call site, because a missing entry is a thing to fix, not to tolerate. */
  for (const [key, marks] of Object.entries(pages)) {
    const sections = fa.pages[key as ServiceRouteKey].sections.length;
    if (marks.sections.length !== sections) {
      found.push(
        `pages.${key}.sections: ${marks.sections.length} entries for ${sections} sections`,
      );
    }
  }

  return found;
};
