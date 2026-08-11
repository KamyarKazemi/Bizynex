/**
 * Fails the build if a page costs more to read than we say it does.
 *
 * ## Why this exists
 *
 * Speed is the one competitive claim this site can make honestly — every
 * comparable agency site in this market ships a multi-megabyte WordPress build
 * with sliders and popups, and this one is prerendered HTML with two subset
 * fonts. But a performance claim in marketing copy is a liability the moment
 * it stops being true, and it stops being true silently: nobody notices a page
 * getting 4 KB heavier per commit until it is 200 KB heavier.
 *
 * So the number is enforced rather than remembered. If the copy says the page
 * reads in under N kilobytes, this is what keeps that sentence honest.
 *
 * ## What "readable" means here, and why it is measured this way
 *
 * The budget covers exactly what a visitor needs before the page is legible
 * with JavaScript blocked or still in flight:
 *
 *   the prerendered HTML  — all the words, already in the markup
 *   the stylesheet        — the layout those words sit in
 *   the body font         — Persian is unreadable in a fallback serif
 *
 * It deliberately excludes the app bundle, the three.js chunk, the semibold
 * font and every image: none of them is required to read the page, and folding
 * them in would measure a different, less useful thing. CLAUDE.md section 6
 * already budgets the JavaScript separately, and that budget is checked by the
 * bundle output rather than here.
 *
 * woff2 is already Brotli-compressed internally, so gzipping it again is close
 * to a no-op. It is included at its real transfer size rather than pretending
 * compression helps twice.
 *
 * Every emitted page is checked, not just home — a service page with a long
 * body is exactly the thing that would quietly blow the budget.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/**
 * The ceiling, in kibibytes, for one page's readable payload.
 *
 * Measured at 53.4 KiB on 2026-08-11. The headroom is small on purpose: a
 * budget with 3x of slack is not a budget, it is a note. Raising this is a
 * decision someone should have to make deliberately and write down — if a page
 * genuinely needs more, change the number and say why in the commit.
 */
const BUDGET_KIB = 60;

const gzipped = (path) => gzipSync(readFileSync(path)).length;

if (!existsSync(dist)) {
  console.error('check:weight — no dist/. Run `npm run build` first.');
  process.exit(1);
}

const assets = join(dist, 'assets');
const cssBytes = readdirSync(assets)
  .filter((file) => file.endsWith('.css'))
  .reduce((total, file) => total + gzipped(join(assets, file)), 0);

/* The body weight only. The semibold face is used for headings, which are
   readable in the regular weight if it never arrives. */
const fontPath = join(dist, 'fonts', 'vazirmatn-regular-subset.woff2');
const fontBytes = existsSync(fontPath) ? readFileSync(fontPath).length : 0;

const pages = readdirSync(dist).filter((file) => file.endsWith('.html'));

if (pages.length === 0) {
  console.error('check:weight — dist/ contains no HTML. Did prerender run?');
  process.exit(1);
}

let worst = 0;
const rows = pages.map((page) => {
  const htmlBytes = gzipped(join(dist, page));
  const total = htmlBytes + cssBytes + fontBytes;
  worst = Math.max(worst, total);
  return { page, htmlBytes, total };
});

const budget = BUDGET_KIB * 1024;

for (const { page, htmlBytes, total } of rows) {
  const kib = (total / 1024).toFixed(1);
  const status = total > budget ? 'OVER' : 'pass';
  console.log(
    `  ${status}  ${kib.padStart(6)} KiB  ${page}  (html ${(htmlBytes / 1024).toFixed(1)} + css ${(
      cssBytes / 1024
    ).toFixed(1)} + font ${(fontBytes / 1024).toFixed(1)})`,
  );
}

if (worst > budget) {
  console.error(
    `\ncheck:weight — a page needs ${(worst / 1024).toFixed(1)} KiB to be readable, over the ` +
      `${BUDGET_KIB} KiB budget.\n` +
      `Either bring it back under, or raise BUDGET_KIB in scripts/check-weight.mjs and say why.\n` +
      `If any copy on the site quotes a number, change that too — the point of this check is ` +
      `that the claim and the reality cannot drift apart.`,
  );
  process.exit(1);
}

console.log(
  `\ncheck:weight — every page reads in under ${BUDGET_KIB} KiB. Worst is ${(worst / 1024).toFixed(
    1,
  )} KiB.`,
);
