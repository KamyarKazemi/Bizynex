/**
 * The construction system behind every geometric mark on this site.
 *
 * Every segment is either orthogonal or at exactly 45 degrees, on an 8-unit
 * square grid centred on the origin — the same rule the logo is built from.
 * CONTEXT.md section 3 allows the *system* to be reused and forbids reusing the
 * *logo*, so this composes a related woven figure rather than reproducing the
 * mark.
 *
 * This file imports nothing. The WebGL scene and the static SVG fallback both
 * read from it, which is what keeps them showing the same composition.
 */

export type Point = readonly [number, number];

export type Segment = {
  readonly a: Point;
  readonly b: Point;
  /** Teal. Only ever two of these — see the 1.4% ratio in CONTEXT.md. */
  readonly accent?: boolean;
};

/** Half-width of the grid. Coordinates run -4..4 on both axes. */
export const EXTENT = 4;

/**
 * Stroke weight, in grid units.
 *
 * The logo mark is drawn at roughly a seventh of its own width — it is a solid,
 * confident form. A hairline lattice beside it reads as a different visual
 * language entirely, so this is deliberately heavy enough to rhyme with the
 * mark while staying light enough that nineteen overlapping segments do not
 * collapse into a mass.
 */
export const STROKE = 0.24;

/**
 * The assembled figure: four L-shaped arms, two diagonals that weave, and two
 * teal segments sitting on one diagonal either side of the crossing.
 *
 * The north-west diagonal is broken at the centre and the north-east one runs
 * through it. That gap is the whole weave — it is what makes two flat lines
 * read as one passing over the other.
 */
export const WOVEN_FIGURE: readonly Segment[] = [
  // Four corner arms.
  { a: [-4, 4], b: [-1.4, 4] },
  { a: [-4, 4], b: [-4, 1.4] },
  { a: [4, 4], b: [1.4, 4] },
  { a: [4, 4], b: [4, 1.4] },
  { a: [-4, -4], b: [-1.4, -4] },
  { a: [-4, -4], b: [-4, -1.4] },
  { a: [4, -4], b: [1.4, -4] },
  { a: [4, -4], b: [4, -1.4] },

  // The interrupted diagonal — passes under.
  { a: [-4, 4], b: [-0.55, 0.55] },
  { a: [0.55, -0.55], b: [4, -4] },

  // The continuous diagonal — passes over — carrying the two teal segments.
  { a: [-4, -4], b: [-2.1, -2.1] },
  { a: [-2.1, -2.1], b: [-1.3, -1.3], accent: true },
  { a: [-1.3, -1.3], b: [1.3, 1.3] },
  { a: [1.3, 1.3], b: [2.1, 2.1], accent: true },
  { a: [2.1, 2.1], b: [4, 4] },

  // Inner counter-form: the small square the arms imply but never close.
  { a: [-1.4, 4], b: [-1.4, 2.6] },
  { a: [1.4, 4], b: [1.4, 2.6] },
  { a: [-1.4, -4], b: [-1.4, -2.6] },
  { a: [1.4, -4], b: [1.4, -2.6] },
];

export type Segment3D = Segment & {
  /**
   * Which layer of the weave this sits on: -1 passes behind, +1 in front, 0 is
   * the flat frame. Multiplied by the bar thickness, so the offset is always
   * exactly enough to clear and never a number anyone has to tune.
   */
  readonly depth: -1 | 0 | 1;
};

/**
 * The same figure, built to be looked at from an angle.
 *
 * The flat version fakes the weave: the north-west diagonal is *broken* at the
 * centre so the other appears to pass over it. That trick only works head-on —
 * rotate it even slightly and the gap reads as a gap. So here both diagonals run
 * unbroken and are separated in depth instead, which is what the drawing was
 * always describing. The weave stops being a drawing convention and becomes true.
 *
 * Same 8-unit grid, same right angles and 45s, same two teal segments at the
 * same 1.4%. CONTEXT.md section 3 reuses the system, never the mark.
 */
export const WOVEN_FIGURE_3D: readonly Segment3D[] = [
  // Four corner arms — the frame, flat at the centre plane.
  { a: [-4, 4], b: [-1.4, 4], depth: 0 },
  { a: [-4, 4], b: [-4, 1.4], depth: 0 },
  { a: [4, 4], b: [1.4, 4], depth: 0 },
  { a: [4, 4], b: [4, 1.4], depth: 0 },
  { a: [-4, -4], b: [-1.4, -4], depth: 0 },
  { a: [-4, -4], b: [-4, -1.4], depth: 0 },
  { a: [4, -4], b: [1.4, -4], depth: 0 },
  { a: [4, -4], b: [4, -1.4], depth: 0 },

  // Unbroken now, and genuinely behind.
  { a: [-4, 4], b: [4, -4], depth: -1 },

  // Unbroken and genuinely in front, carrying the two teal segments.
  { a: [-4, -4], b: [-2.1, -2.1], depth: 1 },
  { a: [-2.1, -2.1], b: [-1.3, -1.3], accent: true, depth: 1 },
  { a: [-1.3, -1.3], b: [1.3, 1.3], depth: 1 },
  { a: [1.3, 1.3], b: [2.1, 2.1], accent: true, depth: 1 },
  { a: [2.1, 2.1], b: [4, 4], depth: 1 },

  // Inner counter-form: the small square the arms imply but never close.
  { a: [-1.4, 4], b: [-1.4, 2.6], depth: 0 },
  { a: [1.4, 4], b: [1.4, 2.6], depth: 0 },
  { a: [-1.4, -4], b: [-1.4, -2.6], depth: 0 },
  { a: [1.4, -4], b: [1.4, -2.6], depth: 0 },
];

