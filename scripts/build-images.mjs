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
 * default for photographs — but this is flat two-colour artwork, and measured
 * on these exact files a palette PNG beats every alternative by a wide margin:
 *
 *   palette png  1.8 KB   webp nearlossless  8.5 KB
 *   avif q70     7.8 KB   webp lossless     10.7 KB
 *
 * Above 16 colours the file size stops moving, so the palette is set high
 * enough that the 45-degree edges stay smoothly antialiased for free.
 */
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const masters = join(root, 'brand');
const output = join(root, 'public', 'brand');

// Roughly three times the largest size either mark is ever rendered at, so a
// 3x screen shows no softness.
const TARGETS = [
  { source: 'bizynex-stacked-transparent.png', name: 'bizynex-stacked.png', width: 384 },
  {
    source: 'bizynex-horizontal-transparent-trimmed.png',
    name: 'bizynex-horizontal.png',
    width: 448,
  },
];

for (const target of TARGETS) {
  const sourcePath = join(masters, target.source);
  const { size: before } = await stat(sourcePath);

  const info = await sharp(sourcePath)
    .resize({ width: target.width })
    .png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 })
    .toFile(join(output, target.name));

  console.log(
    `${target.name.padEnd(26)} ${String(info.width).padStart(4)}x${info.height}  ` +
      `${(before / 1024).toFixed(1)} KB -> ${(info.size / 1024).toFixed(1)} KB`,
  );
}
