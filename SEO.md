# SEO.md — Bizynex

What was audited, what was changed, what is still open, and what has to happen
on the day the domain goes live. Read `CLAUDE.md` and `CONTEXT.md` first;
nothing here overrides either.

Last audit: 2026-08-07, against the current `main` working tree.

> **2026-08-13 — the domain arrived. The origin is `https://bizynex.ir`.**
> This has now moved twice, so the history is worth keeping straight: the
> document originally assumed `bizynex.ir`, that was corrected on 2026-08-09 to
> the Vercel project alias because the domain was not attached to the project,
> and it is now `bizynex.ir` again because it *is* — nameservers pointed at
> `ns1/ns2.vercel-dns.com`. `src/content/site.ts`, `index.html`,
> `public/robots.txt` and `vercel.json` all say `bizynex.ir`, and the `www` →
> apex redirect is back. The rule the two corrections share: **the canonical
> may only ever name a hostname that actually resolves to this site.** See §4
> for what a human still has to do in Search Console.

---

## 1. The honest headline

The technical SEO on this site was already better than most agency sites in this
market before this pass. Prerendered HTML, structured data generated from the
same object the page renders from, a real `<h1>`, semantic sections, correct
`lang`/`dir`, self-hosted subset fonts. That is the hard part and it was done.

What was missing was almost entirely **delivery and distribution** — caching
headers, a share card, an icon set, entity signals — plus one genuine risk in
the intro overlay. Those are fixed below.

**The ceiling that remains is not technical.** One page can rank for one query
cluster. Everything in section 6 is worth more than everything in sections 2–4
combined, and none of it is code.

---

## 2. What changed in this pass

### `vercel.json` — new

Vercel serves everything in `public/` with `Cache-Control: public, max-age=0,
must-revalidate` by default. That means the fonts, the logos and the share card
were being revalidated on every single visit — on the connections CLAUDE.md §2
tells us to assume, that is the difference between a fast repeat visit and a
slow one.

| Path | Policy | Why |
|---|---|---|
| `/assets/*` | `max-age=31536000, immutable` | Vite content-hashes these. Safe forever. |
| `/fonts/*` | `max-age=31536000, immutable` | **See the warning below.** |
| `/brand/*` | `max-age=2592000, stale-while-revalidate` | Not hashed, but changes rarely and is 3 KB. |
| `/` and `/index.html` | `max-age=0, must-revalidate` | A deploy has to be visible immediately. |

> ⚠ **The font filenames are not content-hashed.** `vazirmatn-regular-subset.woff2`
> is cached for a year under an `immutable` policy. If you ever re-run
> `npm run build:fonts` and the subset changes, **rename the output files** (e.g.
> `-subset-2.woff2`) and update `src/index.css` and the preload in `index.html`.
> Shipping a changed font under the same name means returning visitors keep the
> old one for up to twelve months. This is the one footgun in the config.

Also set:

- **No `redirects` key, deliberately.** Domain redirection belongs to the
  Vercel dashboard, which already sends every attached domain to whichever is
  primary. Configuring it here as well means two systems doing one job with no
  way to keep them in agreement, and on 2026-08-13 that shipped a live site
  answering `ERR_TOO_MANY_REDIRECTS` — the dashboard sent the apex one way, a
  rule in `vercel.json` sent it back. Attach the apex and `www` in the
  dashboard, mark the apex primary, and leave this file out of it.

  Nothing is lost: every page declares `https://bizynex.ir` as canonical,
  `og:url`, both `hreflang`s and its JSON-LD `url`, and the sitemap agrees.
  That is what a crawler consolidates on.

- **Security headers** (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, HSTS). Not ranking factors, but HSTS removes an HTTP→HTTPS
  redirect hop on repeat visits, which is a real latency win.
- **No CSP.** A meaningful one would need `script-src 'self' 'unsafe-inline'`
  because of the two inline scripts in `index.html`, which is a CSP that does
  not defend against much. Doing it properly means per-build script hashes.
  Deliberately deferred rather than shipped as theatre.

> ⚠ **Never add a catch-all rewrite to `index.html`.** It is the reflex fix for
> SPA routing and it is wrong here: it turns every mistyped URL into a `200 OK`
> serving the homepage, which Google indexes as a soft 404 and which dilutes the
> one page that matters. The site is static and single-page; a real 404 is the
> correct response and Vercel already returns one.

