# PRODUCTION.md — state of play

The deployable state of this repository, what a production pass changed, and what
is still blocked on a human. Read `CLAUDE.md` for the engineering rules and
`CONTEXT.md` for the brand rules — both are binding and neither is superseded
by anything here.

Last full pass: **2026-08-10**, against branch `ove`.

---

## 1. Where this deploys

**Origin: `https://bizynex.ir`.** Since 2026-08-13, when the domain was
attached to the project and its nameservers pointed at `ns1.vercel-dns.com` /
`ns2.vercel-dns.com`.

This has moved twice, so keep the history straight rather than re-litigating it.
The repo originally declared `bizynex.ir` while being served from the Vercel
project alias — a page that canonicalises to a domain nobody controls tells
Google to index a URL that does not resolve, which quietly de-indexes it — so
on 2026-08-10 everything was flipped to that alias. The domain now exists, so
it has flipped back.

**Audited 2026-08-13.** Every absolute URL in `dist/` was extracted and grouped
by host: the only one belonging to this site is `bizynex.ir`. On all five pages
the canonical, `og:url`, both `hreflang`s and the JSON-LD `url` are the same
string, and that string is in the sitemap. No page is missing from the sitemap
and the sitemap names no page that does not exist. (`bit.ly` also appears, in
`index-*.js`: it is Immer's minified-error link inside Redux Toolkit. Not ours,
not a reference to anything.)

The rule both moves share: **the canonical may only ever name a hostname that
actually resolves to this site.**

The origin is duplicated in exactly **three** places. Change one, change all three:

1. `src/content/site.ts` — the `url` constant
2. `index.html` — canonical, both hreflang, `og:url`, `og:image`, `twitter:image`
3. `public/robots.txt` — the `Sitemap:` line

`src/content/jsonLd.ts` and `scripts/prerender.mjs` both derive from the constant
and need no edit — verified, not assumed.

### Domain redirects are the dashboard's job, not this file's

`vercel.json` carries **no `redirects` key**, and adding one for `www` or for
the project alias is a mistake that has now been made twice in this repo. Read
this before making it a third time.

Vercel's dashboard already redirects every attached domain to whichever one is
marked primary. A rule here does the same job from a second place, and the two
cannot be kept in agreement — the dashboard's setting is invisible from the
repository. On 2026-08-13 the dashboard was sending the apex one way while a
rule in this file sent it back, and the site answered every request with
`ERR_TOO_MANY_REDIRECTS`. It was live in that state.

So: **attach `bizynex.ir` and `www.bizynex.ir` in the dashboard, mark the apex
primary, and let Vercel do the redirecting.** One system owns it, and it is the
system that can actually see which domains exist.

Nothing is lost in search terms. Every page already declares
`https://bizynex.ir` as its canonical, its `og:url`, both `hreflang`s and its
JSON-LD `url`, and the sitemap agrees with all of them — which is what a
crawler consolidates on.

---

## 2. Verified state

Every number below was measured on 2026-08-10, not estimated. Re-measure rather
than trusting these after any dependency change.

| Command | Result |
|---|---|
| `npx tsc -b` | exit 0 |
| `npx eslint .` | exit 0 |
| `npm run build` | exit 0 — prerender reports "dist/index.html is the full page" |
| `npm run check:contrast` | exit 0 — 26 pair checks, thinnest 4.98:1 |

| Bundle (gzipped) | Size |
|---|---|
| Entry chunk — **what first paint actually costs** | **78,902 B** |
| All JS excluding the three.js chunk | 114,819 B = 112.1 KiB (budget: 120 KB) ✓ |
| `wordmark` chunk — three.js + gsap, lazy | 160,136 B |
| CSS | 7,177 B |

three.js is confirmed **absent** from the entry chunk (`WebGLRenderer` does not
appear in it). The 500 kB chunk-size warning during build refers to the lazy
`wordmark` chunk and is expected — it is never on the critical path.

Prerendered `dist/index.html`: exactly one `<h1>`, seven `<h2>`, twelve `<h3>`,
no skipped levels, all four FAQ questions present as real text, one JSON-LD
block that parses with three `@graph` nodes.

**Not measured, and needs a real deploy:** Lighthouse, field Core Web Vitals,
and the 360/768/1440 responsive pass. `CLAUDE.md` §9 requires the last of these
and it has never been run against this tree.

---

## 3. What the 2026-08-10 pass changed

Nine steps, each verified before the next began.

1. **Origin** — flipped everything to the Vercel project alias; removed the dead
   `www.bizynex.ir` redirect; dropped two `Content-Type` overrides Vercel may
   append rather than replace; gave `site.webmanifest` a cache policy; dropped
   `preload` from HSTS (nobody submitted the domain to hstspreload.org, and
   `preload` is slow to reverse); ignored `graphify-out/`.