/**
 * Deterministic pseudo-random in [0, 1). Seeded so the scattered state is
 * identical on every load and every device — the composition is designed, not
 * rolled fresh each visit.
 */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Snaps an angle to the nearest 45 degrees. Nothing here is ever off-grid. */
const snapTo45 = (radians: number) => Math.round(radians / (Math.PI / 4)) * (Math.PI / 4);

export type Vector3 = readonly [number, number, number];

export type LatticeSegment = {
  /** Where it sits when the drawing is assembled. */
  readonly a: Vector3;
  readonly b: Vector3;
  /** Where it drifts to as the visitor scrolls away. */
  readonly looseA: Vector3;
  readonly looseB: Vector3;
  /** 1 for the two teal segments, 0 otherwise. */
  readonly accent: number;
  /** 1 for the figure itself, 0 for the sheet it is drawn on. */
  readonly core: number;
  readonly seed: number;
};

const PLANE_ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

/** Places a segment of a given length about a centre, at a snapped angle. */
const place = (centre: Vector3, length: number, angle: number) => {
  const halfX = (Math.cos(angle) * length) / 2;
  const halfY = (Math.sin(angle) * length) / 2;
  return {
    a: [centre[0] - halfX, centre[1] - halfY, centre[2]] as Vector3,
    b: [centre[0] + halfX, centre[1] + halfY, centre[2]] as Vector3,
  };
};

/** Four receding layers of rule lines. */
const SHEET_LAYERS = 4;
const SEGMENTS_PER_LAYER = 84;

/**
 * The whole scene, as one flat list of segments.
 *
 * Assembled, it reads as a technical drawing: the woven figure sitting on a
 * sheet of rule lines receding behind it. Dispersed, every segment has turned to
 * a different 45-degree multiple and pulled apart in depth — the same parts, not
 * yet put together.
 *
 * The sheet is not decoration. It is the argument the brand makes, drawn:
 * structure everywhere, and one small deliberate signal that it was engineered.
 */
export const buildLattice = (): LatticeSegment[] => {
  const segments: LatticeSegment[] = [];

  WOVEN_FIGURE.forEach((segment, index) => {
    const length = Math.hypot(segment.b[0] - segment.a[0], segment.b[1] - segment.a[1]);
    const loose = place(
      [
        ((segment.a[0] + segment.b[0]) / 2) * 2.4,
        ((segment.a[1] + segment.b[1]) / 2) * 2.4,
        (seededRandom(index + 11) - 0.5) * 9,
      ],
      length,
      snapTo45(seededRandom(index + 1) * Math.PI * 2),
    );

    segments.push({
      a: [segment.a[0], segment.a[1], 0],
      b: [segment.b[0], segment.b[1], 0],
      looseA: loose.a,
      looseB: loose.b,
      accent: segment.accent === true ? 1 : 0,
      core: 1,
      seed: index / WOVEN_FIGURE.length,
    });
  });

  for (let layer = 0; layer < SHEET_LAYERS; layer += 1) {
    const depth = -2.2 - layer * 1.7;
    const reach = 9 + layer * 1.6;

    for (let i = 0; i < SEGMENTS_PER_LAYER; i += 1) {
      const key = layer * 997 + i * 31 + 7;
      const gx = Math.round((seededRandom(key) * 2 - 1) * reach);
      const gy = Math.round((seededRandom(key + 3) * 2 - 1) * reach);
      const length = 1 + Math.round(seededRandom(key + 5) * 3);

      // Mostly orthogonal, so the sheet reads as ruled; a minority on the
      // diagonal keeps it inside the same system as the mark.
      const roll = seededRandom(key + 9);
      const angle = roll < 0.44 ? 0 : roll < 0.88 ? Math.PI / 2 : Math.PI / 4;

      const assembled = place([gx, gy, depth], length, angle);
      const loose = place(
        [gx * 1.55, gy * 1.55, depth - seededRandom(key + 13) * 7],
        length,
        PLANE_ANGLES[Math.floor(seededRandom(key + 17) * PLANE_ANGLES.length)],
      );

      segments.push({
        a: assembled.a,
        b: assembled.b,
        looseA: loose.a,
        looseB: loose.b,
        accent: 0,
        core: 0,
        seed: seededRandom(key + 23),
      });
    }
  }

  return segments;
};
