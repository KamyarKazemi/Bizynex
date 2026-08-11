import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Points,
  Quaternion,
  Ray,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { OvertureAudio } from '../audio/overture';
import { WOVEN_FIGURE } from './geometry';
import { readLatticePanelRect } from './handoff';
import { createRope, ROPE_POINTS } from './rope';
import { createWordmarkTexture } from './wordmark';

/** Reads a brand token so no colour value is written twice. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export type OverturePhase = 'dark' | 'lit' | 'leaving';

/* ------------------------------------------------------------------------- *
 * Layout of the room, in world units.
 *
 * The camera looks down -z from CAMERA_Z. Everything else is placed relative to
 * that, and anything that has to stay in frame is placed as a fraction of what
 * is actually visible at its own depth rather than as a fixed number — which is
 * what makes the same room work on a phone in portrait and on a widescreen
 * monitor instead of being cropped down to a slice of itself.
 * ------------------------------------------------------------------------- */

const CAMERA_Z = 12;
const FOV = 38;

const WORDMARK_Z = -6;
const WALL_Z = -13;
const FLOOR_Y = -4.4;
/** The plane the cord swings in — in front of the type, behind the camera's nose. */
const ROPE_Z = 2.4;

/** Widest the wordmark is ever drawn, before the viewport gets a say. */
const WORDMARK_MAX_WIDTH = 13;
const WORDMARK_RATIO = 384 / 2048;

/** Two pulls closer together than this are one pull with a bounce in it. */
const TOGGLE_COOLDOWN_MS = 450;

const half = (z: number) => Math.tan(MathUtils.degToRad(FOV / 2)) * (CAMERA_Z - z);

/* ------------------------------------------------------------------------- *
 * The light beam.
 *
 * A cone of glowing air, faked. Looking through a real cone of lit dust, the
 * middle is where the eye passes through the most of it, so brightness follows
 * how squarely the surface faces the camera — bright through the body, gone at
 * the silhouette. That single dot product is the entire effect, and it costs one
 * transparent draw call instead of a post-processing pass.
 * ------------------------------------------------------------------------- */

const BEAM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAlong;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-viewPosition.xyz);
    vAlong = uv.y;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const BEAM_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAlong;

  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    // Densest at the lamp, thinning out as the cone widens toward the floor.
    float depth = pow(clamp(vAlong, 0.0, 1.0), 1.5);
    gl_FragColor = vec4(uColor, pow(facing, 1.7) * depth * uOpacity);
  }
`;

/* ------------------------------------------------------------------------- *
 * The wordmark, and tearing it.
 *
 * Flat-shaded on purpose. It is a ghost in the dark for a few seconds and then
 * it is ripped up, and neither of those wants the spotlight's shading — what it
 * wants is control over exactly how visible it is, which a uniform gives and a
 * lighting model does not.
 *
 * The tear cuts the word into horizontal bands and slides alternate ones in
 * opposite directions at different speeds. Everything past the edge of the
 * texture clamps to black, so the letters do not smear as they leave.
 * ------------------------------------------------------------------------- */

const WORDMARK_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WORDMARK_FRAGMENT = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTear;

  varying vec2 vUv;

  float hash(float n) {
    return fract(sin(n * 78.233) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    float band = floor(vUv.y * 18.0);
    float direction = mod(band, 2.0) * 2.0 - 1.0;
    float speed = 0.3 + hash(band) * 1.1;
    uv.x += direction * uTear * speed * 0.55;

    // Bands drift apart vertically too, or the rip reads as a shear.
    uv.y += (hash(band + 7.0) - 0.5) * uTear * 0.06;

    float mask = texture2D(uMask, uv).g;
    float alpha = mask * uOpacity * (1.0 - uTear);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

/* ------------------------------------------------------------------------- *
 * The particles that become the word.
 *
 * Every point knows where it belongs and where it started, and interpolates
 * between the two on one uniform. Staggering it by a per-particle seed is what
 * turns a block of points arriving at once into a word assembling itself.
 *
 * All of it runs on the GPU — the CPU sets one number per frame.
 * ------------------------------------------------------------------------- */

const PARTICLE_VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uLight;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uExit;
  uniform vec3 uExitTarget;

  attribute vec3 aScatter;
  attribute vec3 aBurst;
  attribute float aSeed;

  varying float vAlpha;

  void main() {
    // The last particle to leave still has most of the window to cross, so the
    // stagger is subtracted from the span rather than added to the duration.
    float stagger = 0.42;
    float t = clamp((uProgress - aSeed * stagger) / (1.0 - stagger), 0.0, 1.0);
    float eased = 1.0 - pow(1.0 - t, 3.0);

    vec3 here = mix(position + aScatter, position, eased);

    // Unrest while travelling, so the flight is not a straight line, and the
    // faintest breathing once home so the finished word is not a dead sprite.
    float unrest = 1.0 - eased;
    here.x += sin(uTime * 1.7 + aSeed * 41.0) * 0.035 * unrest;
    here.y += cos(uTime * 1.4 + aSeed * 27.0) * 0.035 * unrest;
    here.z += sin(uTime * 0.6 + aSeed * 63.0) * 0.008 * eased;

    /* -- Leaving ------------------------------------------------------------
     * Every particle is thrown, and every particle lands in the panel the hero's
     * drawing occupies. This is projectile motion solved rather than integrated:
     * given a launch velocity and a flight time, there is exactly one constant
     * acceleration that arrives on target, and it is worth writing out —
     *
     *   p(t) = p0 + v0*t + 0.5*a*t^2      and we want p(1) = target
     *   =>  a = 2 * ((target - p0) - v0)
     *
     * so the curve is genuinely ballistic, costs no simulation, and cannot drift
     * off target however the camera moves underneath it. Recomputing against a
     * target that moves each frame turns it into a homing arc for free.
     */
    float flight = clamp((uExit - aSeed * 0.25) / 0.75, 0.0, 1.0);
    vec3 toTarget = uExitTarget - here;
    vec3 accel = 2.0 * (toTarget - aBurst);
    here += aBurst * flight + 0.5 * accel * flight * flight;

    // Held bright almost the whole way across, then handed over. Fading them out
    // early would make this a dissolve, which is the one thing it must not be.
    vAlpha = eased * uLight * (1.0 - smoothstep(0.72, 1.0, flight));

    vec4 viewPosition = modelViewMatrix * vec4(here, 1.0);
    // They are flying into a panel a fraction of the size of the room, so they
    // have to condense on the way or they arrive as a cloud over the top of it.
    float condense = mix(1.0, 0.4, flight);
    gl_PointSize = uPixelRatio * (1.0 + eased * 1.5) * condense * (26.0 / -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    // Squared falloff reads as a glowing mote; linear reads as a soft disc.
    float body = 1.0 - radius * 2.0;
    gl_FragColor = vec4(uColor, vAlpha * body * body);
  }
`;