2. **TypeScript strict** — `"strict": true` in both tsconfigs. It was already
   clean: zero errors, so no `any` and no `!` were added to get there. Removed
   `@react-three/fiber`, which nothing imported (−15 packages). Pinned Node via
   `engines` and `.nvmrc` — **eslint is the binding constraint, not vite**:
   `^20.19 || ^22.13 || >=24`, which excludes 22.12.x and all of 23.x.
3. **Accessibility** — the opening screens' skip and mute controls measured
   **2.14:1** against a 4.5:1 floor, and the skip control is the only deliberate
   way out of the opening. Root cause was both openings reaching past the
   semantic token layer into the palette layer, so the fix was a new always-dark
   `--color-opening-*` sub-layer in `src/styles/tokens.css` — one place instead
   of three. Now 5.97:1. Also: logical properties throughout, and
   `aria-disabled` instead of `disabled` on the pull button so a keyboard
   visitor does not lose focus to `<body>` for the 1.75s exit.
4. **WebGL robustness** — neither scene handled `webglcontextlost`. Because
   context loss is not a React error, `ErrorBoundary` never fired, the SVG
   fallback stayed at `opacity-0`, and the hero was a blank rectangle *forever*
   while the loop kept rendering into a dead context. Mobile Safari drops
   contexts routinely. Now routed to the existing failure path. Also closed
   three post-unmount leaks and made DPR resample on resize.
5. **Performance** — both openings were statically imported and parsed before
   first paint on every visit, including the majority that never see one
   (returning visitors, reduced-motion users, every crawler). Now lazy:
   **−4.3 KB off the critical path**, and `react-icons` plus both Web Audio
   synths left the entry chunk with them.
6. **Metadata and icons** — `apple-touch-icon.png` and `icon-96.png` were **not
   opaque** despite comments claiming otherwise; iOS composites a transparent
   touch icon onto black, losing the mark. Fixed, with a caveat worth knowing:
   sharp applies `flatten` in *pipeline* order, not call order, so chaining it
   before `resize` silently does nothing — it needs a second `sharp()` pass.
   Added media-scoped `theme-color` for both schemes; removed the legacy `geo.*`
   tags.
7. **Hygiene** — deleted three orphaned `fa.ui` keys, four dead props/variants,
   corrected six stale comments that contradicted the code, derived the footer
   year (`useGrouping: false` is load-bearing — Node 24 renders `۲٬۰۲۶`
   otherwise), fixed `useActiveSection` picking the last intersecting entry
   rather than the topmost, and made the overture countdown pause on focus or
   hover to satisfy WCAG 2.2.1.
8. **Verification** — the table in §2.
9. **This document.**

**No Persian copy was changed at any point.** Three unused `fa.ui` *keys* were
deleted; no rendered string's wording was touched. That rule held throughout and
must keep holding — see `CLAUDE.md` §2.

---

## 3b. The 2026-08-11 pass — multi-page foundation

The site is no longer one page, structurally. Five routes exist, are
prerendered, and are held behind a `draft` flag until their Persian is written.
Four of the five are **written and published**: `/automation`, `/software`,
`/app` and `/delivery`. Their Persian was drafted by Claude under the workflow
`CONTENT-PLAN.md` §3 already set — "Claude drafts, founder corrects in place" —
and **has not had a native read-through yet**. `/work`, the case study, stays
draft: it is waiting on a real measurement, not on words.

**See `COPY-BRIEF.md`** for what to check in each page and what is still open.

- **Routing without a router.** `src/content/routes.ts` is the one table. Every
  route prerenders to its own file and `cleanUrls` serves it, so choosing a page
  is a lookup, not a library. `CLAUDE.md` §3's "no router until there's a second
  page" is satisfied without adding a dependency.
- **The draft flag is the safety.** A draft route is not built, not linked, not
  in the sitemap, and reachable only in `npm run dev`. The build *refuses* to
  publish a route whose copy slots are empty and names the missing field —
  verified by making it fail on purpose.
- **Per-route head and schema.** `scripts/prerender.mjs` rewrites nine head tags
  per page and each throws if its target is missing, so renaming a tag in
  `index.html` breaks the build rather than silently shipping a page that
  declares home's URL as its canonical. Service pages get their own `WebPage`,
  `Service` and `BreadcrumbList`; Organization and WebSite are re-emitted with
  the same `@id` so a crawler reading one page knows it is the same company.
  The breadcrumb reverses an earlier "a breadcrumb of length one is noise"
  decision, which expired the moment sub-pages existed.
- **Canonical and sitemap cannot diverge.** Both read the same string from
  `src/content/meta.ts`. A canonical that disagrees with the sitemap is the
  most common way a multi-page site loses pages.
