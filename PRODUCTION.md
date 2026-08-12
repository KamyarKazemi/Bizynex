# PRODUCTION.md — state of play

The deployable state of this repository, what a production pass changed, and what
is still blocked on a human. Read `CLAUDE.md` for the engineering rules and
`CONTEXT.md` for the brand rules — both are binding and neither is superseded
by anything here.

Last full pass: **2026-08-10**, against branch `ove`.

---

## 1. Where this deploys

**Origin: `https://bizynex.vercel.app`.**

This was decided on 2026-08-10 and it reversed an earlier assumption. The repo
previously declared `https://bizynex.ir/` as canonical while being served from
the Vercel alias — a page that canonicalises to a domain nobody controls tells
Google to index a URL that does not resolve, which quietly de-indexes it. That
is fixed; there are now zero references to `bizynex.ir` in the built output.

The origin is duplicated in exactly **three** places. Change one, change all three:

1. `src/content/site.ts` — the `url` constant
2. `index.html` — canonical, both hreflang, `og:url`, `og:image`, `twitter:image`
3. `public/robots.txt` — the `Sitemap:` line

`src/content/jsonLd.ts` and `scripts/prerender.mjs` both derive from the constant
and need no edit — verified, not assumed.

### If a custom domain arrives later

Change those three places, then in the Vercel dashboard add both the apex and
`www`, set the apex primary, and reinstate a `redirects` block in `vercel.json`
sending `www` **and** `bizynex.vercel.app` to the apex. The `redirects` key was
removed rather than left empty because a rule naming a domain that is not
attached to the project can never fire, and dead config reads as working config.

Do it in that order. Pointing the redirect at a domain before the origin
constant follows it will bounce live traffic to a host that is not serving.

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

1. **Origin** — flipped everything to `bizynex.vercel.app`; removed the dead
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

| Bundle (gzipped) | Before | After |
|---|---|---|
| Entry chunk | 81,503 B | 84,168 B |
| All JS except the three.js chunk | 117,382 B | 120,047 B = **117.2 KiB** (budget 120 KiB) |

Note the "before" column: it is **today's** measurement of the untouched tree,
not the 114,819 B recorded on 2026-08-10. The baseline had already drifted
+2.5 KiB from dependency updates before any of this was written. This pass adds
2.6 KiB and leaves 2.8 KiB of headroom, which is thin — read the budget as
120 KiB, because 120,047 B is 47 bytes over a decimal 120 kB and the next
feature will have to decide that question properly.

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
   `BreadcrumbList` exactly, a callout numeral in the margin, a numbered index
   that follows you down the page on `useActiveSection` — the same hook the
   header capsule uses — numbered sections, the other three pages, and the one
   action. The opening band and the body sit on the same declared grid, so the
   `h1` and the first `h2` share a start edge to the pixel (measured: 984.5px
   at 1440).

   `Reveal` never hides anything that was on screen when the page loaded, and
   the hidden state is only ever added by script in a browser. Server-rendered
   HTML contains no hidden content, so a blocked bundle is still the finished
   page.

### Verified in a real browser, not assumed

Chromium, against `vite preview`, at 360 / 768 / 1440 in both themes:

- Zero console errors or warnings on `/`, `/automation` and `/delivery` at all
  three widths; zero horizontal overflow.
- Keyboard: Tab → «خدمات», ArrowDown → first menu row, Tab → second row, Escape
  → back on the button with `aria-expanded="false"`. The closed panel is out of
  the tab order.
- `prefers-reduced-motion: reduce` — every mark fully drawn, no element left in
  the pending reveal state.
- JavaScript disabled — the page reads complete, the menu is `inert` and
  invisible, and the footer still carries all four links.

Still not measured, and still needing a real deploy: Lighthouse and field Core
Web Vitals.

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
- [ ] **Google Search Console**, then Bing (accepts a GSC import). On a
      `vercel.app` alias there is no DNS to hold a TXT record, so verify by meta
      tag or HTML file. Submit `https://bizynex.vercel.app/sitemap.xml`.
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
