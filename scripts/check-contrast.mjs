/**
 * Fails if any text/background pair in either theme drops below the
 * accessibility floor in CLAUDE.md section 5.
 *
 *   npm run check:contrast
 *
 * Reads the real token values out of src/styles/tokens.css, so it cannot drift
 * from what ships. Run it after changing any colour — brand teal in particular
 * looks fine and fails at 3.23:1, which is exactly the kind of mistake that gets
 * shipped because it looked right.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8');

const readTokens = (theme) => {
  // The first definition of each token is the light value; the explicit
  // data-theme block below it holds the dark overrides.
  const tokens = {};
  for (const [, key, value] of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)) {
    if (!(key in tokens)) tokens[key] = value;
  }
  if (theme === 'light') return tokens;

  const darkBlock = css.slice(css.indexOf(":root[data-theme='dark']"));
  for (const [, key, value] of darkBlock.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)) {
    tokens[key] = value;
  }
  return tokens;
};

const channel = (value) => {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const rgb = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((rgb >> 16) & 255) +
    0.7152 * channel((rgb >> 8) & 255) +
    0.0722 * channel(rgb & 255)
  );
};

const contrast = (foreground, background) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

/** [description, foreground token, background token, minimum ratio] */
const PAIRS = [
  ['body text on page', 'ink', 'paper', 4.5],
  ['body text on surface', 'ink', 'surface', 4.5],
  ['nav and secondary text', 'ink-soft', 'paper', 4.5],
  ['labels and meta on page', 'muted', 'paper', 4.5],
  ['labels and meta on surface', 'muted', 'surface', 4.5],
  ['teal link on page', 'accent-text', 'paper', 4.5],
  // The hero panel. Covers the DOM heading shown whenever the scene is not
  // drawing, and the copy the scene itself paints, which use the same token.
  ['hero heading on panel', 'ink', 'panel', 4.5],
  // The opening rooms (Intro, Overture). Always dark in both themes, so both
  // passes below check the same numbers — that is the point. These went
  // unchecked once and a 2.14:1 skip button shipped, which is the control a
  // visitor needs most.
  ['opening room text', 'opening-ink', 'opening', 4.5],
  ['opening room skip and mute controls', 'opening-muted', 'opening', 4.5],
  ['opening room teal mark', 'opening-accent', 'opening', 4.5],
  // The emphasis mark. The wash carries body text, so it is held to the body
  // floor rather than to the 3:1 a decorative fill would need.
  ['marked phrase on its wash', 'ink', 'mark', 4.5],
  ['mark rule against the page', 'mark-rule', 'paper', 3],
  ['mark rule against the wash', 'mark-rule', 'mark', 3],
  ['action label on accent fill', 'on-accent', 'accent-fill', 4.5],
  ['action label on hover fill', 'on-accent', 'accent-hover', 4.5],
  ['focus ring against page', 'accent-text', 'paper', 3],
];

let failures = 0;

for (const theme of ['light', 'dark']) {
  const tokens = readTokens(theme);
  console.log(`\n${theme}`);

  for (const [label, foreground, background, floor] of PAIRS) {
    const ratio = contrast(tokens[foreground], tokens[background]);
    const passed = ratio >= floor;
    if (!passed) failures += 1;

    console.log(
      `  ${passed ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}:1  min ${floor}  ` +
        `${label} (${tokens[foreground]} on ${tokens[background]})`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} pair(s) below the floor.`);
  process.exit(1);
}
console.log('\nAll pairs pass in both themes.');