/* ------------------------------------------------------------------------- *
 * Dust in the beam.
 *
 * Motes only exist where the beam is: each one measures its own distance to the
 * beam axis in the vertex shader and fades itself out. Nothing is culled on the
 * CPU and the whole field is one draw call, so the room can be full of air
 * without costing anything to breathe.
 * ------------------------------------------------------------------------- */

const DUST_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uLight;
  uniform float uPixelRatio;
  uniform vec3 uLamp;
  uniform vec3 uBeam;

  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 drift = vec3(
      cos(uTime * 0.13 + aSeed * 8.7) * 0.3,
      sin(uTime * 0.19 + aSeed * 5.1) * 0.34,
      sin(uTime * 0.11 + aSeed * 3.3) * 0.22
    );
    vec3 here = position + drift;

    vec3 fromLamp = here - uLamp;
    float along = dot(fromLamp, uBeam);
    float offAxis = length(fromLamp - uBeam * along);

    // The cone widens with distance, so the acceptable offset does too.
    float radius = 0.15 + along * 0.36;
    float inside = 1.0 - smoothstep(radius * 0.4, radius, offAxis);
    inside *= smoothstep(0.4, 2.4, along) * (1.0 - smoothstep(8.0, 13.0, along));

    vAlpha = inside * uLight;

    vec4 viewPosition = modelViewMatrix * vec4(here, 1.0);
    gl_PointSize = 2.4 * uPixelRatio * (10.0 / -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * (1.0 - radius * 2.0));
  }
