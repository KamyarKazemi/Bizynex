/**
 * Produces the logo files the site actually loads, from the PNG masters in
 * brand/ (which is not served — the masters are 94 KB and nothing should ever
 * download them).
 *
 * Run by hand after replacing a master:
 *   npm run build:images
 *
 * Like the font script, this is not wired into `npm run build`: the outputs are
 * committed, so a deploy never depends on native image tooling installing.
 *
 * Palette PNG, not WebP. The brief asked for WebP/AVIF, which is the right
 * default for photographs — but this is flat two-colour artwork, and measured on
 * these exact files a palette PNG beats every alternative by a wide margin:
 *
 *   palette png  1.8 KB   webp nearlossless  8.5 KB
 *   avif q70     7.8 KB   webp lossless     10.7 KB
 *
 * Above 16 colours the file size stops moving, so the palette is set high enough
 * that the 45-degree edges stay smoothly antialiased for free.
 */
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const masters = join(root, 'brand');
const output = join(root, 'public', 'brand');

// Must match the tokens in src/styles/tokens.css.
const NAVY = [0x12, 0x2a, 0x3e];
const TEAL = [0x17, 0xa0, 0x96];
const INK_ON_DARK = [0xe4, 0xe9, 0xee];

const distance = (pixels, offset, colour) =>
  Math.hypot(
    pixels[offset] - colour[0],
    pixels[offset + 1] - colour[1],
    pixels[offset + 2] - colour[2],
  );

/**
 * Repaints the navy in the mark to the dark theme's ink colour, leaving the two
 * teal segments alone. A navy logo on a navy page is an invisible logo, and
 * `filter: invert()` would turn the teal pink.
 *
 * Each pixel is scored on how teal it is versus how navy it is, then mixed
 * accordingly — so the antialiased edges where teal meets navy stay smooth
 * instead of tearing into a hard line. Alpha is never touched, which is what
 * keeps the outer edges of the mark clean.
 */
const repaintForDarkTheme = (pixels) => {
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] === 0) continue;

    const toNavy = distance(pixels, offset, NAVY);
    const toTeal = distance(pixels, offset, TEAL);
    const total = toNavy + toTeal;
    const tealness = total === 0 ? 0 : toNavy / total;

    for (let channel = 0; channel < 3; channel += 1) {
      pixels[offset + channel] = Math.round(
        INK_ON_DARK[channel] * (1 - tealness) + TEAL[channel] * tealness,
      );
    }
  }
  return pixels;
};

// Roughly three times the largest size either mark is ever rendered at, so a
// 3x screen shows no softness.
const TARGETS = [
  { source: 'bizynex-stacked-transparent.png', name: 'bizynex-stacked', width: 384 },
  { source: 'bizynex-horizontal-transparent-trimmed.png', name: 'bizynex-horizontal', width: 448 },
];

const encode = (image) =>
  image.png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 });

for (const target of TARGETS) {
  const sourcePath = join(masters, target.source);
  const { size: before } = await stat(sourcePath);
  const resized = sharp(sourcePath).resize({ width: target.width });

  const light = await encode(resized.clone()).toFile(join(output, `${target.name}.png`));

  const { data, info } = await resized
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const dark = await encode(
    sharp(repaintForDarkTheme(data), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }),
  ).toFile(join(output, `${target.name}-dark.png`));

  console.log(
    `${target.name.padEnd(20)} ${String(light.width).padStart(4)}x${light.height}  ` +
      `${(before / 1024).toFixed(1)} KB -> light ${(light.size / 1024).toFixed(1)} KB, ` +
      `dark ${(dark.size / 1024).toFixed(1)} KB`,
  );
}
