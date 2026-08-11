# CONTENT-PLAN.md — the content overhaul

Working document. Not the copy itself — the spec the copy gets written against,
and the record of what was decided and why. Delete it once `fa.ts` is final, or
keep it as the thing a future edit gets checked against.

Status: **applied on branch `ove`.** Builds clean, lint clean, contrast passes.
Two things are still open — see §7.

---

## 1. The diagnosis, in one line

The page has one idea and states it seventeen times in five different registers.
It is not incoherent — it is redundant, and the redundancy reads as anxiety.

### The repetition ledger

Three promises — *we write it down before, we tell you during, we stay after* —
currently appear in these seventeen places:

| # | Where | The restatement |
|---|---|---|
| 1 | `hero.subtitle` | از اولین گفتگو تا سال‌ها بعد از تحویل |
| 2–4 | `problem.body` | پیش از شروع می‌نویسیم / در طول کار خبرتان می‌کنیم / بعد از تحویل همان‌جا می‌مانیم |
| 5 | `services[3]` | بعد از تحویل، پروژه بایگانی نمی‌شود |
| 6 | `process[1]` | روی کاغذ می‌آید |
| 7 | `process[2]` | خودمان می‌گوییم |
| 8 | `process[3]` | تحویل وسط راه است |
| 9 | `why[0]` | همان روز می‌گوییم |
| 10 | `why[1]` | هزینهٔ پنهانی در کار نیست |
| 11 | `why[2]` | بدون آنکه بپرسید می‌فرستیم |
| 12 | `why[4]` | همه‌چیز از روز اول مال شماست |
| 13 | `why[5]` | پنج سال دیگر هم با هم کار کنیم |
| 14 | `faq[1]` | همان روز می‌گوییم |
| 15 | `faq[3]` | همان تیمی که ساخته، پشتیبانی هم می‌کند |
| 16 | `faq[4]` | از روز اول مال شماست |
| 17 | `contact.body` | بی‌تعارف می‌گوییم |

Two pairs are near-verbatim: `why[4]`/`faq[4]` and `why[0]`/`faq[1]`.

### The rule that stops it coming back

**Every promise gets exactly one home.** If a claim already has a home, a second
section may *rely* on it but may not *restate* it. Any future edit that restates
one is a bug, not a style preference.

| Promise | Its one home, after the overhaul |
|---|---|
| You talk to the person who builds it | Hero subtitle |
| Written scope before anything starts | روش کار, step 2 |
| Weekly update without being asked, good news or bad | روش کار, step 3 |
| Source, domain and accounts in your name | چه چیزی تحویل می‌گیرید |
| Warranty window and what maintenance covers | چه چیزی تحویل می‌گیرید |
| No hidden cost | هزینه و زمان |
| We turn down work that isn't a fit | FAQ |

---

## 2. The register rule

The current guidance in `fa.ts` produced the drift, because "warm but
professional" is a judgement call and a judgement call made forty times drifts.
Replacing it with something mechanical:

> **The sentence may be warm. The noun may not be idiomatic.**

Warmth comes from directness, first person plural, and short active sentences —
never from colloquial vocabulary. Concretely:

**Cut on sight** — these are the actual offenders in the current file:

| Out | Why |
|---|---|
| رُک بگوییم | conversational filler, and the sentence is already direct |
| رودربایستی | friend register, not engineer register |
| بی‌تعارف | same |
| چیزی گرو نمی‌ماند | idiom |
| در باز است | idiom |
| بقیه‌اش را با هم پیدا می‌کنیم | warm but says nothing |
| توانمندی عملیاتی | nobody says this out loud |
| اعتبار دیجیتال (as a heading) | strategy-deck abstraction |
| دو دسته را نمی‌پذیریم | policy-document register |

**Keep, unchanged** — the best writing in the file, and the target register:

- «اگر محتاط شده‌اید، حق دارید»
- «تخمین‌هایمان محافظه‌کارانه است، تا بعداً مجبور به عذرخواهی نشویم»
- «کسی که با او حرف می‌زنید همان کسی است که کار را انجام می‌دهد»

Unchanged from the existing brief: no exclamation marks, no «راهکار», no «بروز»,
no «حرفه‌ای‌ترین», no adjective we could not defend in a meeting.

---

## 3. Decisions taken

| Question | Decision |
|---|---|
| Publish a price floor | **No.** Pricing is handled by the Telegram bot. |
| Name the founders | **No.** No headcount anywhere on the site. |
| «تیم کوچک» | **Keep.** It states no number. |
| Direct-access claim | **Keep.** It is the differentiator and it needs no size. |
| Cut depth | **Full restructure.** |
| Section 04 | **«چه چیزی تحویل می‌گیرید»** — the artefacts. |
| Who writes the Persian | Claude drafts, founder corrects in place. |

**Consequence to action:** `numberOfEmployees: 3` must come out of
`src/content/jsonLd.ts`. It is the only place a headcount is currently asserted,
and it is asserted to Google.

**Open input required:** the bot's handle, and what it actually does. The
هزینه و زمان section cannot be written without it, and `site.telegram` is still
`null`.