- **The price question is back in the SERP.** `FAQPage` went from 4 to 6
  questions: the two pricing/timeline questions were recovered verbatim from
  git history and paired with the pricing section's existing answers. All six
  answers were verified to be rendered on the page — honest markup, not a
  keyword play. **This pairing needs a founder read-through** (see
  `COPY-BRIEF.md`).
- **Telegram is in the entity graph.** It was the one provable identity this
  company has and it was missing from `sameAs`. Now there plus a `ContactPoint`.
- **Speed is now enforced, not remembered.** `npm run check:weight` measures the
  readable-without-JS payload of every emitted page against a 60 KiB budget and
  **fails the build** if it is exceeded. Currently 53.4 KiB. This is what makes
  a speed claim safe to put in copy.
- **Favicon replaced.** The placeholder SVG is gone. Every icon is now cut from
  the mark alone rather than the full lockup, whose wordmark was an illegible
  smudge at 96px and absent at 32px. Raster rather than vector because the only
  masters in this repo are PNG and a hand-traced woven mark is a redrawn mark.

---

## 3c. The 2026-08-12 pass — emphasis, the header menu, the service pages

Three changes, asked for together, and the brief was explicitly *not* to stay
inside the motion restraint in `CLAUDE.md` §8 and `CONTEXT.md` §7. The hard
constraints were kept: self-hosted, RTL-first, reduced motion honoured, contrast
floor measured, nothing readable withheld behind script. What was spent is the
motion budget and some of the teal budget, deliberately and in the open.

**Measured after, not estimated** (2026-08-12):

| Command | Result |
|---|---|
| `npx tsc -b` | exit 0 |
| `npx eslint .` | exit 0 |
| `npm run build` | exit 0 |
| `npm run check:contrast` | exit 0 — 32 pair checks, thinnest 4.30:1 |
| `npm run check:weight` | exit 0 — worst page 55.1 KiB of 60 |

| Bundle (gzipped) | Before | After first pass | After the service-page pass |
|---|---|---|---|
| Entry chunk | 81,503 B | 84,168 B | 84,838 B |
| All JS except the three.js chunk | 117,382 B | 120,047 B | 120,718 B = **117.9 KiB** (budget 120 KiB) |

Note the "before" column: it is **today's** measurement of the untouched tree,
not the 114,819 B recorded on 2026-08-10. The baseline had already drifted
+2.5 KiB from dependency updates before any of this was written. Both passes
together add 3.3 KiB and leave **2.1 KiB of headroom**, which is thin.

⚠ **Read the budget as 120 KiB, and decide that properly before the next
feature.** 120,718 B is under 120 KiB (122,880 B) and over a decimal 120 kB.
`CLAUDE.md` §6 says "120 KB" and this document has always converted to KiB, so
the KiB reading is the one in force — but it is now the only reading that
passes, which makes it a decision rather than a formatting habit. The cheapest
place to buy headroom back is splitting `ServicePage` out of the entry chunk:
a home-page visitor never needs it and vice versa.

### What changed

1. **Important phrases draw themselves on.** A teal rule sweeps under a marked
   phrase and a wash follows it in, once, when the reader reaches it. Two
   registered custom properties rather than one `background-size` transition,
   because the rule and the wash are deliberately out of step.

   The phrase list is `src/content/emphasis.ts` and **`fa.ts` was not touched by
   it**. That is not tidiness: `jsonLd.ts` and `meta.ts` copy those same strings
   into the structured data and into `<title>`, so markup in the copy would end
   up in a search result. Each entry carries its sentence *and* its phrases, and
   `unmatchedMarks()` — wired into the prerender the same way `emptyCopySlots`
   is — fails the build and names any phrase a copy edit has left pointing at
   nothing. A ZWNJ is invisible in a diff; this is what catches it.

   `--color-mark` is a flat colour rather than teal at low alpha, so `ink` on it
   is a pair `check:contrast` can measure: 12.18:1 light, 9.46:1 dark.

2. **The header capsule opens the four service pages.** «خدمات» is now a
   `<button aria-expanded>`; the destination it used to have is the first row
   inside the panel. The capsule still means one thing — where you are — and
   the panel is a second surface below it, so the note in `Footer.tsx` that
   argued against this is answered rather than ignored.

   The whole panel is in the prerendered HTML of every page, `inert` when
   closed, which is why every page now carries a real link to every other page
   in its markup. Closed is `opacity-0`, **not** `invisible`: `visibility` is
   transitionable and computes as `hidden` for the first frame, so the
   down-arrow's "open, then move focus in" would have called `focus()` on an
   element the browser still considered unfocusable. That cost an hour; it is
   commented in place.