### Share card and icons — new

`index.html` carried a `TODO: a real 1200×630 share image` and pointed
`og:image` at the 384 px stacked logo, which every previewer would have
letterboxed on a grey field.

`scripts/build-og.mjs` (new, `npm run build:og`) generates:

- `og-cover.png` — 1200×630, navy, wordmark and Persian headline
- `apple-touch-icon.png` — 180×180 opaque
- `icon-96.png` — Google's favicon crawler wants a raster ≥ 48 px
- `icon-192.png`, `icon-512.png` — Android install prompt

Persian is rendered through sharp's Pango text input rather than as SVG `<text>`,
because Persian needs bidi layout and contextual glyph shaping and a plain SVG
rasteriser will happily emit disconnected letters. `fontfile` points at the npm
package, so the script produces identical output on any machine.

`site.webmanifest` is new. `display: browser`, not `standalone` — this is a
website, and claiming to be an app in the install prompt would be a small lie.

`index.html` now carries `og:image:width/height/alt`,
`twitter:card=summary_large_image`, the full Twitter set, and `hreflang`
(`fa-IR` + `x-default`).

### Structured data — enriched

Added to the `Organization`/`ProfessionalService` node: `foundingDate`,
`numberOfEmployees` (3 — the FAQ already says it out loud, so the markup should
not be vaguer than the page), `logo` with stated dimensions, `image` pointing at
the share card, and slots for `telephone` and `sameAs`.

Added to the `WebPage` node: `primaryImageOfPage`, and `hasPart` listing all six
sections as `WebPageElement`s with their real anchors — which is what makes the
anchors eligible to be offered as jump links beneath the result.

Each `Service` now has a stable `@id`.

A `withoutBlanks` helper drops any key that is null or an empty array, so an
unfilled slot is simply absent. `"sameAs": []` is a claim to have looked and
found nothing; no key at all is honest.

### Sitemap — now generated

`public/sitemap.xml` is deleted. `scripts/prerender.mjs` writes
`dist/sitemap.xml` at build time with the build date as `lastmod`.

A hand-typed `lastmod` is correct exactly once, and Google weighs `lastmod` only
for sites whose `lastmod` has proved trustworthy. `changefreq` and `priority`
are gone — Google has publicly stated it ignores both, and a field nobody reads
is a field that will eventually be wrong.

The trade-off is stated in the script: redeploying for a CSS tweak bumps the
date too. For a three-person team shipping a one-page site that is close enough
to always mean "we changed something."

### The intro overlay — the one real risk found

`#intro-cover` is an opaque, `position: fixed`, `inset: 0`, `z-index: 40` panel
raised by an inline script before first paint, and it is lifted only by React
after the overture finishes. Two problems:

1. **Every crawler and every audit tool saw a navy rectangle.** The copy was
   never at risk — it sits in the DOM behind the cover the whole time, so
   indexing worked. But Googlebot's rendered screenshot, every Lighthouse run,
   and every social preview bot measured a panel instead of a page. LCP in
   particular was being scored against the overlay.
2. **If the JS bundle never arrived, the cover never lifted.** A chunk that
   times out on a throttled connection left a visitor staring at a navy
   rectangle with the entire readable page sitting underneath it. That is the
   exact connection CLAUDE.md §2 tells us to assume.

Both fixed:

- **Bot bypass.** `navigator.webdriver` plus a user-agent test, in the inline
  script *and* in `src/hooks/deviceSupport.ts` (`isAutomatedVisit`). Verified
  against Googlebot desktop and smartphone, Bingbot, YandexBot, Lighthouse,
  TelegramBot, facebookexternalhit and WhatsApp — and against real Android
  Chrome, iOS Safari and desktop Firefox, none of which trip it.
- **8-second hard ceiling** armed in the inline script and disarmed by
  `introCover.ts` on any normal exit. It can only fire when something has
  genuinely gone wrong.

> The check is duplicated in two files on purpose, and both copies say so.
> The inline script has to reach a verdict before any module exists; the intro
> gate reaches its own verdict independently. Two copies of six lines is the
> cheaper problem — a bot that the cover skipped but the overture did not would
> mount a WebGL scene over a page nobody is looking at.

