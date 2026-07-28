import { Vector3 } from 'three';

/**
 * The pull cord, simulated.
 *
 * This is Verlet integration, which is the whole trick: instead of storing a
 * velocity for every point, we store where the point was on the previous frame.
 * The gap between "where it is" and "where it was" *is* the velocity, so a point
 * moves by repeating its last move. That makes the whole thing three lines of
 * maths and — more usefully — it means yanking a point somewhere by hand needs no
 * special case. Move it, and the momentum falls out on its own.
 *
 * After integrating, the chain is pulled back to its proper length a few times
 * over. One pass leaves it stretchy; four passes make it read as rope.
 *
 * No three.js here beyond Vector3, and nothing about rendering. The scene decides
 * how to draw it.
 */

/** Fewer looks jointed. More costs a matrix update per frame for no visual gain. */
export const ROPE_POINTS = 18;

const SEGMENT = 0.2;
const GRAVITY = -19;
/** Air, roughly. Under 0.96 the swing dies before it reads as a swing. */
const DAMPING = 0.978;
/**
 * Constraint passes per frame. This is a soft solver, so the cord always keeps
 * a little give — measured at rest: 2 passes sags 10.5% past its true length,
 * 4 sags 5.2%, 6 sags 3.5%, 12 sags 1.7%. Six is where it stops looking like
 * elastic and the returns flatten out; the cost is 102 vector operations a
 * frame, which is nothing.
 */
const RELAX_PASSES = 6;
/** How far past taut a hand can drag the end before the rope stops giving. */
const STRETCH_LIMIT = 0.42;

export type Rope = {
  /** Anchor first, free end last. Read every frame; never reassigned. */
  readonly points: Vector3[];
  /** Length of the cord when hanging straight. */
  readonly reach: number;
  advance: (delta: number) => void;
  /**
   * Re-hang the cord straight down from wherever the anchor is now, at rest.
   * Needed because the anchor moves with the viewport: without this the cord
   * would spend its first frames whipping across from where it was built.
   */
  reseat: () => void;
  /** Drag the free end toward a world position. */
  hold: (target: Vector3) => void;
  /**
   * Lets go, and reports how hard the cord was being pulled at that moment:
   * 0 to 1, where 1 is where a real pull cord would click. Returned rather than
   * exposed as state so a caller cannot read it after the fact and get zero.
   */
  release: () => number;
  /** Current pull, same scale, for live feedback while the hand is still on it. */
  tension: () => number;
};

/** The pull that counts as a pull, in world units past taut. */
const TRIGGER_STRETCH = 0.34;

export const createRope = (anchor: Vector3): Rope => {
  const reach = SEGMENT * (ROPE_POINTS - 1);

  // Starts hanging straight down and at rest — previous equals current, so the
  // first frame has no inherited motion and the cord does not twitch on mount.
  const points = Array.from(
    { length: ROPE_POINTS },
    (_, i) => new Vector3(anchor.x, anchor.y - i * SEGMENT, anchor.z),
  );
  const previous = points.map((point) => point.clone());

  let held: Vector3 | null = null;
  let stretch = 0;

  const toTarget = new Vector3();
  const between = new Vector3();
  const step = new Vector3();

  return {
    points,
    reach,

    reseat: () => {
      held = null;
      stretch = 0;
      points.forEach((point, i) => {
        point.set(anchor.x, anchor.y - i * SEGMENT, anchor.z);
        // Previous equals current, so the cord inherits no motion from the move.
        previous[i].copy(point);
      });
    },

    hold: (target) => {
      toTarget.subVectors(target, anchor);
      const distance = toTarget.length();
      if (distance < 0.0001) return;

      // Past taut the cord resists rather than growing: the excess is squashed
      // through a curve that can never add more than STRETCH_LIMIT, so a fast
      // drag across the screen still feels like rope and not elastic.
      const excess = Math.max(0, distance - reach);
      stretch = STRETCH_LIMIT * (1 - Math.exp(-excess * 1.6));

      held = (held ?? new Vector3()).copy(anchor).addScaledVector(
        toTarget.divideScalar(distance),
        Math.min(distance, reach + stretch),
      );
    },

    release: () => {
      const pulled = Math.min(1, stretch / TRIGGER_STRETCH);
      held = null;
      stretch = 0;
      return pulled;
    },

    tension: () => Math.min(1, stretch / TRIGGER_STRETCH),

    advance: (delta) => {
      const fall = GRAVITY * delta * delta;

      for (let i = 1; i < points.length; i += 1) {
        const point = points[i];
        step.subVectors(point, previous[i]).multiplyScalar(DAMPING);
        previous[i].copy(point);
        point.add(step);
        point.y += fall;
      }

      // The anchor never moves, and while a hand is on the cord neither does the
      // free end. Everything between them is what the relax passes solve for.
      points[0].copy(anchor);
      previous[0].copy(anchor);
      if (held) points[points.length - 1].copy(held);

      const lastIndex = points.length - 1;
      for (let pass = 0; pass < RELAX_PASSES; pass += 1) {
        for (let i = 0; i < lastIndex; i += 1) {
          const a = points[i];
          const b = points[i + 1];
          between.subVectors(b, a);
          const distance = between.length();
          if (distance < 0.0001) continue;

          const correction = (distance - SEGMENT) / distance;
          const aPinned = i === 0;
          const bPinned = held !== null && i + 1 === lastIndex;
          if (aPinned && bPinned) continue;

          // A pinned neighbour cannot absorb its half, so the free point takes
          // the whole correction instead of the rope quietly going slack.
          const aShare = aPinned ? 0 : bPinned ? 1 : 0.5;
          const bShare = bPinned ? 0 : aPinned ? 1 : 0.5;
          a.addScaledVector(between, correction * aShare);
          b.addScaledVector(between, -correction * bShare);
        }
      }
    },
  };
};
