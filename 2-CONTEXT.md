# CONTEXT.md — Bizynex Brand & Project Context

Source of truth for every design and content decision in this repository. When an instruction and this document conflict, raise it rather than guessing.

---

## 1. The company

**Bizynex** — a software company in Iran, three founders (front-end, back-end, business), currently pre-launch.

We build websites, applications, and automation for businesses that need them to work reliably. We position as a **long-term technology partner, not a contractor**, and we compete on **predictability, not price**.

The founding conviction: in a market where most clients have been burned by an agency that went quiet, missed a date, or vanished after launch, the scarce product isn't code — it's certainty. We sell certainty and deliver it through software.

**We sell outcomes, not deliverables:**

| Not this | This |
|---|---|
| websites | digital credibility |
| automation | operational efficiency |
| applications | business capability |
| software | measurable business improvement |

**Explicitly not:** the cheapest, the fastest, a freelancer collective, or available for work we can't do well.

## 2. Language

Bizynex is a **Farsi-first brand.** Persian is the default language of the site, proposals, contracts, and support — written natively, never translated from English. The Latin name keeps international expansion open without structural change.

Implications for this repo:
- Design and build RTL first; LTR is the mirror, not the origin.
- Persian typography needs more line height than Latin and has lighter stroke weight — build hierarchy through size and weight, not color.
- Persian numerals for prose, Latin numerals for data/code contexts — be consistent and decide once.
- Respect ZWNJ (`\u200C`) in compound words. Never strip it.

## 3. Logo

Two master files, both transparent PNG:

| File | Dimensions | Ratio | Use |
|---|---|---|---|
| `bizynex-horizontal-transparent-trimmed.png` | 1219 × 278 | 4.385 : 1 | Header, footer, documents, anywhere wide |
| `bizynex-stacked-transparent.png` | 1113 × 960 | 1.159 : 1 | Square-ish contexts, social avatars, hero, print |

**The mark** is an interlocking X built entirely from right angles and 45° diagonals — a woven, engineered geometry. Two small teal segments sit on one diagonal. Everything else is navy.

In the master files the teal accounts for roughly **1.4% of opaque pixels.** That ratio is the brand strategy expressed visually: overwhelmingly structural, with one small deliberate signal that something was engineered rather than assembled. Preserve it in every layout.

**Rules:** minimum clear space equal to the height of the X mark. Never rotate, recolor, outline, stretch, add effects to, or place on a busy background. The teal segments are never isolated as a standalone graphic device. One logo per surface.

**Derived motif (allowed and encouraged):** the mark's underlying geometry — orthogonal lines meeting 45° diagonals, interlocking paths — may be abstracted into background structure, dividers, and the three.js scene. The *system* is reusable; the *logo* is not.

## 4. Color

⚠️ **Canonical values, taken from the two master logo files above.** An earlier draft file used `#112234` / `#21A598` — those are superseded. Use only what follows.

### Core

| Role | Hex | Note |
|---|---|---|
| **Bizynex Navy** — primary | `#122A3E` | 14.72:1 on white. Default text color everywhere. Never use pure black. |
| **Bizynex Teal** — accent | `#17A096` | 3.23:1 on white — **fails for text.** Fills, icons, borders, large bold type only. |

### Full palette

```
navy-900   #0A1A28   deepest surfaces, footer, dark base
navy-800   #122A3E   PRIMARY — text, logo, headers
navy-700   #1D3E58   hover on navy, secondary dark surfaces
navy-600   #2C5271   borders on dark, muted dark text
navy-100   #E4E9EE   light dividers, navy-tinted fills

teal-700   #0E7A72   accessible teal for text/links on light (5.19:1)
teal-500   #17A096   BRAND ACCENT — fills, icons, primary CTA
teal-300   #4FD6C7   teal text/links on navy (8.26:1)
teal-50    #E7F6F4   subtle callouts, success backgrounds

paper      #FFFFFF   primary background
surface    #F6F8F9   section alternation, cards
border     #E1E6EA   dividers, table rules
muted      #5A6B7C   secondary text, labels (5.48:1)
```

### Semantic

| Meaning | Hex |
|---|---|
| Success | `#0E7A72` — reuse teal-700; do not introduce a second green |
| Warning | `#B45309` |
| Error | `#B42318` |
| Info | `#1D3E58` |

