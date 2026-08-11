/**
 * Produces the 1200×630 share card at public/brand/og-cover.png, plus the
 * favicon and icon set.
 *
 * Run by hand after the copy or the logo changes:
 *   npm run build:og
 *
 * Not wired into `npm run build`, for the same reason build-images.mjs is not:
 * the outputs are committed, so a deploy never depends on native image tooling
 * installing on the runner.
 *
 * ## Why the text is rendered here rather than written into an SVG
 *
 * Persian needs bidirectional layout and contextual glyph shaping — the same
 * letter has four forms depending on its neighbours. An SVG <text> element
 * handed to a rasteriser gets that right only if the rasteriser happens to run
 * a real shaping engine. sharp's text input runs Pango, which does, so this is
 * the one path that cannot silently produce disconnected letters.
 *
 * `fontfile` points straight at the npm package rather than at an installed
 * system font, so the script produces the same bytes on any machine.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'public', 'brand');
const FONT = join(root, 'node_modules', 'vazirmatn', 'fonts', 'ttf', 'Vazirmatn-SemiBold.ttf');

/* Must match the tokens in src/styles/tokens.css. */
const NAVY = '#122A3E';
const TEAL = '#17A096';
const INK_ON_DARK = '#E4E9EE';
const MUTED_ON_DARK = '#8FA3B4';

const WIDTH = 1200;
const HEIGHT = 630;
/** Nothing meaningful goes outside this. Social crops nibble at the edges. */
const MARGIN = 88;

/**
 * The card is dark in both themes. A share card has no theme to follow — it is
 * pasted into someone else's surface — so it picks the one that reads as us.
 */
const headline = 'وب‌سایت، اپلیکیشن و اتوماسیون';
const subline = 'برای کسب‌وکارها — شیراز';