3. **The four service pages are documentation pages now.** They were an `h1`
   and three paragraphs. They are now: a breadcrumb matching the
   `BreadcrumbList` exactly *(both the breadcrumb and the page's own callout
   numeral were removed in the third pass below — the numeral is the part that
   was wrong)*, a callout numeral in the margin, a numbered index
   that follows you down the page on `useActiveSection` — the same hook the
   header capsule uses — numbered sections, the other three pages, and the one
   action. The opening band and the body sit on the same declared grid, so the
   `h1` and the first `h2` share a start edge to the pixel (measured: 984.5px
   at 1440).

   `Reveal` never hides anything that was on screen when the page loaded, and
   the hidden state is only ever added by script in a browser. Server-rendered
   HTML contains no hidden content, so a blocked bundle is still the finished
   page.

### The second pass on the service pages, same day

A follow-up brief: overhaul the four pages again, **appearance and styles only —
no content changes**. Nothing below writes, edits, reorders or truncates a
Persian word; every new decision lives outside `fa.ts` in
`src/content/pageLayout.ts`, which holds no words at all.

- **The limit section is no longer styled like the others.** Each page has one
  section that says where this service does not work — `COPY-BRIEF.md` calls it
  the beat no competitor writes — and it was rendering identically to every
  other paragraph. It is now a bounded block on `surface`, capped at the
  reading measure plus its own padding, with the same 2px accent rule on its
  start edge that the index uses to say "here". `/delivery` has none and is
  marked as having none rather than being made to have one.
- **Section headers use the home page's measure line**: callout, heading, and a
  hairline running off to the end of the row. One structural device, repeated.
  Each heading is now a link to its own section, and its accessible name is the
  heading text — which is why there is no ¶ glyph needing a label of its own.
- **The index reports progress**, filling one section at a time as the reader
  goes. It fills in whole items rather than by scroll fraction so the fill
  always lands on a boundary with nothing measured.
- **Two drawn figures**, on `/automation` and `/app` only — the two pages where
  a picture carries an argument. Five hand-made passes above one line that
  runs; and the fork between something opened again and again and something
  visited once. They carry **no words**: a labelled diagram is a second piece
  of copy written by whoever drew it. Both are `aria-hidden`, each sits in the
  section whose paragraph is already its caption, and every path is drawn by
  default — the stroke animation is only ever added to a figure that was off
  screen. `pathLength="1"` is what makes a 20px tick and a 200px run take the
  same time to draw.
- **Every band sits on one grid.** The opening, the sections, the sibling links
  and the closing action all start on the same edge, and the sibling links now
  have the same anatomy as the header menu's rows, because they are the same
  four pages and two presentations of one set is one set learned twice.
- `useArrival` now holds the "only stage something that is off screen" logic
  that `Reveal` and the figures both need — the third use of it, which is when
  `CLAUDE.md` §1 says to abstract, not before.

### Verified in a real browser, not assumed

Chromium, against `vite preview`, at 360 / 768 / 1440 in both themes:

- Zero console errors or warnings on `/`, `/automation` and `/delivery` at all
  three widths; zero horizontal overflow.
- Keyboard: Tab → «خدمات», ArrowDown → first menu row, Tab → second row, Escape
  → back on the button with `aria-expanded="false"`. The closed panel is out of
  the tab order.
- `prefers-reduced-motion: reduce` — every mark fully drawn, all ten figure
  strokes drawn, no element left in the pending reveal state.
- JavaScript disabled — the page reads complete, the figures are finished
  drawings, the section headings are still links, the menu is `inert` and
  invisible, and the footer still carries all four links.
- Focus ring on a section heading link measured at 2px solid `#0e7a72`.

Still not measured, and still needing a real deploy: Lighthouse and field Core
Web Vitals.

### The third pass on the service pages, same day — the top of the page

Asked for: clear the trail off the top of every page, and fix whatever else is
wrong with the four. No Persian was written or reworded; two now-unrendered
`fa.ui` *keys* were deleted (`breadcrumb`, `home`), which is the same rule §3a
held.

- **The margin column carried two different counts.** The opening band showed
  the page's own number among the four service pages — «۰۴» on `/delivery` —
  on the same text edge, in the same style, in the same column as the section
  numerals below it. That column then read ۰۴ ۰۱ ۰۲ ۰۳ ۰۴ ۰۵ ۰۶, in which the
  two «۰۴»s are a page and a section. The page number is gone from the page;
  it stays in the header menu and the sibling links, where the four are listed
  together and it counts something the reader can see. The numerals on a
  service page are now one sequence: its sections, then the action after them.
- **The visible breadcrumb is gone.** «صفحهٔ اصلی / <page>» said what the
  header, the footer and the URL each already say, and it sat in the one place
  on the page that should open on the heading. The `BreadcrumbList` in
  `src/content/jsonLd.ts` **stays** — it is what a crawler prints above a
  result in place of a bare URL, it describes a hierarchy the site genuinely
  has, and with the visible trail gone there is nothing left for it to
  disagree with. Reversing this again means putting the trail back, not
  deleting the node.