Success being the brand teal is deliberate: "on track" and "our brand" are the same color, which reinforces reliability in every client-facing status view.

### Usage ratio

Roughly **60% white/off-white, 35% navy, 5% teal.** One teal element per viewport — the single most important action or fact on screen. If teal appears everywhere, the brand reads as a generic startup and the differentiation collapses.

Color never carries meaning alone. Always pair with a label or icon.

## 5. Values

Seven, each capable of costing money — otherwise they'd be slogans:

**Clarity** · **Honesty** · **Reliability** · **Craft** · **Restraint** · **Systems** · **Endurance**

Short form: *We say what we'll do, then we do it — and we build it to last longer than the invoice.*

## 6. Voice

**A calm senior engineer explaining something to a business owner they respect.** Not a salesperson, not a professor, not a friend.

- **Plain** — short sentences, ordinary words. If a client needs a dictionary, the writing failed.
- **Specific** — "three weeks" beats "soon." Vagueness is what every other agency sounds like.
- **Composed** — no exclamation marks, no urgency theatrics. A company that reduces uncertainty can't sound anxious.
- **Direct about limits** — say what's not included and what could go wrong. Volunteering the downside is the fastest trust-builder available.

**Use:** build, plan, deliver, maintain, we recommend, here's what this costs and why, this takes X weeks.
**Never:** leverage, empower, unlock, revolutionize, cutting-edge, world-class, seamless, "solutions" as a noun, "passion," any adjective you couldn't defend in a meeting.

In Persian: keep the respect conventions the language requires, drop the ceremonial padding. Warm greeting, then straight to the point.

## 7. Aesthetic

**Engineered, not decorated.** References are technical documentation, engineering drawings, financial infrastructure, and Swiss editorial layout. Not startup landing pages, not agency portfolios, not luxury branding.

- **Space** — generous margins and gutters. Whitespace is the largest aesthetic asset and it's free. If a layout feels slightly too sparse, it's correct.
- **Structure** — visible grid logic, exact alignment, no optical drift. Left-aligned (start-aligned) by default; centering only for a single short statement.
- **Type** — one neutral, well-engineered sans family across weights. Hierarchy through size and weight only, never color or decoration. Body line height ~1.7–1.8 for Persian. Measure 60–75 characters. No italics for emphasis, no all-caps, no letter-spacing tricks. Numbers get room and tabular figures.
- **Surface** — flat. **No gradients on brand colors. No drop shadows** beyond a barely perceptible card lift. Thin 1px low-contrast borders do the work shadows would. One corner radius, used consistently.
- **Imagery** — real screenshots, diagrams we drew, real charts. **Never** stock photography, handshakes, glowing circuit boards, upward arrows, smiling people at laptops. A diagram proves you thought about the problem; a photo proves you have a budget. If there's nothing honest to show, show nothing.
- **Icons** — thin-stroke, geometric, single-weight, monochrome, built from the same right-angle/45° logic as the mark. Icons label; they never decorate.
- **Motion** — minimal, 150–250ms, explains state change only. No parallax, no scroll-reveal cascades, no counting-up numbers.

**Explicitly rejected:** neon, vivid gradients, glassmorphism, dark heroes with glowing accents, 3D renders of floating shapes, emoji, rounded playful type, anything trend-anchored.

**Two tests before anything ships:**
1. Would this still look right in five years? If it's fashionable, it's wrong.
2. Does every element earn its place? If it's there to fill space or impress, remove it.

## 8. Operating reality

Iran-based: inflation, currency movement, sanctions, restricted access to international services. Treated as a **permanent design constraint**, not a temporary disruption.

For this repo that means: self-host everything, assume slow and unreliable connections, assume mid-range Android hardware, assume foreign CDNs and services are unreachable, and never build a dependency that a sanctions change could break.

Three founders, no employees, limited capital. Every technical choice must be maintainable by three people — one of them junior — with no bench.

## 9. Decision filter

Run any significant choice through this. Multiple *no*s → rework it.

- [ ] Does it create genuine customer value?
- [ ] Does it strengthen long-term trust?
- [ ] Does it communicate business value rather than technical complexity?
- [ ] Is it hard for competitors to copy?
- [ ] Can three people realistically run and maintain it?
- [ ] Does it survive worse economic conditions?
- [ ] Does it still differentiate us in five years?