`;

const buildDust = (count: number) => {
  const position = new Float32Array(count * 3);
  const seed = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    position[i * 3] = (Math.random() - 0.5) * 18;
    position[i * 3 + 1] = (Math.random() - 0.5) * 12;
    position[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    seed[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  return geometry;
};

/* ------------------------------------------------------------------------- *
 * The sculpture.
 *
 * The woven figure from geometry.ts, built as physical bars instead of drawn
 * lines, standing in the room so the spotlight has something to throw a shadow
 * from. CONTEXT.md section 3 permits reusing the construction system; this is
 * that system given thickness, not the logo moved into 3D.
 *
 * Built centred on its own origin so the layout pass can put it wherever the
 * viewport has room.
 * ------------------------------------------------------------------------- */

const BAR = 0.16;

const buildSculpture = () => {
  const mesh = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 }),
    WOVEN_FIGURE.length,
  );

  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const direction = new Vector3();

  WOVEN_FIGURE.forEach((segment, index) => {
    const [ax, ay] = segment.a;
    const [bx, by] = segment.b;
    const length = Math.hypot(bx - ax, by - ay);

    position.set((ax + bx) / 2, (ay + by) / 2, 0);
    direction.set(bx - ax, by - ay, 0).normalize();
    rotation.setFromUnitVectors(up, direction);
    // Bars overlap by their own width at the joints, which is what makes the
    // weave read as one solid object rather than a pile of sticks.
    scale.set(BAR, length + BAR, BAR);

    mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
  });

  return mesh;
};

/* ------------------------------------------------------------------------- *
 * What this device can afford.
 *
 * One place, so the budgets can be read against each other rather than being
 * scattered through the scene as magic numbers.
 * ------------------------------------------------------------------------- */

const budgetFor = () => {
  const area = window.innerWidth * window.innerHeight;
  const isSmall = window.innerWidth < 700;
  const { deviceMemory } = navigator as Navigator & { deviceMemory?: number };
  const lean = isSmall || (typeof deviceMemory === 'number' && deviceMemory < 8);

  return {
    // Shadows are the one genuinely expensive thing here, and a phone held at
    // arm's length cannot resolve the difference.
    shadows: !lean && area > 500_000,
    shadowMap: 1024,
    dust: lean ? 240 : 520,
    // The wordmark is the whole point of the scene, so it is the last thing to
    // be cut — a lean device still gets the effect, at a coarser grain.
    particles: lean ? 3200 : 9000,
    // Fingers are less precise than a cursor and cover what they are aiming at.
    grabRadius: window.matchMedia('(pointer: coarse)').matches ? 68 : 44,
  };
};

type OvertureSceneProps = {
  phase: OverturePhase;
  /** False when the tab is in the background. */
  active: boolean;
  /** The cord was pulled hard enough to count, in either direction. */
  onPulled: () => void;
  /** First frame is on screen. The opening waits on this before trusting it. */
  onReady: () => void;
  /**
   * The room can no longer be drawn, so let the visitor through. Only the GL
   * context being lost fires this — a thrown error goes to the boundary — and
   * a lost context is not something React can see.
   */
  onFailed: () => void;
  audio: OvertureAudio;
};

/**
 * The opening room.
 *
 * One WebGL context, roughly a dozen draw calls, no post-processing and no
 * loaded assets. It is deliberately a closed box: it takes a phase in and
 * reports a pull out, and every animation inside is driven from those two.
 */
const OvertureScene = ({
  phase,
  active,
  onPulled,
  onReady,
  onFailed,
  audio,
}: OvertureSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    start: () => void;
    stop: () => void;
    play: (phase: OverturePhase) => void;
  } | null>(null);

  // Kept in refs so a new callback identity never tears down the GL context.
  const onPulledRef = useRef(onPulled);
  const onReadyRef = useRef(onReady);
  const onFailedRef = useRef(onFailed);
  const audioRef = useRef(audio);
  useEffect(() => {
    onPulledRef.current = onPulled;
    onReadyRef.current = onReady;
    onFailedRef.current = onFailed;
    audioRef.current = audio;
  }, [onPulled, onReady, onFailed, audio]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const budget = budgetFor();

    /**
     * Set the moment this effect is cleaned up. The font-ready promise below can
     * resolve long after the opening was skipped, and building nine thousand
     * points into a scene that has already been disposed is both a wasted
     * allocation and a leak.
     */
    let torn = false;

    /* -- Renderer ------------------------------------------------------- */

    // Opaque: the panel behind this is the same navy, so there is nothing to
    // blend with and an alpha buffer would be paid for and thrown away.
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = budget.shadows;
    renderer.shadowMap.type = PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    /* -- Palette -------------------------------------------------------- */

    // Palette tokens, not semantic ones: the room is the same dim navy whether
    // the site around it is in light or dark mode.
    const navy900 = new Color(token('--color-navy-900'));
    const navy800 = new Color(token('--color-navy-800'));
    const navy700 = new Color(token('--color-navy-700'));
    const navy100 = new Color(token('--color-navy-100'));
    const teal300 = new Color(token('--color-teal-300'));
    const teal500 = new Color(token('--color-teal-500'));
    /** Slightly warm white. A neutral bulb reads as a torch, not a lamp. */
    const bulb = new Color('#fff1dd');

    renderer.setClearColor(navy900, 1);

    /* -- Scene ---------------------------------------------------------- */

    const scene = new Scene();
    // Haze, not atmosphere for its own sake: it is what makes the far wall sit
    // behind the near one without lighting either of them differently.
    scene.fog = new FogExp2(navy900.getHex(), 0.045);

    const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0.2, CAMERA_Z);

    const floor = new Mesh(
      new PlaneGeometry(70, 70),
      new MeshStandardMaterial({ color: navy900, roughness: 0.68, metalness: 0.18 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = budget.shadows;
    scene.add(floor);

    const wall = new Mesh(
      new PlaneGeometry(70, 34),
      new MeshStandardMaterial({ color: navy800, roughness: 0.9, metalness: 0 }),
    );
    wall.position.set(0, 4, WALL_Z);
    wall.receiveShadow = budget.shadows;
    scene.add(wall);

    // Two copies at different depths. The near one is what the spotlight throws
    // across the back wall; the far one is only there so the room has a middle
    // distance and does not read as a backdrop with one prop in front of it.
    const sculptures = [buildSculpture(), buildSculpture()];
    sculptures.forEach((mesh) => {
      mesh.castShadow = budget.shadows;
      mesh.receiveShadow = budget.shadows;
      (mesh.material as MeshStandardMaterial).color.copy(navy700);
      scene.add(mesh);
    });

    /* -- The wordmark --------------------------------------------------- */

    const wordmark = createWordmarkTexture();
    const wordmarkMaterial = new ShaderMaterial({
      vertexShader: WORDMARK_VERTEX,
      fragmentShader: WORDMARK_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uMask: { value: wordmark.texture },
        uColor: { value: navy100.clone() },
        // Barely there. Enough that a visitor can tell something is written on
        // the far wall, not enough to read it — which is the reason to reach
        // for the light in the first place.
        uOpacity: { value: 0.16 },
        uTear: { value: 0 },
      },
    });
    const wordmarkMesh = new Mesh(new PlaneGeometry(1, 1), wordmarkMaterial);
    wordmarkMesh.position.set(0, 0.5, WORDMARK_Z);
    scene.add(wordmarkMesh);

    /* -- The particles it becomes ---------------------------------------
     * Built from a read-back of the wordmark canvas, which is the one genuinely
     * expensive call in the scene — so it happens once, as soon as the real
     * typeface is available, long before anyone can pull the cord.
     */

    // The hero's drawing sits in the second column of the page's grid, which
    // lands on the reading-end side — left in Persian. That is the direction the
    // whole exit moves in, and the direction the wordmark is thrown.
    const towardPage = document.documentElement.dir === 'ltr' ? 1 : -1;

    const particleGroup = new Group();
    particleGroup.position.copy(wordmarkMesh.position);
    scene.add(particleGroup);

    const particleMaterial = new ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uLight: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColor: { value: bulb },
        uExit: { value: 0 },
        uExitTarget: { value: new Vector3() },
      },
    });

    let particles: Points | null = null;

    const buildParticles = () => {
      if (torn || particles) return;

      const targets = wordmark.sample(budget.particles);
      if (targets.length === 0) return;

      const count = targets.length / 3;
      const scatter = new Float32Array(targets.length);
      const burst = new Float32Array(targets.length);
      const seed = new Float32Array(count);

      for (let i = 0; i < count; i += 1) {
        // Thrown outward from where the letter is, so the word looks like it
        // was blown apart rather than assembled out of a cloud.
        const angle = Math.random() * Math.PI * 2;
        const reach = 0.12 + Math.random() * 0.5;
        scatter[i * 3] = Math.cos(angle) * reach;
        scatter[i * 3 + 1] = Math.sin(angle) * reach * 1.6;
        scatter[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        // The launch. Biased hard toward the side the page is about to arrive
        // from, so the throw has a direction before it has a destination — the
        // spread is what stops several thousand points moving as one sheet.
        burst[i * 3] = towardPage * (0.3 + Math.random() * 0.6);
        burst[i * 3 + 1] = (Math.random() - 0.5) * 0.55;
        burst[i * 3 + 2] = (Math.random() - 0.5) * 0.45;

        seed[i] = Math.random();
      }

      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(targets, 3));
      geometry.setAttribute('aScatter', new BufferAttribute(scatter, 3));
      geometry.setAttribute('aBurst', new BufferAttribute(burst, 3));
      geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));

      particles = new Points(geometry, particleMaterial);
      particles.frustumCulled = false;
      particles.renderOrder = 4;
      particleGroup.add(particles);
    };

    // Sampling before the real face has loaded would trace the fallback's
    // letterforms. Waiting costs nothing — the cord cannot be pulled this fast.
    if (document.fonts) {
      void document.fonts.ready.then(buildParticles);
    } else {
      buildParticles();
    }

    /* -- Lighting ------------------------------------------------------- */

    // Enough to see shapes by, and not one step more. The room has to be worth
    // switching a light on in.
    scene.add(new AmbientLight(navy700, 0.55));

    // Cold edge from behind so the sculpture separates from the wall in the
    // dark. This is the only light that is on before the visitor does anything.
    const rim = new DirectionalLight(teal300, 0.35);
    rim.position.set(-8, 5, -6);
    scene.add(rim);

    const lamp = new Group();
    scene.add(lamp);

    const spot = new SpotLight(bulb, 0, 0, 0.36, 0.85);
    // Decay off on purpose: the fog already darkens what is far away, and a
    // physical inverse-square falloff on top of it is a second dimmer knob
    // fighting the first. One control, predictable everywhere.
    spot.decay = 0;
    spot.distance = 0;
    spot.castShadow = budget.shadows;
    spot.shadow.mapSize.set(budget.shadowMap, budget.shadowMap);
    spot.shadow.bias = -0.0012;
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 34;
    scene.add(spot);
    scene.add(spot.target);
    spot.target.position.set(0, 0.5, WORDMARK_Z);

    // The fixture: a shade, the bulb inside it, and the flex it hangs on.
    const shade = new Mesh(
      new ConeGeometry(0.52, 0.62, 24, 1, true),
      new MeshStandardMaterial({
        color: navy800,
        roughness: 0.42,
        metalness: 0.65,
        side: DoubleSide,
      }),
    );
    const bulbMaterial = new MeshStandardMaterial({
      color: navy900,
      emissive: bulb,
      emissiveIntensity: 0,
      roughness: 1,
    });
    const bulbMesh = new Mesh(new SphereGeometry(0.16, 16, 12), bulbMaterial);
    bulbMesh.position.y = -0.22;
    const flex = new Mesh(
      new CylinderGeometry(0.014, 0.014, 6, 5),
      new MeshStandardMaterial({ color: navy700, roughness: 0.9 }),
    );
    flex.position.y = 3.3;
    lamp.add(shade, bulbMesh, flex);

    const beamMaterial = new ShaderMaterial({
      vertexShader: BEAM_VERTEX,
      fragmentShader: BEAM_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      // Both faces, additively: a ray through the middle of the cone crosses two
      // surfaces and one through the edge crosses one, which is exactly the
      // thickness gradient real lit air has.
      side: DoubleSide,
      uniforms: {
        uColor: { value: bulb },
        uOpacity: { value: 0 },
      },
    });
    const beam = new Mesh(new ConeGeometry(1, 1, 32, 1, true), beamMaterial);
    beam.renderOrder = 2;
    scene.add(beam);

    const dustMaterial = new ShaderMaterial({
      vertexShader: DUST_VERTEX,
      fragmentShader: DUST_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uLight: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColor: { value: bulb },
        uLamp: { value: new Vector3() },
        uBeam: { value: new Vector3(0, -1, 0) },
      },
    });
    const dust = new Points(buildDust(budget.dust), dustMaterial);
    dust.frustumCulled = false;
    dust.renderOrder = 3;
    scene.add(dust);

    /* -- The pull cord -------------------------------------------------- */

    const anchor = new Vector3(0, 0, ROPE_Z);
    const rope = createRope(anchor);

    const cord = new InstancedMesh(
      new CylinderGeometry(0.026, 0.026, 1, 6),
      new MeshStandardMaterial({ color: navy100, roughness: 0.85, emissive: navy700 }),
      ROPE_POINTS - 1,
    );
    cord.castShadow = budget.shadows;
    scene.add(cord);

    // The single teal element on this screen, and the only thing in the room
    // that says "touch me". CONTEXT.md section 4 allows exactly one.
    const handle = new Mesh(
      new TorusGeometry(0.14, 0.038, 10, 24),
      new MeshStandardMaterial({
        color: teal500,
        emissive: teal300,
        emissiveIntensity: 0.85,
        roughness: 0.4,
        metalness: 0.3,
      }),
    );
    scene.add(handle);

    /* -- Fitting the room to the viewport --------------------------------
     * Everything positional is recomputed here rather than hard-coded, so a
     * phone in portrait gets the same composition as a desktop instead of a
     * cropped version of it.
     */

    const beamAxis = new Vector3();
    const up = new Vector3(0, 1, 0);

    // Right in Persian, left if this ever runs LTR, so the HTML label beside the
    // cord can use logical properties and land in the same place.
    const towardStart = document.documentElement.dir === 'ltr' ? -1 : 1;

    const layout = () => {
      /* The cord, in the corner of the *screen*, which is a different place on
         every aspect ratio. It hangs on the side the reading starts from — see
         towardStart below — so it is the first thing in the frame, not the last. */
      const cordHalfHeight = half(ROPE_Z);
      const cordHalfWidth = cordHalfHeight * camera.aspect;
      // Clamped so an ultra-wide window does not strand the cord out at the
      // edge of the visitor's peripheral vision.
      const x = towardStart * Math.min(cordHalfWidth * 0.74, 4.6);
      const y = cordHalfHeight - 0.55;

      lamp.position.set(x, y, ROPE_Z);
      spot.position.set(x, y - 0.22, ROPE_Z);
      anchor.set(x, y - 0.34, ROPE_Z);

      /* The wordmark, as wide as it can be without touching the sides. */
      const markHalfWidth = half(WORDMARK_Z) * camera.aspect;
      const width = Math.min(WORDMARK_MAX_WIDTH, markHalfWidth * 2 * 0.86);
      const height = width * WORDMARK_RATIO;
      wordmarkMesh.scale.set(width, height, 1);
      // The sampled points run -0.5 to 0.5 in both directions, so scaling the
      // group by the plane's size puts every particle exactly on its letter.
      particleGroup.scale.set(width, height, (width + height) / 2);

      /* The sculptures, out at the edges of whatever is visible at their depth,
         and never so far out that they leave the frame on a narrow screen. */
      const nearHalfWidth = half(-2.2) * camera.aspect;
      sculptures[0].position.set(-Math.min(nearHalfWidth * 0.72, 4.3), -1.5, -2.2);
      sculptures[0].scale.setScalar(0.62);
      const farHalfWidth = half(-8.5) * camera.aspect;
      sculptures[1].position.set(Math.min(farHalfWidth * 0.66, 4.9), -2.2, -8.5);
      sculptures[1].scale.setScalar(0.42);

      /* The beam: a cone standing from what is lit up to the lamp. */
      const target = spot.target.position;
      beamAxis.subVectors(spot.position, target);
      const length = beamAxis.length();
      const spread = Math.tan(spot.angle) * length;
      beam.scale.set(spread, length, spread);
      beam.position.copy(target).addScaledVector(beamAxis, 0.5);
      beamAxis.normalize();
      beam.quaternion.setFromUnitVectors(up, beamAxis);

      dustMaterial.uniforms.uLamp.value.copy(spot.position);
      dustMaterial.uniforms.uBeam.value.copy(beamAxis).negate();

      // The shade tips toward what it is lighting, like a real one would.
      shade.quaternion.setFromUnitVectors(up, beamAxis);
    };

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      // Re-read rather than sampled once at mount: browser zoom changes the
      // ratio, and so does dragging the window onto a display of a different
      // density. The two point shaders size their motes from it, so they have
      // to hear about it as well or the dust is drawn at the old density.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      dustMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();

      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      layout();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* -- Drawing the cord each frame ------------------------------------ */

    const link = new Object3D();
    const midpoint = new Vector3();
    const span = new Vector3();
    const heading = new Vector3();

    const drawCord = () => {
      for (let i = 0; i < ROPE_POINTS - 1; i += 1) {
        const a = rope.points[i];
        const b = rope.points[i + 1];
        span.subVectors(b, a);
        midpoint.addVectors(a, b).multiplyScalar(0.5);

        link.position.copy(midpoint);
        link.quaternion.setFromUnitVectors(up, heading.copy(span).normalize());
        link.scale.set(1, span.length(), 1);
        link.updateMatrix();
        cord.setMatrixAt(i, link.matrix);
      }
      cord.instanceMatrix.needsUpdate = true;

      handle.position.copy(rope.points[ROPE_POINTS - 1]);
      // The ring hangs off the end of the cord and swings with it.
      span.subVectors(rope.points[ROPE_POINTS - 1], rope.points[ROPE_POINTS - 2]).normalize();
      handle.position.addScaledVector(span, 0.14);
      handle.quaternion.setFromUnitVectors(up, span);
    };

    /* -- Pointer: catching, dragging and letting go of the cord ---------- */

    const ropePlane = new Plane(new Vector3(0, 0, 1), -ROPE_Z);
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const dragTarget = new Vector3();
    const projected = new Vector3();

    let dragging = false;
    let lastToggle = 0;
    /** True once the *visitor* pulled it, so the keyboard path knows to stand down. */
    let pulledByHand = false;

    /** Screen-space distance from the pointer to the cord, in CSS pixels. */
    const distanceToCord = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      let closest = Infinity;
      for (let i = 0; i < ROPE_POINTS; i += 1) {
        projected.copy(rope.points[i]).project(camera);
        const px = ((projected.x + 1) / 2) * bounds.width;
        const py = ((1 - projected.y) / 2) * bounds.height;
        closest = Math.min(closest, Math.hypot(px - x, py - y));
      }
      return closest;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (distanceToCord(event) > budget.grabRadius) return;
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
      // A pointer landing on the cord is as clear a gesture as browsers ask for.
      audioRef.current.unlock();
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        container.style.cursor =
          distanceToCord(event) <= budget.grabRadius ? 'grab' : 'default';
        return;
      }

      const bounds = container.getBoundingClientRect();
      ndc.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(ropePlane, dragTarget)) rope.hold(dragTarget);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = 'default';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

      audioRef.current.strain(0);

      // The cord reports how hard it was being pulled at the moment it was let
      // go, so a slow drag that never went taut correctly does nothing.
      const now = performance.now();
      if (rope.release() >= 1 && now - lastToggle > TOGGLE_COOLDOWN_MS) {
        lastToggle = now;
        pulledByHand = true;
        onPulledRef.current();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    /* -- Phases --------------------------------------------------------- */

    const timelines: gsap.core.Timeline[] = [];
    let isLit = false;
    let hasFormed = false;

    const track = (timeline: gsap.core.Timeline) => {
      timelines.push(timeline);
      return timeline;
    };

    /** Nobody pulled anything — the keyboard did — so the cord pulls itself. */
    const pullItself = () => {
      const hand = { t: 0 };
      track(gsap.timeline()).to(hand, {
        t: 1,
        duration: 0.28,
        ease: 'power2.in',
        onUpdate: () => {
          dragTarget.copy(anchor);
          dragTarget.y -= rope.reach + 0.55 * hand.t;
          rope.hold(dragTarget);
        },
        onComplete: () => rope.release(),
      });
    };

    /**
     * The reveal, which only happens the first time. After that the light is
     * just a light — the word has already been assembled and stays assembled.
     */
    const form = () => {
      hasFormed = true;
      buildParticles();

      const reveal = track(gsap.timeline());
      reveal
        // Caught in the beam, whole, for a fifth of a second.
        .to(wordmarkMaterial.uniforms.uOpacity, { value: 1, duration: 0.16 }, 0)
        // Then it comes apart.
        .to(wordmarkMaterial.uniforms.uTear, {
          value: 1,
          duration: 0.4,
          ease: 'power2.in',
          onStart: () => audioRef.current.tear(),
        }, 0.18)
        // A beat of nothing, which is what makes the rebuild land.
        .to(
          particleMaterial.uniforms.uProgress,
          {
            value: 1,
            duration: 1.5,
            ease: 'none',
            onStart: () => audioRef.current.shimmer(),
          },
          0.68,
        );
    };

    const setLight = (on: boolean) => {
      const wasHand = pulledByHand;
      pulledByHand = false;
      if (!wasHand) pullItself();

      audioRef.current.click(on);
      audioRef.current.hum(on);

      const light = track(gsap.timeline());

      if (on) {
        // A real bulb does not fade up. It catches, drops, and then holds.
        light
          .to(spot, { intensity: 2.6, duration: 0.05 })
          .to(spot, { intensity: 0.35, duration: 0.07 })
          .to(spot, { intensity: 3.9, duration: 0.09 })
          .to(spot, { intensity: 3.1, duration: 0.7, ease: 'power2.out' })
          .to(bulbMaterial, { emissiveIntensity: 1.6, duration: 0.9 }, 0)
          .to(beamMaterial.uniforms.uOpacity, { value: 0.34, duration: 1.1 }, 0.1)
          .to(dustMaterial.uniforms.uLight, { value: 1, duration: 1.6 }, 0.1)
          .to(rim, { intensity: 0.18, duration: 1.2 }, 0.2);

        // Already assembled: bring the word back up with the light rather than
        // tearing a plane that is no longer there.
        if (hasFormed) {
          light.to(particleMaterial.uniforms.uLight, { value: 1, duration: 0.8 }, 0.05);
        } else {
          form();
          light.to(particleMaterial.uniforms.uLight, { value: 1, duration: 0.5 }, 0.68);
        }
        return;
      }

      light
        .to(spot, { intensity: 0, duration: 0.14, ease: 'power2.in' })
        .to(bulbMaterial, { emissiveIntensity: 0, duration: 0.3 }, 0)
        .to(beamMaterial.uniforms.uOpacity, { value: 0, duration: 0.3 }, 0)
        .to(dustMaterial.uniforms.uLight, { value: 0, duration: 0.4 }, 0)
        .to(rim, { intensity: 0.35, duration: 0.6 }, 0)
        // Not to nothing. The word stays as a ghost, the way it was before the
        // light — otherwise turning it off looks like the scene broke.
        .to(particleMaterial.uniforms.uLight, { value: 0.13, duration: 0.5 }, 0);
    };

    /* -- Leaving ---------------------------------------------------------
     * The wordmark is not dismissed, it is thrown — across the frame and into
     * the panel the hero's drawing occupies, arriving while that drawing is
     * still pulling itself together. The room goes with it: the camera trucks
     * sideways instead of pushing in, so everything parallaxes past at its own
     * depth. The cord, nearest the lens, sweeps right across the frame; the far
     * wall barely moves. That depth is the reason to have built a room at all,
     * and a fade would spend none of it.
     */

    /** Where on screen the throw is aimed, in CSS pixels. */
    let exitRect: DOMRect | null = null;
    const exitPlane = new Plane(new Vector3(0, 0, 1), -WORDMARK_Z);
    const exitRay = new Ray();
    const exitTarget = new Vector3();

    const aimAtPage = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // No panel means no WebGL hero waiting to catch this — the throw still has
      // to go somewhere, so it goes where the panel would have been.
      const x = exitRect ? exitRect.left + exitRect.width / 2 : width * (towardPage < 0 ? 0.24 : 0.76);
      const y = exitRect ? exitRect.top + exitRect.height / 2 : height * 0.5;

      // Screen point to a world point on the plane the letters live in. Redone
      // every frame because the camera is moving underneath it: the target is
      // fixed on the page, which means it is travelling through the room.
      camera.updateMatrixWorld();
      exitTarget.set((x / width) * 2 - 1, -((y / height) * 2 - 1), 0.5).unproject(camera);
      exitRay.origin.copy(camera.position);
      exitRay.direction.copy(exitTarget).sub(camera.position).normalize();
      if (!exitRay.intersectPlane(exitPlane, exitTarget)) return;

      particleGroup.updateWorldMatrix(true, false);
      particleMaterial.uniforms.uExitTarget.value.copy(particleGroup.worldToLocal(exitTarget));
    };

    const leave = () => {
      audioRef.current.whoosh(towardPage);
      audioRef.current.hum(false);
      audioRef.current.strain(0);

      // Measured once. The page underneath is static and its scrollbar gutter is
      // reserved, so this cannot move during the exit — and reading layout on
      // every frame of an animation is how you lose the frames.
      exitRect = readLatticePanelRect();
      aimAtPage();

      track(gsap.timeline())
        .to(
          camera.position,
          { x: -towardPage * 5.2, z: 9.4, duration: 1.5, ease: 'power2.inOut' },
          0,
        )
        .to(particleMaterial.uniforms.uExit, {
          value: 1,
          // Linear on purpose. The shader's trajectory is a real constant
          // acceleration, and easing the input as well would flatten the arc
          // into something that merely slides.
          ease: 'none',
          duration: 1.25,
          onComplete: () => audioRef.current.settle(),
        }, 0.05)
        // One last flare as it goes, then the room lets go of the light.
        .to(spot, { intensity: 5.4, duration: 0.45, ease: 'power2.out' }, 0)
        .to(spot, { intensity: 0, duration: 0.75 }, 0.55)
        .to(bulbMaterial, { emissiveIntensity: 0, duration: 0.7 }, 0.55)
        .to(beamMaterial.uniforms.uOpacity, { value: 0, duration: 0.5 }, 0.2)
        .to(dustMaterial.uniforms.uLight, { value: 0, duration: 0.6 }, 0.25);
    };

    /* -- Loop ----------------------------------------------------------- */

    const pointerDrift = new Vector2(0, 0);
    const easedDrift = new Vector2(0, 0);
    const onDrift = (event: PointerEvent) => {
      pointerDrift.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * 2,
      );
    };
    window.addEventListener('pointermove', onDrift, { passive: true });

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let leaving = false;
    let announced = false;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += delta;

      dustMaterial.uniforms.uTime.value = elapsed;
      particleMaterial.uniforms.uTime.value = elapsed;

      rope.advance(delta);
      drawCord();

      // Live feedback: the ring brightens and the rope sounds like it is under
      // load, so a visitor who is half-pulling can tell they are on track.
      const tension = rope.tension();
      (handle.material as MeshStandardMaterial).emissiveIntensity = 0.85 + tension * 1.8;
      if (dragging) audioRef.current.strain(tension);

      // A hand-held camera's worth of movement and no more. During the exit the
      // timeline owns the camera, so parallax steps aside rather than fighting —
      // and the orientation is left alone, which turns the move into a truck
      // past the room rather than a pan that keeps staring at the middle of it.
      if (leaving) {
        aimAtPage();
      } else {
        easedDrift.x = MathUtils.damp(easedDrift.x, pointerDrift.x, 2.6, delta);
        easedDrift.y = MathUtils.damp(easedDrift.y, pointerDrift.y, 2.6, delta);
        camera.position.x = easedDrift.x * 0.5 + Math.sin(elapsed * 0.21) * 0.12;
        camera.position.y = 0.2 - easedDrift.y * 0.3 + Math.cos(elapsed * 0.17) * 0.08;
        camera.lookAt(0, 0.4, WORDMARK_Z);
      }

      renderer.render(scene, camera);

      if (!announced) {
        announced = true;
        onReadyRef.current();
      }
    };

    sceneRef.current = {
      start: () => {
        if (frame !== 0) return;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      },
      stop: () => {
        cancelAnimationFrame(frame);
        frame = 0;
      },
      play: (next) => {
        if (next === 'leaving') {
          leaving = true;
          leave();
          return;
        }

        const wantsLight = next === 'lit';
        if (wantsLight === isLit) return;
        isLit = wantsLight;
        setLight(wantsLight);
      },
    };

    // A lost context throws nothing, so the boundary above never fires — and
    // this room is covering the whole site, so the visitor would be stranded in
    // a frozen dark rectangle. preventDefault stops the browser restoring it
    // underneath a scene that is about to be torn down; the report is what lets
    // them straight through to the page.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      onFailedRef.current();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      torn = true;
      cancelAnimationFrame(frame);
      frame = 0;
      sceneRef.current = null;
      timelines.forEach((timeline) => timeline.kill());
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointermove', onDrift);

      // Every geometry, material and texture made above, released by walking the
      // graph — one traversal cannot forget a mesh the way a hand-written list
      // eventually will.
      scene.traverse((object) => {
        const mesh = object as Partial<Mesh>;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
      // Not left to the traversal above. The particle material only ever joins
      // the graph once the points are built, and the points are not built at
      // all if the opening is skipped before the font lands or if the wordmark
      // sampled nothing — so it is released by hand, from the one place that is
      // certain to run. Disposing twice is harmless; disposing never is a leak.
      particleMaterial.dispose();
      wordmark.texture.dispose();
      spot.shadow.map?.dispose();

      // Releases the GL context outright rather than waiting on the garbage
      // collector; browsers cap how many a page may hold. Safe only because the
      // canvas element is discarded with it.
      renderer.forceContextLoss();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.play(phase);
  }, [phase]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (active) scene.start();
    else scene.stop();
  }, [active]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default OvertureScene;
