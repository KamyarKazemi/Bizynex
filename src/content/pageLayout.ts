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

/** The drawings. One per page at most, and only where a picture argues. */
export type FigureKind =
  /** Five identical hand-made passes above one line that runs. */
  | 'repetition'
  /** A path that forks: repeated use one way, a single visit the other. */
  | 'decision';

export type PageLayout = {
  /**
   * The index in `fa.pages[key].sections` of the section that says where this
   * does not work, or `null` where the page has none. `/delivery` has none —
   * it is a list of what you receive, and there is no "but not for you" in it.
   */
  readonly limitSection: number | null;
  /** Which section carries the drawing, and which drawing. */
  readonly figure: { readonly section: number; readonly kind: FigureKind } | null;
};

export const pageLayout: Record<ServiceRouteKey, PageLayout> = {
  /* ۰۲ «کجا جواب نمی‌دهد» is the limit. The drawing sits with ۰۱, which lists
     the weekly hand-made work — five passes above, one run below. */
  automation: { limitSection: 1, figure: { section: 0, kind: 'repetition' } },

  /* ۰۳ «بزرگ‌تر از یک سایت است» is the limit: it is where the page says a
     smaller thing may be the right thing. No drawing — the argument here is
     about fit, and a picture of fit is a diagram of nothing. */
  software: { limitSection: 2, figure: null },

  /* ۰۱ «اول این را بپرسید» is both. It is the reason this page exists — it
     argues most readers should not buy an app — and it is the one question on
     the site that is genuinely a fork, so it is the one that draws. */
  app: { limitSection: 0, figure: { section: 0, kind: 'decision' } },

  delivery: { limitSection: null, figure: null },

  /* The case study has no copy yet. It stays in the table rather than being
     special-cased at every call site. */
  work: { limitSection: null, figure: null },
};
