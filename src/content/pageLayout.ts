import type { ServiceRouteKey } from './routes';

/**
 * How a service page is *presented*. No words, and no opinions about words.
 *
 * Every section on a service page currently renders identically, and one of
 * them is not like the others: the section that says where this service does
 * not work. `COPY-BRIEF.md` calls it "the middle beat no competitor writes",
 * and `CONTEXT.md` §6 calls volunteering the downside the fastest
 * trust-builder available. A page that argues that and then styles the
 * argument like every other paragraph is not making it.
 *
 * Which section that is, and which page gets a drawing, is a layout decision.
 * It lives here rather than in `fa.ts` for the same reason `emphasis.ts` does:
 * `fa.ts` is read by `jsonLd.ts` and `meta.ts` as well as by the page, so it
 * stays exactly what it is — the words — and presentation is pointed at it
 * from outside. Nothing here can change a single Persian character.
 */

/**
 * The drawings. One per section.
 *
 * ## This reverses "one per page at most", on request
 *
 * It used to read "one per page at most, and only where a picture argues", and
 * two pages had one. The brief now is a diagram per section, for comprehension.
 * The restraint that produced the old rule is not thrown away, it moves down a
 * level: each drawing still has to carry one idea from its own section, still
 * carries **no words**, and is still `aria-hidden` with the section's paragraph
 * as its caption. Delete every figure on the site and not one thing it says
 * goes missing — that test is what keeps a wordless drawing honest, and it is
 * unchanged.
 *
 * What is genuinely spent is quiet: fourteen drawings is more ink on the site
 * than `CONTEXT.md` §7 would have chosen on its own. Recorded here so the next
 * person knows it was a decision rather than a drift.
 *
 * ## The vocabulary every one of them is drawn in
 *
 * Right angles and 45° diagonals only, one stroke weight, butt caps, an 8×8
 * square for a node, and at most one accented line — the one the section is
 * actually about. They read right to left, because the page does. Same system
 * as `ServiceIcon`, drawn larger. See `src/components/PageFigure.tsx`.
 */
export type FigureKind =
  /** Five identical hand-made passes above one line that runs. */
  | 'repetition'
  /** Effort spent going out, and a bare return to exactly where it started. */
  | 'payback'
  /** A dimension line: the span someone put a number on before building. */
  | 'measure'
  /** A bounded system, and the step that has to leave it to get done. */
  | 'overflow'
  /** Three separate boxes brought down onto one line. */
  | 'connect'
  /** Two boxes on one baseline, one of them a fraction of the other. */
  | 'scale'
  /** A path that forks: repeated use one way, a single visit the other. */
  | 'decision'
  /** A device outside the bounded area, on a link that keeps breaking. */
  | 'offline'
  /** A staircase that has not stopped climbing. */
  | 'upkeep'
  /** What is held in your name, and the clear path out of it. */
  | 'ownership'
  /** One link cut, and the thing it was attached to still standing. */
  | 'detach'
  /** A page of ruled lines with one of them picked out. */
  | 'document'
  /** A bracketed window over the first stretch of a much longer run. */
  | 'window'
  /** A run that stops short of the line it is not allowed to cross. */
  | 'ceiling';

export type PageLayout = {
  /**
   * The index in `fa.pages[key].sections` of the section that says where this
   * does not work, or `null` where the page has none. `/delivery` has none —
   * it is a list of what you receive, and there is no "but not for you" in it.
   */
  readonly limitSection: number | null;
  /**
   * One drawing per section, in section order — this array is parallel to
   * `fa.pages[key].sections` and has to stay the same length as it. A short
   * array is not an error: the extra sections simply render without a figure,
   * which is the right failure for a decorative element. TypeScript cannot tie
   * the two lengths together, so the guard is this sentence and a glance.
   */
  readonly figures: readonly FigureKind[];
};

export const pageLayout: Record<ServiceRouteKey, PageLayout> = {
  /* ۰۲ «کجا جواب نمی‌دهد» is the limit.
     ۰۱ the weekly hand-made work — five passes above, one run below.
     ۰۲ the job that costs more to automate than it gives back: effort spent
        on the way out, nothing carried on the way home.
     ۰۳ the hours-per-month measured before anything is built. */
  automation: { limitSection: 1, figures: ['repetition', 'payback', 'measure'] },

  /* ۰۳ «بزرگ‌تر از یک سایت است» is the limit: it is where the page says a
     smaller thing may be the right thing.
     ۰۱ the ready-made system, and the step that leaves it for a spreadsheet.
     ۰۲ several separate programs brought onto one line.
     ۰۳ the two sizes on one baseline, with the smaller one accented — the page
        says buy the smaller thing if it solves it, so the drawing says it. */
  software: { limitSection: 2, figures: ['overflow', 'connect', 'scale'] },

  /* ۰۱ «اول این را بپرسید» is the limit and the fork — the one question on the
     site that is genuinely a decision, and the reason this page exists.
     ۰۲ work outside the office, on a connection that keeps dropping.
     ۰۳ the yearly step that never becomes the last one. */
  app: { limitSection: 0, figures: ['decision', 'offline', 'upkeep'] },

  /* No limit section — it is a list of what you receive. Five drawings for five
     things, each one the thing itself rather than an argument about it. */
  delivery: {
    limitSection: null,
    figures: ['ownership', 'detach', 'document', 'window', 'ceiling'],
  },

  /* The case study has no copy yet. It stays in the table rather than being
     special-cased at every call site. */
  work: { limitSection: null, figures: [] },
};