- **A draft can no longer be listed.** `publishedRoutes()` keeps drafts in
  `npm run dev` so the founder can open one, and `servicePageRoutes()` was
  handing `/work` — whose title is still `''` — to the header menu, the footer
  and the sibling grid. All three rendered a link with nothing inside it, and
  because the callouts are positional, a stray «۰۵» beside the blank card.
  `servicePageRoutes()` now drops a route with no title. Production was never
  affected; the dev view now matches it, numerals included.
- **`aria-current="location"`**, not `"true"`, on the in-page index rows.

Measured after (2026-08-12): `npx tsc -b` exit 0 · `npx eslint .` exit 0 ·
`npm run build` exit 0 · `npm run check:contrast` exit 0 · `npm run
check:weight` exit 0. Entry chunk 85.75 kB → **85.66 kB** gzipped, and each
service page lost ~0.1 KiB of readable-without-JS payload; worst page is still
`index.html` at 55.3 KiB.

Verified in the browser at 360 / 1440, both themes, on all four pages: no
horizontal overflow, no console errors, the `h1`, every `h2`, the sibling band
and the closing action all still start on one edge (measured 984px at 1440),
the empty margin cell is `display: none` below `lg` so the mobile stack opens
on the heading, and zero empty links anywhere in the document. Built output
checked directly: no «مسیر صفحه» in `dist/delivery.html`, `BreadcrumbList`
still present, canonical unchanged, no `/work` link.

**Not re-verified in this pass** (untouched by it, verified in the second):
keyboard traversal of the header menu, `prefers-reduced-motion`, and the
JavaScript-disabled read.

### The fourth pass, same day — «صفحه‌های دیگر» centred, and a drawing per section

Asked for: centre the «صفحه‌های دیگر» band and put it on the home page too, and
give every section a diagram. No Persian was written or reworded; no new copy
string was added — the band's heading is the `fa.ui.otherPages` that already
existed.

- **The band is one component now**, `src/components/OtherPages.tsx`, rendered
  by both `ServicePage` and `HomePage`. `CLAUDE.md` §1 says no abstraction
  until the third occurrence and this is the second; it is a component anyway
  because it is not an abstraction over variation — it is one block that has to
  stay *identical* in two places, and thirty duplicated lines of JSX is the
  version of that which drifts. The column count follows the card count (three
  on a service page, four on home) and both class strings are written out in
  full, because Tailwind scans source text.
- **Centred, and off the two-column grid.** On a service page the band used to
  sit in the reading column, leaving the entire 13rem margin column empty
  beside it and hanging the block visibly off one side. It now spans the
  container and centres, cards included. This is the one element on the site
  allowed to break the start-alignment rule: it is not part of the argument
  above it, it is the way out of it.
- **The home page carries it, after «خدمات».** That fixes something real: the
  four service pages were reachable from the header panel and the footer and
  from nothing a reader scrolling the home page would ever meet. It is
  deliberately *not* a `Section` and not numbered — `SECTION_IDS` is the page's
  seven-part argument and `jsonLd.ts` builds `hasPart` by walking it, so an
  eighth entry there would claim the navigation is a chapter. No structured
  data changed.
- **Fourteen drawings, one per section**, up from two. This reverses
  `pageLayout.ts`'s "one per page at most, and only where a picture argues" on
  request, and the reversal is recorded in that file rather than quietly
  applied. `figure: {section, kind}` became `figures: FigureKind[]`, parallel
  to the section list. The restraint moves down a level rather than being
  dropped: every drawing carries one idea from its own section, still carries
  **no words**, is still `aria-hidden` with the section's paragraph as its
  caption, and still passes the test that deleting every figure loses nothing
  the page says. Same vocabulary throughout — right angles and 45° diagonals,
  one stroke weight, an 8×8 square for a node, at most one accented line, read
  right to left.

  What is genuinely spent is quiet. Fourteen drawings is more ink than
  `CONTEXT.md` §7 would have chosen; it was a decision, not a drift.

Measured after (2026-08-12): `npx tsc -b` exit 0 · `npx eslint .` exit 0 ·
`npm run build` exit 0 · `npm run check:contrast` exit 0 — 32 pairs, thinnest
4.30:1 · `npm run check:weight` exit 0.

| | Third pass | After this one |
|---|---|---|
| Entry chunk (gzip) | 85,628 B* | **86,600 B** |
| JS excl. three.js chunks | — | **91,858 B = 89.7 KiB** (budget 120 KiB) |
| Worst page, readable without JS | 55.3 KiB | **55.4 KiB** (budget 60) |
| Service pages | 49.7–50.0 KiB | **50.1–50.5 KiB** |