### Dependency cleanup

`motion` (^12.42.2) was installed and imported nowhere. Removed.

---

## 3. Verified, not assumed

Built clean from a fresh `npm install` in a Linux environment. `tsc -b` passes,
`eslint .` passes with zero findings.

**Prerendered HTML — what a crawler gets with JavaScript disabled:**

- 777 words of Persian body copy *(was 1035 before the content overhaul —
  see `CONTENT-PLAN.md`)*
- Exactly one `<h1>`, seven `<h2>`, twelve `<h3>` — no skipped levels
- All four FAQ questions and answers present as real text
- Valid JSON-LD: 3 `@graph` nodes, 4 `Question` entities, 7 `WebPageElement`s
- `telephone` and `sameAs` correctly absent while unfilled
- No headcount asserted — `numberOfEmployees` was removed by decision

**Weight:**

| | gzipped |
|---|---|
| Readable without JS (HTML + CSS + body font) | **53.3 KB** |
| Fully interactive (+ app JS) | **134.6 KB** |
| App JS alone, excluding three.js | **83.3 KB** (budget: 120 KB ✓) |
| three.js + gsap chunk, lazy-loaded | 155.0 KB |

Confirmed by grep that three.js is **not** in the entry chunk. The page reads
completely at 53 KB.

**Not verified in this pass** (needs a browser against a real deploy): Lighthouse
scores, field CWV, and the 360/768/1440 responsive pass. Do these after the
first deploy — see the checklist.

---

## 4. Open items before launch

Ordered by cost of getting them wrong.

- [ ] **Fill in `site.phone`** in `src/content/site.ts`. E.164 (`+989xxxxxxxxx`).
      It is currently `null` and therefore absent from the markup. A phone
      number is a conversion device before it is a ranking signal — add a
      visible `tel:` link in the contact section at the same time, and a label
      in `fa.ui`.
- [ ] **Fill in `site.socialProfiles`**. This is the single highest-value item
      on this list. `sameAs` is what turns «بیزینکس» from a string that appears
      on a page into an entity Google can hold an opinion about. Only list
      profiles that are actually maintained — a linked account with four posts
      from last year argues against us.
- [ ] **Native Persian read-through of `fa.ts`.** The file says it needs one, in
      two places, and 777 of its words are new as of the content overhaul. Copy
      is the product here; do not launch without it.
- [ ] **Set `site.telegram`.** The pricing section is written around the bot
      being the route to a number, and it currently renders no button because
      the handle is null.
- [ ] **Replace `public/brand/favicon.svg`.** It is labelled PLACEHOLDER in its
      own source — on-brand geometry, but not the logo mark. Then re-run
      `npm run build:og`, since the raster icons are cut from the same artwork.
- [ ] **Google Search Console.** The domain now has DNS, so verify the
      **domain property** `bizynex.ir` with a TXT record — it covers the apex,
      `www` and both protocols in one, which the URL-prefix method does not.
      Submit `https://bizynex.ir/sitemap.xml`. Then **Bing Webmaster Tools**,
      which accepts a GSC import and takes about two minutes.
- [ ] **Validate the deployed page** at `validator.schema.org` and Google's
      Rich Results Test. The FAQ markup should show as eligible.
- [ ] **Lighthouse on the deployed URL**, mobile preset, throttled. Confirm LCP
      and that the intro bypass fires (a Lighthouse run should never see the
      cover — its UA contains `Chrome-Lighthouse`).
- [ ] **Manual pass at 360 / 768 / 1440**, keyboard-only, reduced motion on,
      WebGL disabled. CLAUDE.md §9 requires this and it has not been done
      against the current tree.

---

## 5. Deliberately not done, and why

**Analytics.** CLAUDE.md §2 forbids third-party scripts and it is right to.
Vercel Analytics is the one option that does not break the rule — it is served
first-party from `/_vercel/insights` on your own origin, so nothing resolves to
a foreign endpoint an Iranian ISP might throttle. It is also the only realistic
way to get field Core Web Vitals for Iranian visitors, which lab Lighthouse runs
cannot give you. **Worth adding; ~1 KB; your call, not mine.** The alternative
is shipping blind.