---

## 4. Section-by-section spec

Each section states the **job** it does, what it **must not repeat**, and a
length target. Copy gets written against this, section by section, with a review
gate after each.

### Hero

- **Job:** name the category, the city, and the one differentiator. Nothing else.
- **Must not:** promise anything about process, delivery, or aftercare. Those
  have homes further down.
- **Target:** h1 ≤ 9 words. Subtitle ≤ 30 words.
- **Change:** the current h1 spends the largest text on the page on a
  differentiator before establishing what is being sold. Category comes first.

### 01 — was «چرا پروژه‌های نرم‌افزاری شکست می‌خورند»

- **Job:** show the reader we know what they have been through, then hand off to
  the rest of the page.
- **Must not:** answer the problem. The answer is روش کار. This section only
  names the experience and points forward.
- **Target:** ~60 words, down from ~150. One paragraph, not two.
- **Change:** retitle. The current title is a conference-talk topic and it plants
  the frame "software projects fail," which the rest of the page then has to
  argue against. The second paragraph is deleted entirely — it is pure
  promise-restatement and its content moves to روش کار.
- **Addition:** a closing bridge sentence telling the reader what the rest of the
  page is for. This is the fix for "nothing makes sense when you read
  everything" — the page currently has no spine.

### 02 — خدمات

- **Job:** let a scanning reader learn what is for sale in four seconds.
- **Must not:** repeat aftercare. The fourth card currently duplicates the
  warranty content that now lives in section 04.
- **Target:** heading ≤ 4 words, body ≤ 32 words each.
- **Change — the important one:** invert the card hierarchy. The `<h3>` becomes
  the deliverable («طراحی و توسعهٔ وب‌سایت»); the outcome moves into the sentence.
  Right now the only place the actual service is named is a small grey line
  styled as the least important thing in the card.
  > "Sell outcomes, not deliverables" (CONTEXT §1) is a positioning principle. It
  > was applied as a heading convention. The outcome belongs in the prose.
- **Component change required:** `Services.tsx` currently renders
  `h3 = item.title` then `p.text-label.text-muted = item.deliverable`. Those two
  swap, and the muted line probably disappears entirely.

### 03 — روش کار

- **Job:** make the process concrete enough to be checked against.
- **Must not:** promise. Each step names an **artefact or a cadence** — a
  document, a frequency, a thing that arrives — not an intention.
- **Target:** 4 steps, heading ≤ 3 words, body ≤ 30 words.
- **Change:** this section absorbs the deleted `problem.body` and most of the
  deleted `why` items. It carries more weight than before and has to earn it by
  being specific: what the scope document contains, how often the update lands,
  what "training" means in practice.

### 04 — «چه چیزی تحویل می‌گیرید» (new, replaces «چرا بیزینکس»)

- **Job:** fix the "nothing on this page is checkable" problem. A plain list of
  what physically ends up in the client's hands.
- **Must not:** restate why any of it matters. The list is the argument.
- **Target:** 5–6 items, one line each. No paragraphs.
- **Content:** the written scope, the source code, domain and hosting accounts in
  their name, the documentation, the training session, the warranty window and
  what maintenance covers.
- **Why this and not a team section:** the founders are staying anonymous, so the
  "you talk to the builder" claim cannot be proved by showing people. It can be
  proved by showing what you hand over. This is the substitute.
- **Boundary with روش کار:** روش کار is *when and how*; this is *what you end up
  owning*. If a line could go in either, it goes here and روش کار references it.

### 05 — هزینه و زمان (new)

- **Job:** answer the two questions everyone has, in the open, instead of at FAQ
  position 5.
- **Must not:** apologise for having no number.
- **Target:** ~70 words plus the bot as the call to action.
- **Blocked:** needs the bot handle and its actual behaviour. If the bot gives an
  estimate, this section is short and points at it. If it only qualifies leads,
  the section has to carry the "what drives the price" explanation itself.
- **Timelines can be stated now** — 3–6 weeks for a company site, 2 months+ for
  custom systems. Those are already in `faq[1]` and they are the most useful
  concrete facts on the page. They move up here.

### 06 — FAQ, cut from 8 to 4

| Current | Fate |
|---|---|
| هزینهٔ طراحی سایت چقدر است | → moves to §05 |
| ساخت یک وب‌سایت چقدر طول می‌کشد | → moves to §05 |
| با یک تیم کوچک کار کردن چه فرقی دارد | **rewrite** — keep the answer, remove «پروژه‌های کمی برمی‌داریم» which implies capacity |
| بعد از تحویل چه اتفاقی می‌افتد | → absorbed by §04 |
| کد و دسترسی‌ها مال کیست | → absorbed by §04 |
| فقط در شیراز کار می‌کنید | **keep** — no other home, and it is a real question |
| چه کارهایی را قبول نمی‌کنید | **keep, rewrite** — drop «دو دسته را نمی‌پذیریم» |
| چطور شروع کنیم | **keep** — and it now points at the bot |

Four survive. The FAQ should hold only what has nowhere else to live.

### 07 — تماس

