import { CanvasTexture, LinearFilter } from 'three';

/**
 * The word BIZYNEX, drawn to a canvas so the scene can use it as a mask.
 *
 * Not the logo. CONTEXT.md section 3 forbids putting the mark on a busy
 * background or under effects, and a spotlight sweeping across it is an effect.
 * The *name set in our own typeface* carries no such rule, so that is what this
 * draws — white letters on transparency, used as an alpha mask on a lit plane.
 * Where a letter is, light lands. Where it is not, the room stays dark.
 *
 * A texture is the cheap route to 3D type. The alternative is a font converted
 * to JSON and TextGeometry, which is another asset to self-host, a mesh per
 * glyph, and a build step — for a word that never needs depth.
 */

const WORD = 'BIZYNEX';

/** Wide and short: the word's own proportion, so no pixels are drawn for nothing. */
const WIDTH = 2048;
const HEIGHT = 384;

/** Engineering-drawing tracking. Latin caps at this size need the air. */
const TRACKING = 0.16;

const FONT = (size: number) => `600 ${size}px Vazirmatn, system-ui, sans-serif`;

/** Letter by letter, because ctx.letterSpacing is still missing in some browsers. */
const drawTracked = (context: CanvasRenderingContext2D, size: number) => {
  const spacing = size * TRACKING;
  const letters = [...WORD];
  const widths = letters.map((letter) => context.measureText(letter).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (letters.length - 1);

  let x = (WIDTH - total) / 2;
  letters.forEach((letter, index) => {
    context.fillText(letter, x, HEIGHT / 2);
    x += widths[index] + spacing;
  });
};

export type Wordmark = {
  texture: CanvasTexture;
  /**
   * Every pixel the letters cover, as points in the plane's own coordinates:
   * x and y both run -0.5 to 0.5, so the caller scales them to whatever size the
   * wordmark ended up being on screen.
   *
   * `budget` is a ceiling, not a target — the sampler walks the canvas on a
   * stride wide enough to land under it, so a phone gets a coarser copy of the
   * same shape rather than a cropped one.
   */
  sample: (budget: number) => Float32Array;
};

/**
 * Reads back the letters as points.
 *
 * getImageData on a canvas this size is a few milliseconds and it happens once,
 * off the back of a user gesture — but it is still the single most expensive
 * thing in the opening, which is why the result is handed out as a plain
 * Float32Array for the caller to keep rather than being recomputed.
 */
const samplePixels = (canvas: HTMLCanvasElement, budget: number) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return new Float32Array(0);

  const { data } = context.getImageData(0, 0, WIDTH, HEIGHT);

  // Roughly a fifth of this canvas is ink. Picking the stride from that estimate
  // gets close enough in one go that a second pass is never worth it.
  const inkRatio = 0.2;
  const stride = Math.max(1, Math.round(Math.sqrt((WIDTH * HEIGHT * inkRatio) / budget)));

  const points: number[] = [];
  for (let y = 0; y < HEIGHT; y += stride) {
    for (let x = 0; x < WIDTH; x += stride) {
      // Green channel, matching what the alpha map reads.
      if (data[(y * WIDTH + x) * 4 + 1] < 128) continue;

      // Jittered by up to half a stride so the points do not betray the grid
      // they were read off.
      const jitterX = (Math.random() - 0.5) * stride;
      const jitterY = (Math.random() - 0.5) * stride;
      points.push((x + jitterX) / WIDTH - 0.5, 0.5 - (y + jitterY) / HEIGHT, 0);
    }
  }

  return new Float32Array(points);
};

/**
 * Returns a texture that draws itself immediately and redraws once Vazirmatn has
 * loaded. Waiting for the font first would mean an empty room on a slow
 * connection; the first pass in the fallback face is close enough in weight that
 * the swap is invisible in a dim scene.
 */
export const createWordmarkTexture = (): Wordmark => {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  // The mask is a smooth gradient of coverage, not detail — mipmaps would only
  // soften the edges of type that is already the largest thing on screen.
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;

  const sample = (budget: number) => samplePixels(canvas, budget);

  if (!context) return { texture, sample };

  const paint = () => {
    // Opaque black behind white type, rather than transparency. An alpha map
    // reads the green channel, not the alpha channel, so a mask drawn this way
    // is exact — and it sidesteps the premultiplied-alpha differences between
    // browsers that would otherwise show up as grey fringing on the letters.
    context.fillStyle = '#000000';
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.font = FONT(HEIGHT * 0.62);
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    drawTracked(context, HEIGHT * 0.62);
    texture.needsUpdate = true;
  };

  paint();

  // Redraw when the real face arrives. Guarded because document.fonts is absent
  // in older Safari, where the fallback face is simply what ships.
  document.fonts?.load(FONT(HEIGHT * 0.62), WORD).then(paint).catch(() => undefined);

  return { texture, sample };
};