**A Content Security Policy.** See §2. A CSP with `'unsafe-inline'` is theatre;
a real one needs per-build hashes for the two inline scripts. Deferred, not
forgotten.

**AVIF/WebP for the brand PNGs.** `scripts/build-images.mjs` already measured
this and documented the result: palette PNG beats every alternative on flat
two-colour artwork by a wide margin (1.8 KB vs 7.8 KB AVIF). The existing
decision is correct; do not "fix" it.

**A custom domain.** Done, 2026-08-13: `bizynex.ir`. The three-part change
landed together — `site.url` in `src/content/site.ts`, the absolute URLs in
`index.html`, the `Sitemap:` line in `public/robots.txt` — plus the `www` → apex
redirect in `vercel.json`. What is left is not code: set the apex as the primary
domain in Vercel, add the property in Search Console, and, once the old alias
has been indexed under the new canonical, file a change of address.

The order matters and it is the failure an earlier pass had to undo: a canonical
must never name a domain that does not resolve yet.

**Breadcrumb structured data.** One page. A breadcrumb of length one is noise.

**An FAQ accordion.** `Faq.tsx` explains why not, and the reasoning is sound —
text behind a click is text a reader has to decide to want, and everything is
currently findable with ctrl-F and readable without JavaScript.

---

## 6. What actually moves the needle next

Everything above is table stakes. It gets the page indexed correctly and
presented well. It does not get it found by more people, because **the page can
only rank for the queries it answers, and it answers one.**

In rough order of return per hour:

**1. Google Business Profile.** Free, and for a local services business in
Shiraz it is very likely worth more than every other item on this page put
together. It puts you in the map pack, which sits above the organic results.
Requires a verifiable address. Once verified, add the profile URL to
`site.googleBusinessProfile` — it is already wired into `sameAs`.

**2. Service landing pages.** Four pages — طراحی سایت، اپلیکیشن، اتوماسیون،
پشتیبانی — each targeting the phrase people actually type, each with its own
`<h1>`, its own FAQ, its own `Service` schema. Roughly four times the indexable
surface for maybe a week of work, most of it writing rather than code.

This is the point at which CLAUDE.md §3's "no router until there's a second
page" is satisfied and a router becomes correct rather than premature. Keep the
prerender approach — `scripts/prerender.mjs` renders a route and writes a file;
making it loop over four routes is a small change, not a rewrite. Do **not**
reach for Next.js for this.

**3. Case studies, once there are any.** «چه کارهایی را قبول نمی‌کنید؟» is the
most trust-building thing on the current page. Actual work, described honestly
with a named problem and a measured outcome, beats it. Two real case studies
outrank a blog of twenty generic posts.

**4. A journal — only if it will be sustained.** A blog with four posts and a
last-updated date of eighteen months ago is worse than no blog: it is a public
signal that the company stopped. CONTEXT.md §9 lists "growing faster than
operational maturity" as a failure mode, and a content calendar three founders
cannot keep is exactly that. Commit to a cadence you can hold in a bad month,
or do not start.

**5. Persian-language technical writing as a distribution channel.** There is
very little good Persian material on the topics you are expert in. That is a
gap, and filling it earns links and authority in a way that service-page copy
never will. It is also the slowest of these five.

---

## 7. Notes for whoever maintains this

Three things in this repo are duplicated on purpose. Each says so in a comment.
If you change one, change the other:

1. **The origin** — `src/content/site.ts`, and several places in `index.html`
   (canonical, hreflang, og, twitter).
2. **The bot check** — the inline script in `index.html`, and
   `isAutomatedVisit` in `src/hooks/deviceSupport.ts`.
3. **`navy-900` / `navy-700`** — `src/styles/tokens.css`, and the critical inline
   `<style>` in `index.html`.

And one stack note, separate from SEO: **CLAUDE.md §3 says "No state manager,"**
but `@reduxjs/toolkit` and `react-redux` are installed and used, for a store
holding capability flags. That is roughly 15 KB gzipped doing the work of a
React context and a `useState`. It is inside the performance budget, so this is
not urgent — but either the dependency should go or §3 should be amended. A rule
the codebase openly ignores stops being a rule for anything else either.