\* The JS figure is measured here as gzip level 9 over `dist/assets/*.js` with
`wordmark`, `HeroScene` and `OvertureScene` excluded as the three.js chunks.
That is a **different set** from the 120,718 B recorded for the second pass,
which the §3c note flagged as leaving only 2.1 KiB of headroom — on this
measurement there is ~33 KiB, and even counting `HeroScene` in it is 111.6 KiB.
Before the next feature, settle which set the 120 KiB budget covers; the two
readings disagree by more than any single change is likely to cost.

Verified in the browser at 360 and 1440, both themes, on all five pages: every
one of the 14 figures renders with its geometry inside its own viewBox
(measured per path with `getBBox`), section count equals figure count on all
four service pages, the band centres in the container, its grid is 4 columns on
home / 3 on a service page / 1 at 360px, no horizontal overflow anywhere, no
console errors. Built output checked directly: 5 SVGs on `/delivery`, 3 on each
of the other three, the centred container and the correct column variant on
every page, and `hasPart` unchanged.

**Not re-verified in this pass:** keyboard traversal of the header menu,
`prefers-reduced-motion` across the twelve new figures, and the
JavaScript-disabled read. The figures use the same `useArrival` path the two
existing ones do, which is why this is a low risk rather than none.

---

## 3d. The 2026-08-13 pass — the empty column beside «هزینه و زمان»

The home page's prose sections are the reading measure inside a 76rem page, so
above `lg` each one leaves ~34rem of blank paper beside it. That is not
restraint, it is an unfinished column, and the pricing section was the one
called out. `src/components/PriceRange.tsx` now fills it.

**What it draws, and why it is not decoration.** `fa.pricing` makes one
argument: a public range is either so wide it says nothing or puts you in a
category you are not in, so we publish none — three things move the number, and
what you get is a figure in writing that then stops moving. That is a shape:

- the wide span at the top is the published range, at the width that says
  nothing;
- the rails close inward in **exactly three steps**, a node sitting on each —
  the same three drivers the paragraph names, and the same count, so the drawing
  and the sentence can be checked against one another;
- a marker hunts across the range and each pass is shorter than the last,
  because the rails have closed behind it. **The amplitude is the argument**;
- it lands, the number is written under it, and a bracket closes. Nothing moves
  again.

Wordless and `aria-hidden` like every other drawing here, with the paragraph
beside it as its caption. Delete it and the section loses nothing it says.

**The motion.** ~2.8s, once, on arrival, and never again — a figure that keeps
moving after it has made its point is an advert. Static parts reuse the existing
`.figure-stroke`; the only new CSS is `.price-settle` (the number and its
bracket, delayed past the landing) and one `@keyframes`. No new dependency, no
JavaScript beyond the `useArrival` the drawings already use.

Every move in the keyframes is horizontal **or** vertical, never both. That is
the site's right-angle grammar, and it is also load-bearing: the first version
interpolated diagonally between levels and **clipped the right rail by 7.4
units** on the way down, because a diagonal crosses a step while still carrying
the wider level's offset. Caught by seeking the animation with
`getAnimations()` and measuring the marker against the rails every 10ms — not
by looking at it. The offsets are the funnel's own half-widths, tabulated in
`src/index.css` beside the keyframes; minimum clearance is now **10 units**, at
the level-3 drop, exactly where the table predicts.

**Resting state is the finished frame.** No `data-draw` — JavaScript blocked,
reduced motion, or a figure already on screen at load — leaves the marker
sitting on the number and the bracket closed. Verified against a freshly
injected element with no transition history, in both the bare and `pending`
cases. All 12 paths are in the prerendered HTML.

Measured after (2026-08-13): `npx tsc -b` exit 0 · `npx eslint .` exit 0 ·
`npm run build` exit 0 · `check:contrast` exit 0 · `check:weight` exit 0.

| | Before | After |
|---|---|---|
| Entry chunk (gzip) | 86,600 B | **86,890 B** |
| JS excl. three.js chunks | 91,858 B | **92,140 B = 90.0 KiB** (budget 120) |
| CSS (gzip) | 8.20 kB | **8.44 kB** |
| `index.html`, readable without JS | 55.4 KiB | **55.9 KiB** (budget 60) |

Verified at 360 and 1440 in both themes: the prose column stays at the reading
measure (544px) on the same start edge as the `h2`, the figure centres in the
480px that was empty and its vertical centre matches the prose's to the pixel,
it stacks below the text at 360 with no overflow, and both themes resolve to the
contrast-safe tokens (rails `ink-soft`, accent `#0e7a72` light / `#4fd6c7` dark).

**Still empty, and the same shape of problem:** `Problem`, `Delivered` and
`Contact` are also measure-width prose in a 76rem page. Each needs its own idea
rather than a repeat of this one, so none was invented here.

---

## 3d. The 2026-08-13 pass — the domain, and touch

**The origin moved to `bizynex.ir`.** All three places, plus the `www` redirect.
See §1, including the one redirect deliberately not added yet. Verified: zero
occurrences of the old alias anywhere in `dist/`, five canonicals and five
sitemap `<loc>`s on the new origin, and the JSON-LD `@id`s with them.

