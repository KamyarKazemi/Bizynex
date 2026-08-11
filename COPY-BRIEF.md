# COPY-BRIEF.md — the new pages, and what still needs your eye

Four pages are written and live in the build. One is not, and cannot be.

**The Persian on the four service pages was drafted by Claude, not by a
founder.** That follows the workflow `CONTENT-PLAN.md` §3 already set — *"Claude
drafts, founder corrects in place"* — and it is the same arrangement that
produced the current home page. It is a draft in the same sense that one was:
usable, on-register, and **not finished until you have read it aloud**.

Correct it directly in `src/content/fa.ts` under `pages`. Your edits are the
style guide, not this file.

---

## What was written against

Every page follows the same three-beat shape, and it is deliberate:

1. what this is
2. **where it does not work**
3. what happens first

The middle beat is the one no competitor writes. `CONTEXT.md` §6 calls it
"direct about limits — volunteering the downside is the fastest trust-builder
available", and it is the only part of these pages that a template shop could
not have produced.

Rules held throughout: the sentence may be warm, the noun may not be idiomatic;
no exclamation marks; no «راهکار»، «بروز»، «حرفه‌ای‌ترین»; no restating a promise
that already has a home elsewhere on the site.

---

## Read these four aloud

| Page | Route | The sentence to check hardest |
|---|---|---|
| اتوماسیون کارهای تکراری | `/automation` | «کجا جواب نمی‌دهد» — turning work down in the second section |
| نرم‌افزار سفارشی | `/software` | «اگر کسب‌وکار شما هم همان‌طور کار می‌کند، آماده بخرید» — telling them not to buy from you |
| اپلیکیشن موبایل | `/app` | The whole «اول این را بپرسید» section argues most readers do not need an app |
| چه چیزی تحویل می‌گیرید | `/delivery` | «همین یک بند مشخص می‌کند بعداً دستتان باز است یا نه» |

**Boundary to police:** `/automation` removes a manual step from a process that
already runs; `/software` builds a system that did not exist. If a sentence
would work on both pages, it belongs on neither.

**`/delivery` is the strongest page of the four.** It targets the ownership and
aftercare questions nobody in this market answers, and it needs no case study
behind it to be credible. If you only have time to correct one, correct that one.

### Specific things I am least sure about

- **Register on the "no" sections.** They are the point of these pages, but the
  line between *direct* and *blunt* is a native judgement I cannot make.
- **«خودکار کردنش» in `/automation`.** I avoided using «اتوماسیون» as a verb.
  Check that the alternative is what someone would actually say.
- **«دورِ خودِ کار» in `/software`.** The ezafe is doing real work there; confirm
  it reads rather than trips.
- **Headings.** Each is a short phrase rather than a noun. That matches the
  process steps but not the home sections, which are nouns. Pick one.

---

## The speed claim is now on the site

`/delivery`'s last section says the page reads in under ۶۰ کیلوبایت and that the
build stops if it goes over. **Both halves are true and enforced:**
`npm run check:weight` measures every emitted page and fails the build past
60 KiB. Current worst is 53.5 KiB.

It quotes the budget rather than today's measurement on purpose — a few
kilobytes of new copy cannot make the sentence wrong. If you ever raise
`BUDGET_KIB` in `scripts/check-weight.mjs`, change this sentence in the same
commit.

This is the one competitive claim on the site that is measurable, and no
competitor in this market can make it.

---

## 05 — the case study — still blocked, and not on copy

`/work` exists as a route and stays `draft: true`. It is waiting on a **fact**,
not on words, and that is the whole reason it is worth having.

No competitor publishes a case study with a measured outcome; they publish
portfolio links, which are logos and URLs. A named problem with a number
attached would be structurally different from everything else in this market —
which is exactly why an invented number would destroy it. The argument *is* that
we say what actually happened.

**Capture these while the next project runs**, not afterwards from memory:

- What the client was doing before, in their words, and how long it took them
- The one number that changed, measured before and after — hours per week,
  error rate, time-to-quote, orders processed. One verifiable number beats three
  unverifiable ones
- What went wrong during the project and what you did about it
- Written permission to name them, or agreement on how to describe them unnamed

Note that `/automation`'s third section now promises exactly this measurement
(«اول اندازه می‌گیریم»). That promise and this page are the same discipline: if
you measure the before, you have the case study for free.

If the number turns out unimpressive, publish it anyway. A modest true number
outranks an impressive vague one.

---

## Still unwritten, and small

**The home meta description** is 188 characters; Google truncates a Persian
snippet around 150–160. The clause lost is «و بعد از تحویل هم می‌مانیم» — the
differentiator. At 160 it cuts cleanly on a word boundary; at 150 it cuts
mid-word through «خبرتان».

**Two questions in the structured data.** `fa.pricing.schemaOnlyQuestions` holds
«هزینهٔ طراحی سایت در شیراز چقدر است؟» and «ساخت یک وب‌سایت چقدر طول می‌کشد؟».
They are not rendered — they tell Google the «هزینه و زمان» section answers the
two highest-intent local queries this business can answer.

Both halves are your own words: questions verbatim from the pre-overhaul FAQ,
answers verbatim from the pricing section. **But they were never written as a
pair.** Read each question immediately followed by its answer once. If the seam
shows, edit the question — the answer is load-bearing prose on the page itself.

---

## Publishing a page

The four are already published. For `/work`, or any page you add:

1. Write its block in `src/content/fa.ts` under `pages`.
2. Set `draft: false` in `src/content/routes.ts`.
3. `npm run build`.

The build refuses a published page whose slots are empty and names the missing
field, so a half-written page cannot ship by accident. Drafts are visible in
`npm run dev` and stripped from production.