/** Pango markup, so colour and size travel with the string. */
const text = async (markup, { size, width, colour }) =>
  sharp({
    text: {
      text: `<span size="${size * 1024}" foreground="${colour}">${markup}</span>`,
      fontfile: FONT,
      font: 'Vazirmatn',
      rgba: true,
      width,
      align: 'right',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });

/**
 * The construction system from the favicon: right angles and 45-degree
 * diagonals. One teal stroke, low in the frame, so the card is recognisably
 * ours without competing with the wordmark.
 */
const accent = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
     <g fill="none" stroke="${TEAL}" stroke-width="3" opacity="0.9">
       <path d="M${MARGIN} ${HEIGHT - MARGIN} l64 -64" />
     </g>
     <g fill="none" stroke="${INK_ON_DARK}" stroke-width="3" opacity="0.14">
       <path d="M${MARGIN + 64} ${HEIGHT - MARGIN - 64} l220 -220" />
     </g>
   </svg>`,
);

const logo = await sharp(join(brand, 'bizynex-horizontal-dark.png'))
  .resize({ width: 340 })
  .toBuffer({ resolveWithObject: true });

const title = await text(headline, { size: 62, width: WIDTH - MARGIN * 2, colour: INK_ON_DARK });
const sub = await text(subline, { size: 32, width: WIDTH - MARGIN * 2, colour: MUTED_ON_DARK });

/** Right-aligned, because the language is. */
const right = (item) => WIDTH - MARGIN - item.info.width;

await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 4, background: NAVY },
})
  .composite([
    { input: accent, top: 0, left: 0 },
    { input: logo.data, top: MARGIN, left: right(logo) },
    { input: title.data, top: 300, left: right(title) },
    { input: sub.data, top: 300 + title.info.height + 28, left: right(sub) },
  ])
  .png()
  .toFile(join(brand, 'og-cover.png'));

/**
 * Icons — all of them the mark on its own, not the full lockup.
 *
 * Every icon here is a raster cut from the same mark: the browser tab wants 32
 * and 48, Google's favicon crawler wants at least 48×48 and square, iOS wants a
 * 180×180 with no transparency, and Android's install prompt wants the two
 * manifest sizes.
 *
 * The lockup is the mark stacked over the wordmark. At 96px the wordmark is a
 * few pixels tall and reads as a grey smudge; at 32px it is not there at all,
 * and the mark it is stealing room from has been shrunk to make space for it.
 * An icon has one job at that size, so these crop to the mark and drop the word.
 *
 * Cut from the transparent master in brand/, which is not served and is the one
 * file that still carries the mark at full resolution on a clear ground. The
 * crop takes the upper region and then lets `trim` find the real bounding box,
 * rather than trusting a hand-typed one that a redrawn master would silently
 * invalidate.
 */
const MASTER = join(root, 'brand', 'bizynex-stacked-transparent.png');
const { width: masterWidth, height: masterHeight } = await sharp(MASTER).metadata();
const mark = await sharp(
  await sharp(MASTER)
    .extract({
      left: 0,
      top: 0,
      width: masterWidth,
      // The wordmark sits in the lower ~40%. This only has to clear it; trim
      // does the precise work.
      height: Math.round(masterHeight * 0.58),
    })
    .png()
    .toBuffer(),
)
  .trim({ threshold: 1 })
  .png()
  .toBuffer();

/**
 * Square, padded, on paper — an icon cropped to its own bounding box looks wrong.
 *
 * `opaque` is not cosmetic, and it is not something `extend` can do for us:
 * `extend` paints only the border it adds, while the letterbox that
 * `resize({ fit: 'contain' })` leaves and the mark's own transparency both stay
 * clear. That is exactly right for a maskable launcher icon and wrong for iOS,
 * which composites an apple-touch icon onto black and so loses a navy wordmark
 * entirely. Only `flatten` makes the whole square opaque.
 *
 * It has to be a second pass. sharp runs its operations in pipeline order, not
 * call order, and flatten comes *before* resize in that order — chained onto the
 * pipeline below it would strip the mark's alpha and then the transparent resize
 * background would put an alpha channel straight back. Flattening the finished
 * square instead is order-independent, and it leaves the two variants composed
 * identically, so the opaque pair and the maskable pair cannot drift apart.
 */
const icon = async (size, background, opaque = false) => {
  const square = await sharp(mark)
    .resize({
      width: Math.round(size * 0.78),
      height: Math.round(size * 0.78),
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round(size * 0.11),
      bottom: size - Math.round(size * 0.78) - Math.round(size * 0.11),
      left: Math.round(size * 0.11),
      right: size - Math.round(size * 0.78) - Math.round(size * 0.11),
      background,
    })
    .png()
    .toBuffer();

  const pipe = sharp(square);
  return (opaque ? pipe.flatten({ background }) : pipe).png({ palette: true }).toBuffer();
};

const PAPER = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/* Flattened opaque: iOS composites this onto the home screen with no background
   of its own, and an unflattened square would come out black behind the mark. */
await writeFile(join(brand, 'apple-touch-icon.png'), await icon(180, PAPER, true));
/* Google's favicon crawler. Flattened opaque, because it renders on a white results row. */
await writeFile(join(brand, 'icon-96.png'), await icon(96, PAPER, true));
/* Manifest icons stay transparent — not flattened — so the launcher can mask them. */
await writeFile(join(brand, 'icon-192.png'), await icon(192, TRANSPARENT));
await writeFile(join(brand, 'icon-512.png'), await icon(512, TRANSPARENT));

/**
 * The browser-tab favicon, replacing the placeholder SVG that used to sit here.
 *
 * Opaque rather than transparent, and that is the whole decision: the mark is
 * navy, and a transparent navy mark disappears into a dark tab strip. A paper
 * tile is legible in both, which a favicon has to be — it is the one icon a
 * visitor sees before they have chosen anything.
 *
 * Two sizes because browsers pick per display density and a 32 upscaled to 48
 * on a Retina tab strip is visibly soft.
 */
await writeFile(join(brand, 'favicon-32.png'), await icon(32, PAPER, true));
await writeFile(join(brand, 'favicon-48.png'), await icon(48, PAPER, true));

console.log(
  'build:og — og-cover.png, apple-touch-icon.png, icon-{96,192,512}.png, favicon-{32,48}.png written',
);
