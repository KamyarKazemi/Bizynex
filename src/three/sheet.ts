import { BufferAttribute, BufferGeometry, Color, DoubleSide, ShaderMaterial, Vector2 } from 'three';
import { buildLattice } from './geometry';

/**
 * The sheet of rule lines the hero's mark is drawn on.
 *
 * Every segment is a quad, not a line. WebGL ignores line width on every desktop
 * browser, so a `LineSegments` version would draw hairlines however heavy the
 * SVG fallback is — and the two are meant to be the same drawing.
 *
 * All of it lives in one buffer and one draw call. `position` carries the
 * assembled start point; the end point and both dispersed points ride along as
 * attributes, so a segment can be rebuilt, offset and turned entirely on the GPU.
 *
 * This is the back layer of the hero and nothing else. The figure itself is a
 * lit, extruded object now — see HeroScene — so only the sheet is drawn here.
 */

const VERTEX = /* glsl */ `
  attribute vec3 aEnd;
  attribute vec3 aStartLoose;
  attribute vec3 aEndLoose;
  attribute float aSide;
  attribute float aAlong;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uTime;
  uniform float uStroke;
  uniform vec2 uPointer;
  uniform float uFloor;
  uniform float uFloorFade;

  varying float vFade;

  void main() {
    vec3 start = mix(position, aStartLoose, uProgress);
    vec3 end = mix(aEnd, aEndLoose, uProgress);

    // Ambient drift, applied to both ends equally so segments stay rigid.
    // Small on purpose: a drawing that breathes, not something floating.
    vec3 drift = vec3(
      sin(uTime * 0.18 + aSeed * 19.7) * 0.07,
      cos(uTime * 0.14 + aSeed * 11.3) * 0.05,
      sin(uTime * 0.25 + aSeed * 6.2831) * 0.14
    );
    start += drift;
    end += drift;

    vec3 here = mix(start, end, aAlong);

    // Pointer tension: the sheet eases away from the cursor and settles back.
    // Falls off fast, so it reads as paper flexing, not as a cursor toy.
    vec2 away = here.xy - uPointer;
    float distance = length(away);
    if (distance > 0.001) {
      here.xy += (away / distance) * exp(-distance * 0.42) * 0.55 * (1.0 - uProgress);
    }

    vec3 along = end - start;
    float span = length(along);
    if (span > 0.0001) {
      here += normalize(cross(along / span, vec3(0.0, 0.0, 1.0))) * aSide * uStroke * 0.5;
    }

    // Depth does the rest: further back is fainter, so the sheet recedes without
    // a single gradient call. This is the layer the whole composition sits on.
    float depth = smoothstep(-13.0, 0.5, here.z);
    vFade = 0.34 * depth * (1.0 - uProgress * 0.72);

    // A floor the drawing dissolves into rather than stops at. The hero needs it
    // on a phone, where the words are real DOM text sitting below the room and
    // rule lines running underneath them would be texture behind Persian. The
    // scene puts this out of reach on any frame that has no band to clear.
    //
    // It is a world height, not a screen one, so the layers further back reach it
    // a little higher up the frame than the near ones. They are also the faintest,
    // so what that buys is the far sheet receding first — which is the direction
    // the fog is already pulling.
    vFade *= smoothstep(uFloor, uFloor + uFloorFade, here.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(here, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uInk;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    gl_FragColor = vec4(uInk, vFade * uOpacity);
  }
`;

/** Two triangles per segment, as (side, along) pairs. */
const QUAD_CORNERS = [
  [-1, 0],
  [1, 0],
  [-1, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
] as const;

export const buildSheetGeometry = () => {
  // Only the sheet. `core` marks the woven figure, which is a real object in
  // this scene rather than a drawing of one, so it is not wanted twice.
  const sheet = buildLattice().filter((segment) => segment.core === 0);
  const vertices = sheet.length * QUAD_CORNERS.length;

  const start = new Float32Array(vertices * 3);
  const end = new Float32Array(vertices * 3);
  const startLoose = new Float32Array(vertices * 3);
  const endLoose = new Float32Array(vertices * 3);
  const side = new Float32Array(vertices);
  const along = new Float32Array(vertices);
  const seed = new Float32Array(vertices);

  sheet.forEach((segment, index) => {
    QUAD_CORNERS.forEach((corner, cornerIndex) => {
      const vertex = index * QUAD_CORNERS.length + cornerIndex;
      start.set(segment.a, vertex * 3);
      end.set(segment.b, vertex * 3);
      startLoose.set(segment.looseA, vertex * 3);
      endLoose.set(segment.looseB, vertex * 3);
      side[vertex] = corner[0];
      along[vertex] = corner[1];
      seed[vertex] = segment.seed;
    });
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(start, 3));
  geometry.setAttribute('aEnd', new BufferAttribute(end, 3));
  geometry.setAttribute('aStartLoose', new BufferAttribute(startLoose, 3));
  geometry.setAttribute('aEndLoose', new BufferAttribute(endLoose, 3));
  geometry.setAttribute('aSide', new BufferAttribute(side, 1));
  geometry.setAttribute('aAlong', new BufferAttribute(along, 1));
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  return geometry;
};

export const buildSheetMaterial = (ink: Color) =>
  new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uStroke: { value: 0.05 },
      uPointer: { value: new Vector2(0, 0) },
      // Far below anything the camera can see, so the floor above is inert until
      // a caller asks for it.
      uFloor: { value: -1e4 },
      uFloorFade: { value: 1 },
      uInk: { value: ink },
    },
  });