- **Job:** one action, no friction.
- **Target:** ≤ 40 words.
- **Change:** drop «بی‌تعارف» and «بقیه‌اش را با هم پیدا می‌کنیم». Decide whether
  the bot or email is the primary action — currently email is the only one.

---

## 5. What this costs in code

Content-only where possible, but three components need edits:

| File | Change |
|---|---|
| `src/content/fa.ts` | Rewritten. This is the bulk of the work. |
| `src/content/jsonLd.ts` | Remove `numberOfEmployees`. FAQ count drops 8 → 4. |
| `src/sections/Services.tsx` | Swap `h3` and the muted deliverable line. |
| `src/sections/Why.tsx` | **Delete.** Replaced by a new `Delivered.tsx`. |
| `src/content/site.ts` | New section id + index; `telegram` gets a real value. |
| `src/App.tsx` | Section order. |

`SECTION_INDEX` renumbers, and the JSON-LD `hasPart` list follows automatically
because it is generated from `SECTION_IDS`. Nothing else should move.

Rough size: ~1035 words → ~800, carrying more information.

---

## 6. Review sequence

One section at a time, in this order. Each gets your correction before the next
is written, so register mistakes get caught once rather than forty times.

1. **Hero + §01** — calibration batch. These two set the voice; everything after
   is written to match whatever you correct here.
2. §02 خدمات
3. §03 روش کار
4. §04 چه چیزی تحویل می‌گیرید
5. §05 هزینه و زمان *(blocked on the bot)*
6. §06 FAQ + §07 تماس
7. Full read-through end to end, out loud, checking for restatement against the
   ledger in §1.
8. Apply to `fa.ts`, update the components in §5, rebuild, re-validate the
   structured data.

Corrections get written back into the `fa.ts` header as they are settled — your
edits are the real style guide, not the brief.

---

## 7. What shipped, and what is still open

Applied on branch `ove`. Verified from a clean install: `tsc -b` passes,
`eslint .` clean, `npm run check:contrast` passes in both themes.

| | Before | After |
|---|---|---|
| Body words in the prerendered HTML | 1035 | **846** |
| Restatements of the three promises | 17 | **7** — one home each |
| FAQ questions | 8 | 4 |
| Sections | 6 numbered | 7 numbered |
| `<h3>` on a services card | abstract noun | the deliverable |
| Headcount asserted to Google | `numberOfEmployees: 3` | none |

Structured data revalidated: 4 `Question` nodes, 7 `WebPageElement`s, service
names now read طراحی و توسعهٔ وب‌سایت rather than اعتبار دیجیتال. Heading order
is still one `<h1>`, seven `<h2>`, twelve `<h3>`, nothing skipped.

Files: `fa.ts` rewritten · `Why.tsx` deleted · `Delivered.tsx` and `Pricing.tsx`
added · `Services.tsx`, `Problem.tsx`, `App.tsx`, `site.ts`, `jsonLd.ts` edited.

### Still open

1. ~~**The Telegram bot.**~~ Wired. `site.telegram` is `https://t.me/BizynexBot`
   and it is now the primary intake in two places — هزینه و زمان and تماس — with
   email demoted to the quiet tone alongside it.

   **The pricing position changed with it.** The section no longer says "we
   can't quote before we know the project," which is what every agency says and
   reads as evasion. It now refuses the bracket on purpose: a general range is
   either so wide it says nothing or it puts you in a category your project
   isn't in. Same absence of a number, opposite impression — and it makes the
   bot the answer rather than a consolation.

   **One call to action, at the bottom.** هزینه و زمان has no button — it
   explains what the bot will ask for and stops. A button mid-page asks for the
   decision before the argument for it has finished, and تماس is where someone
   who has read everything acts. تماس renders Telegram *or* email, never both:
   two buttons side by side hand the reader a channel choice at the exact moment
   they have decided to get in touch. The visible email address stays underneath
   either way — it is a link, not a button, and an address you can read is
   checkable in a way a `mailto:` is not.

   Setting `site.telegram` back to `null` still degrades cleanly in one edit:
   `botLead` disappears from هزینه و زمان, and the single button in تماس becomes
   the email action. `fa.pricing.drivers` is ordered last precisely so it
   survives as the answer if that happens.
2. **The h1 was chosen for you.** You did not pick between the two drafts, so
   the plainer one shipped — «وب‌سایت و نرم‌افزاری که می‌شود روی آن حساب کرد» —
   on the grounds that CONTEXT.md §6 asks for ordinary words. The drier
   alternative was «وب‌سایت و نرم‌افزار، ساخته‌شده برای ماندن». One line in
   `fa.ts` to swap.
3. **Native read-through.** Unchanged from before, and now more important: 777
   words of this are new. `fa.ts` still carries the warning at the top.

### One thing worth watching

The page no longer says «تیم کوچک» in more than one place — it is in the hero
subtitle and in the FAQ question, and nowhere else. That was deliberate under
the no-headcount rule, but it means the direct-access differentiator now rests
on two sentences. If a native read-through finds the page has lost warmth, that
is the first place to look, not the FAQ answers.
