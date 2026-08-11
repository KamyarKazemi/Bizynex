import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

/**
 * The hero's words, drawn to a canvas so they can stand at a real depth in the
 * scene and be occluded by the mark in front of them.
 *
 * Persian is laid out by the browser's own text engine here, not by us: a 2D
 * canvas shapes, joins, and orders the script exactly as the DOM would, so ZWNJ,
 * the initial/medial/final forms and the RTL run all come out right. Writing a
 * glyph atlas by hand would get every one of those wrong.
 *
 * This is a *copy* of the words, never the only one. src/sections/Hero.tsx keeps
 * the real heading and paragraph in the DOM, reading from the same `fa.hero`
 * object, so assistive technology, find-in-page and a visitor without WebGL are
 * all looking at genuine text. The two cannot drift because there is one source.
 *
 * What is genuinely lost on the WebGL path: selecting and copying the sentence.
 * Browser font scaling is not — see `rootScale` below.
 *
 * None of that is a trade a phone has to make. A portrait panel has no width to
 * spare, so the scene does not draw this at all there and the DOM heading is the
 * only one — see the two compositions in HeroScene.
 */

export type CopyPlate = {
  texture: CanvasTexture;
  /** Width divided by height of the block, for sizing the plane it goes on. */
  aspect: () => number;
  /** Redraws the words in a new colour. The theme changing is the only caller. */
  setInk: (next: string) => void;
  /**
   * Redraws at the resolution the block is actually being shown at, in device
   * pixels. Every size below is a fraction of the width, so the wrap points and
   * the proportions come out identical whatever this is set to — only the
   * sharpness changes.
   */
  setWidth: (next: number) => void;
  dispose: () => void;
};

/**
 * Texture width bounds, in device pixels.
 *
 * There are no mipmaps here — a block of text does not want them — so a texture
 * larger than the pixels it lands on does not sharpen the words, it makes them
 * crawl: every frame of drift resamples the same strokes differently. The
 * ceiling is where a desktop panel already lands. The floor is where Persian
 * starts to soften, and a phone that is drawing this at all is well above it.
 */
const MIN_WIDTH = 768;
const MAX_WIDTH = 1536;

/** Redraw in steps, so dragging a window edge is not a text layout per frame. */
const WIDTH_STEP = 256;

const clampWidth = (px: number) =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(px / WIDTH_STEP) * WIDTH_STEP));

/** Fractions of the texture width. The hierarchy is size and weight only. */
const TITLE_SIZE = 0.082;
const SUBTITLE_SIZE = 0.039;
const GAP = 0.045;

/** Persian needs more air than Latin — CONTEXT.md section 7. */
const TITLE_LEADING = 1.4;
const SUBTITLE_LEADING = 1.8;

const font = (weight: number, size: number) => `${weight} ${size}px Vazirmatn, system-ui, sans-serif`;

/** Greedy wrap. Splits on spaces only, so a ZWNJ never becomes a line break. */
const wrap = (context: CanvasRenderingContext2D, text: string, limit: number) => {
  const lines: string[] = [];
  let line = '';

  text.split(' ').forEach((word) => {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (line !== '' && context.measureText(candidate).width > limit) {
      lines.push(line);
      line = word;
      return;
    }
    line = candidate;
  });

  if (line !== '') lines.push(line);
  return lines;
};

/**
 * `onRedraw` fires when the block's proportions change — the web font arriving
 * is the usual reason — so the scene can resize the plane it sits on.
 */
export const createCopyPlate = (
  title: string,
  subtitle: string,
  ink: string,
  onRedraw: () => void,
): CopyPlate => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;

  let ratio = 4;
  let currentInk = ink;
  let width = MAX_WIDTH;
  let disposed = false;

  const paint = () => {
    if (disposed || !context) return;

    // Honours the reader's own font size. Someone who has set their browser to
    // 24px gets larger type here too, which is the one accessibility guarantee
    // a canvas would otherwise quietly drop.
    const rootScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;

    const titleSize = width * TITLE_SIZE * rootScale;
    const subtitleSize = width * SUBTITLE_SIZE * rootScale;

    context.font = font(600, titleSize);
    const titleLines = wrap(context, title, width);

    context.font = font(400, subtitleSize);
    const subtitleLines = wrap(context, subtitle, width * 0.92);

    const titleBlock = titleLines.length * titleSize * TITLE_LEADING;
    const subtitleBlock = subtitleLines.length * subtitleSize * SUBTITLE_LEADING;
    const height = Math.ceil(titleBlock + width * GAP + subtitleBlock);

    canvas.width = width;
    canvas.height = height;

    // Sizing the canvas resets every context property, so everything below has
    // to be set again — including the direction, which is the whole point.
    context.direction = 'rtl';
    context.textAlign = 'right';
    context.textBaseline = 'top';
    context.fillStyle = currentInk;

    let y = 0;
    context.font = font(600, titleSize);
    titleLines.forEach((line) => {
      context.fillText(line, width, y + titleSize * (TITLE_LEADING - 1) * 0.5);
      y += titleSize * TITLE_LEADING;
    });

    y += width * GAP;
    context.font = font(400, subtitleSize);
    subtitleLines.forEach((line) => {
      context.fillText(line, width, y + subtitleSize * (SUBTITLE_LEADING - 1) * 0.5);
      y += subtitleSize * SUBTITLE_LEADING;
    });

    texture.needsUpdate = true;

    const next = width / height;
    if (Math.abs(next - ratio) > 0.001) {
      ratio = next;
      onRedraw();
    }
  };

  paint();

  // Redraw once the real face lands. Until then this is the fallback face at the
  // same weight, which in a dark scene is very close — and the alternative is an
  // empty panel on exactly the connections CONTEXT.md section 8 tells us to plan
  // for. Guarded because document.fonts is absent in older Safari.
  document.fonts?.ready.then(paint).catch(() => undefined);

  return {
    texture,
    aspect: () => ratio,
    setInk: (next: string) => {
      if (next === currentInk) return;
      currentInk = next;
      paint();
    },
    setWidth: (next: number) => {
      const clamped = clampWidth(next);
      if (clamped === width) return;
      width = clamped;
      paint();
    },
    // The font-ready redraw above is fire-and-forget and can land long after the
    // hero has gone. Left unguarded it repaints a disposed texture and calls
    // `onRedraw` back into a scene whose uniforms and React tree are both gone.
    dispose: () => {
      disposed = true;
      texture.dispose();
    },
  };
};
