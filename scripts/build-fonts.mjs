/**
 * Subsets Vazirmatn to the character ranges this site actually renders and
 * writes the result to public/fonts/.
 *
 * Run manually after changing copy that introduces new characters:
 *   node scripts/build-fonts.mjs
 *
 * Deliberately NOT part of `npm run build`. The subset files are committed, so
 * a broken font toolchain can never break a deploy — and CONTEXT.md 8 assumes
 * we cannot rely on reaching npm when we need to ship.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'vazirmatn', 'fonts', 'webfonts');
const outDir = join(root, 'public', 'fonts');

// Latin basic, Latin-1, the Arabic block (Persian letters, Persian digits,
// Persian punctuation), the zero-width joiners, and general punctuation.
// The Arabic block is kept whole rather than reduced to the exact glyphs in
// fa.ts so that editing Persian copy does not silently produce tofu.
const RANGES = [
  [0x0020, 0x007e],
  [0x00a0, 0x00ff],
  [0x0600, 0x06ff],
  [0x200c, 0x200f],
  [0x2010, 0x205e],
];

const characters = RANGES.flatMap(([start, end]) =>
  Array.from({ length: end - start + 1 }, (_, i) => String.fromCodePoint(start + i)),
).join('');

const WEIGHTS = ['Regular', 'SemiBold'];

await mkdir(outDir, { recursive: true });

for (const weight of WEIGHTS) {
  const input = await readFile(join(source, `Vazirmatn-${weight}.woff2`));
  const output = await subsetFont(input, characters, { targetFormat: 'woff2' });
  await writeFile(join(outDir, `vazirmatn-${weight.toLowerCase()}-subset.woff2`), output);
  const saved = (100 - (output.length / input.length) * 100).toFixed(0);
  console.log(
    `${weight}: ${(input.length / 1024).toFixed(1)} KB -> ${(output.length / 1024).toFixed(1)} KB (-${saved}%)`,
  );
}