**The header does not condense on a phone.** This is the real fix, and it
replaces a smaller one that was aimed at the wrong thing.

The condensed pill hides two of the three links, and on a mouse that costs
nothing: the whole strip returns the instant the pointer arrives over it, before
any click. A phone has no such moment. There, condensing put navigation behind
a gesture that nothing on screen advertised — a visitor who wanted «تماس» had
first to work out that the one word they could see was a door. That is not a
subtle flaw; it is the nav not working.

So the pill now condenses only where `(hover: hover) and (pointer: fine)`
holds, subscribed to with `useSyncExternalStore` because a tablet gaining a
keyboard case and a laptop losing its mouse both change the answer mid-visit.
The capsule still travels between the three links on every device — reporting
where the reader is never depended on hiding anything.

**Measured on emulated touch devices:** the whole pill is 232px wide at 320,
360, 390 and 414px viewports — it fits everywhere, with no horizontal overflow
and all three items on screen. One tap goes to «تماس», one tap to «روش کار»,
one tap opens the خدمات panel, one tap on a row inside it opens that page.
Desktop is untouched: 83px condensed, 223px on hover, back to 83px when the
pointer leaves, and two tabs still expand it.

**Touch on a device that does still condense** — a touchscreen laptop, a tablet
with a mouse paired — opens the pill on `pointerdown` rather than on a completed
tap. Three things had to be true at once, and each needed its own mechanism:

- **The touch that opens the nav must not also follow the link under it.** The
  pointerdown opens the pill, which is a render, so `isCondensed` is already
  false by the time the click arrives. `openedByTouch` is a ref that records
  what the pill *was* when the finger went down.
- **It must not open the خدمات panel either.** That control is a button, not a
  link, so `preventDefault` does not stop it — the capture handler calls
  `stopPropagation` as well.
- **Reaching for the theme toggle must not throw the nav open.** It did, and not
  because of anything above: tapping a button focuses it, focus bubbles, and the
  pill's `onFocus` opened. The fix is that focus only expands the pill when it
  is `:focus-visible` — which is exactly the difference between a keyboard
  arriving and a finger landing.

Measured on an emulated Pixel 7 with real touch events: condensed nav 71px wide
with one item on screen → one tap → 187px with four items, URL unchanged. Second
tap navigates. خدمات opens the panel; a row in it navigates. The theme toggle
changes the theme and leaves the nav at 71px. Keyboard is unchanged: two tabs
still expand the pill (83px → 223px) with the focused control fully inside the
window.

---

## 4. Blocked on a human — an agent cannot do these

Ordered by cost of getting them wrong.

- [ ] **Read the four new service pages aloud.** Their Persian is a Claude
      draft awaiting correction in place — same arrangement as the home page
      before its overhaul. `COPY-BRIEF.md` lists the four sentences to check
      hardest and the four things the draft is least sure about. `/delivery` is
      the strongest page; correct that one first.
- [ ] **The emphasis marks are an editorial call, not a technical one.**
      `src/content/emphasis.ts` decides which words the page leans on, and
      emphasis is voice. No Persian was written or altered to build it, but
      choosing what to emphasise is a founder's judgement. `COPY-BRIEF.md` has
      the two rules that were held while choosing, and moving a mark is a
      one-line edit.
- [ ] **Six new strings.** Four menu blurbs, one per service page, plus six
      `fa.ui` labels. The blurbs are new Persian written by Claude under the
      same «Claude drafts, founder corrects» arrangement as the pages
      themselves — they are listed in `COPY-BRIEF.md` for a read-through.
- [ ] **The case study (`/work`).** Blocked on a real measured outcome, not on
      copy. `COPY-BRIEF.md` §05 lists what to capture while the next project
      runs rather than reconstructing it afterwards.
- [ ] **Native Persian read-through of `src/content/fa.ts`.** The file still
      carries its own `NEEDS A NATIVE READ-THROUGH BEFORE LAUNCH` warning, and
      its ~840 built words are the entire product — every heading, every FAQ
      answer, and via `jsonLd.ts` every string in the structured data. Copy is
      the product here.
- [ ] **`site.socialProfiles`** — currently `[]`, so `sameAs` is absent from the
      structured data entirely and «بیزینکس» stays a string on a page rather
      than an entity Google can hold an opinion about. Highest-value SEO item
      that is not already done. Only list profiles that are actually maintained.
      Note `site.telegram` (`https://t.me/BizynexBot`) is **not** wired into
      `sameAs` — if that handle is public, add it to `socialProfiles` too.
- [ ] **`site.phone`** — `null`. E.164 (`+989…`). A phone number is a conversion
      device before it is a ranking signal. Add the visible `tel:` link and the
      `fa.ui` label in the same commit.
