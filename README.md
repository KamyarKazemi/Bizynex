# Bizynex

Single-page Persian introduction site. React + Vite + TypeScript + Tailwind v4, with a small
three.js scene in the hero.

Read `CONTEXT.md` for the brand rules and `CLAUDE.md` for the engineering rules. They are binding.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, bundle, then prerender into dist/index.html
npm run preview  # serve the built site
npm run lint

npm run build:fonts     # re-subset Vazirmatn, by hand
npm run build:images    # regenerate the logo files from brand/, by hand
npm run check:contrast  # fail if any colour pair drops below the a11y floor
```

## Things that are not obvious

**The build prerenders the page.** `npm run build` runs three steps: the normal client bundle, a
throwaway server bundle, and `scripts/prerender.mjs`, which renders the page once and pastes the
markup into `dist/index.html`. This is why the site is readable before any JavaScript runs, and it
is most of the reason the page is fast on a slow connection. `npm run dev` skips it and mounts a
normal client root instead.

**Logo masters live in `brand/`, not `public/`.** `brand/` is not served — the two master
PNGs are 94 KB and nothing should ever download them. `npm run build:images` shrinks them into
`public/brand/` at about 3.7 KB each. Replace a master, re-run the script, commit both.

They are palette PNGs rather than WebP on purpose: for flat two-colour artwork a palette PNG
measured 1.8 KB against 7.8 KB for AVIF and 10.7 KB for lossless WebP. WebP is the right default
for photographs, not for this.

**Fonts are committed, not built.** `public/fonts/*.woff2` are Vazirmatn subsets, produced by
`npm run build:fonts`. That script is deliberately not part of `npm run build`: the subsets are in
the repo so a deploy never depends on reaching npm. Re-run it only if new characters appear in the
copy.

**One place for copy, one place for colour.** All Persian strings live in `src/content/fa.ts`; all
colour values live in `src/styles/tokens.css`. Components contain neither. If you need a new string
or a new colour, add it there first.

**Tokens come in two layers, and the difference matters.** `src/styles/tokens.css` defines a
*palette* (`navy-900`, `teal-500`, …) whose values never change, and a *semantic* layer (`ink`,
`paper`, `rule`, `accent-fill`, …) that flips between light and dark. **Components use the semantic
layer and nothing else** — that is the only reason dark mode did not require touching every file.
Reach for a palette token only when something must look identical in both themes, as the intro
curtain does.

**Teal is rationed.** Roughly one teal element per viewport — currently the two call-to-action
buttons and the two accent segments in the hero figure. There is no token that lets you set brand
teal as body text, because brand teal fails contrast at body size. Use `accent-text` for type and
`accent-fill` for fills; the names are the guard rail.

**The theme is owned by the document, not by React.** An inline script in `index.html` sets
`data-theme` on `<html>` before the stylesheet applies, so the page never paints in the wrong theme
and corrects itself. React reads that decision back; it never makes it. The storage key is shared
between that script and `src/hooks/useTheme.ts` — change one, change the other.

**Run `npm run check:contrast` after touching any colour.** It reads the real token values and
fails the build floor for both themes. Brand teal is the trap: it looks correct on white and
measures 3.23:1.

**The logo ships in two versions.** `build:images` repaints the navy in the mark to the dark theme's
ink and leaves the teal segments alone. Both are in the markup with CSS choosing; swapping `src`
from JavaScript would show a navy mark on a navy page until hydration caught up.

**`src/three/geometry.ts` feeds three things.** The WebGL scene, the static SVG fallback, and the
favicon are all the same construction system: right angles and 45-degree diagonals on an 8-unit
grid. Change the geometry there and all of them follow.

**The canvas is optional by design.** It mounts only after the page has painted, and only if WebGL
is available, the device reports enough memory, and the visitor has not asked for reduced motion.
Otherwise the static SVG stays. Delete `src/three/` entirely and the page still works.

## Layout

```
brand/            logo masters — NOT served
public/
  brand/          generated logo files and favicon
  fonts/          Vazirmatn subsets (committed)
scripts/
  build-fonts.mjs  subsetting, run by hand
  build-images.mjs logo generation, run by hand
  prerender.mjs    build-time static render
src/
  components/     reusable pieces
  sections/       page sections, in render order
  three/          all WebGL — nothing outside this folder imports three
  content/        fa.ts (copy), site.ts (facts)
  store/          capability detection state
  styles/         brand tokens
```