- [ ] **Meta description is 188 characters** (`index.html`). Google truncates a
      Persian snippet around 150–160, and the clause lost is «و بعد از تحویل هم
      می‌مانیم» — the strongest differentiator in the sentence. Shortening it is
      editing Persian prose, so it needs a founder, not a tool. At 160 it cuts
      cleanly on a word boundary; at 150 it cuts mid-word through «خبرتان».
- [ ] **Wordmark casing disagrees between the two openings.** A WebGL visitor
      sees all-caps `BIZYNEX` (`src/three/wordmark.ts:17`,
      `src/sections/Overture.tsx:269`); a non-WebGL visitor sees title-case
      `Bizynex` (`src/sections/Intro.tsx:6`). Visible branding decision.
- [ ] **A real contact address.** `bizynexservices@gmail.com` is emitted twice
      in the structured data. A free-mail address on a company that owns a
      domain is a small trust signal working against you.
- [ ] **Google Search Console**, then Bing (accepts a GSC import). Verify as a
      **domain property** with a TXT record — the domain has DNS now, and a
      domain property covers the apex, `www` and both protocols in one, which
      the URL-prefix method does not. Submit `https://bizynex.ir/sitemap.xml`.
- [ ] **Set the apex as the primary domain in Vercel**, with `www.bizynex.ir`
      attached alongside it. This is the *only* place domain redirection is
      configured — see §1 for the loop that results from doing it in two places
      at once.
- [ ] **Test `bizynex.ir` from a domestic connection**, fixed line and mobile
      data both, before it goes on anything printed. `CLAUDE.md` §2 exists
      because Iranian connections to foreign endpoints are throttled or
      blocked; self-hosting the fonts and assets fixed that for the assets, not
      for the origin, and Vercel's edge is a foreign host.
- [ ] **Google Business Profile** — needs a verifiable Shiraz address. For a
      local services business this is plausibly worth more than every other item
      here combined; it puts you in the map pack, above the organic results.
- [ ] **Lighthouse + the manual 360/768/1440 pass** against the deployed URL,
      keyboard-only, reduced motion on, WebGL disabled. Confirm the run never
      sees the intro cover — a Lighthouse UA contains `Chrome-Lighthouse`, which
      the bypass matches on `lighthouse`.

---

## 5. Things that look like bugs and are not

Do not "fix" these. Each is deliberate and each has cost someone time already.

- **The pre-paint cover's ghost wordmark is 1.58:1** (`index.html`). It is
  `aria-hidden`, the same word is in the page proper, and the ghost look is the
  point. Commented in place.
- **No CSP.** A meaningful one needs `script-src 'self' 'unsafe-inline'` because
  of the two inline scripts, which defends against very little. Doing it
  properly means per-build script hashes. Deferred deliberately, not forgotten.
- **No catch-all rewrite to `index.html`.** It is the reflex fix for SPA routing
  and it is wrong here: it turns every mistyped URL into a `200 OK` serving the
  homepage, which Google indexes as a soft 404. The site is static and
  single-page; a real 404 is correct and Vercel already returns one.
- **Palette PNG, not WebP/AVIF, for the brand marks.** Measured: 1.8 KB vs
  7.8 KB AVIF vs 10.7 KB lossless WebP for flat two-colour artwork. WebP is the
  right default for photographs, not for this.
- **`icon-192.png` and `icon-512.png` are transparent** while
  `apple-touch-icon.png` and `icon-96.png` are opaque. That asymmetry is
  correct — the 192/512 pair are maskable launcher icons.
- **The bot check is duplicated** in `index.html` and
  `src/hooks/deviceSupport.ts`, and the 8-second cover failsafe is armed in one
  file and disarmed in another. Both say so in comments. The inline script must
  reach a verdict before any module exists. Two copies of six lines is the
  cheaper problem.
- **Redux for a capability-flag store**, despite `CLAUDE.md` §3 having once said
  "no state manager". That line has been amended to record the exception rather
  than left as a rule the codebase openly ignores.
- **FAQ rich results will not appear.** Since Google's August 2023 change they
  are limited to well-known government and health sites. The `FAQPage` markup
  still earns its place — Bing and LLM crawlers consume it, and the Q&A pairs
  are the cleanest description of the page. Expect "validates without error",
  not "eligible".

---

## 6. Verifying a change

```bash
npm run build          # tsc -b, client bundle, SSR bundle, then prerender
npm run check:contrast # fails the build floor for both themes
npm run lint
```

After touching any colour, run `check:contrast` — brand teal is the trap: it
looks correct on white and measures 3.23:1.

After touching the fonts, **rename the output files**. `/fonts/*` is served
`immutable` for a year and the filenames are not content-hashed, so shipping a
changed subset under the same name means returning visitors keep the old one for
up to twelve months. This is the one footgun in `vercel.json`.
