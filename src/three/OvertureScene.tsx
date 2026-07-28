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
  Points,
  PlaneGeometry,
  Quaternion,
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
import { WOVEN_FIGURE } from './geometry';
import { createRope, ROPE_POINTS } from './rope';
import { createWordmarkTexture } from './wordmark';

/** Reads a brand token so no colour value is written twice. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export type OverturePhase = 'dark' | 'lit' | 'leaving';

/* ------------------------------------------------------------------------- *
 * Layout of the room, in world units.
 *
 * The camera sits at the origin looking down -z. Everything below is placed
 * relative to that one fact, so moving the camera moves the composition rather
 * than breaking it.
 * ------------------------------------------------------------------------- */

const CAMERA_Z = 12;
const FOV = 38;

const WORDMARK_Z = -6;
const WALL_Z = -13;
const FLOOR_Y = -4.4;
/** The plane the cord swings in — in front of the type, behind the camera's nose. */
const ROPE_Z = 2.4;

/** How close a pointer must come to the cord, in CSS pixels, to catch it. */
const GRAB_RADIUS = 44;

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
 * Dust.
 *
 * Motes only exist where the beam is: each one measures its own distance to the
 * beam axis in the vertex shader and fades itself out. Nothing is culled on the
 * CPU and the whole field is one draw call, so the room can be full of air
 * without costing anything to breathe.
 * ------------------------------------------------------------------------- */

const DUST_COUNT = 520;

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

const buildDust = () => {
  const position = new Float32Array(DUST_COUNT * 3);
  const seed = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i += 1) {
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
 * ------------------------------------------------------------------------- */

const BAR = 0.16;

/** Where each copy of the figure stands: x, y, z, scale. */
const SCULPTURES = [
  [-4.3, -1.5, -2.2, 0.62],
  [4.9, -2.2, -8.5, 0.42],
] as const;

const buildSculpture = () => {
  const total = WOVEN_FIGURE.length * SCULPTURES.length;
  const mesh = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 }),
    total,
  );

  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const direction = new Vector3();

  let index = 0;
  SCULPTURES.forEach(([originX, originY, originZ, size]) => {
    WOVEN_FIGURE.forEach((segment) => {
      const ax = segment.a[0] * size;
      const ay = segment.a[1] * size;
      const bx = segment.b[0] * size;
      const by = segment.b[1] * size;
      const length = Math.hypot(bx - ax, by - ay);

      position.set(originX + (ax + bx) / 2, originY + (ay + by) / 2, originZ);
      direction.set(bx - ax, by - ay, 0).normalize();
      rotation.setFromUnitVectors(up, direction);
      // Bars overlap by their own width at the joints, which is what makes the
      // weave read as one solid object rather than a pile of sticks.
      scale.set(BAR, length + BAR, BAR);

      mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
      index += 1;
    });
  });

  return mesh;
};

type OvertureSceneProps = {
  phase: OverturePhase;
  /** False when the tab is in the background. */
  active: boolean;
  /** The cord was pulled hard enough to count. */
  onPulled: () => void;
  /** First frame is on screen. The opening waits on this before trusting it. */
  onReady: () => void;
};

/**
 * The opening room.
 *
 * One WebGL context, roughly a dozen draw calls, no post-processing and no
 * loaded assets. It is deliberately a closed box: it takes a phase in and
 * reports a pull out, and every animation inside is driven from those two.
 */
const OvertureScene = ({ phase, active, onPulled, onReady }: OvertureSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    start: () => void;
    stop: () => void;
    play: (phase: OverturePhase) => void;
  } | null>(null);

  // Kept in refs so a new callback identity never tears down the GL context.
  const onPulledRef = useRef(onPulled);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onPulledRef.current = onPulled;
    onReadyRef.current = onReady;
  }, [onPulled, onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* -- Renderer ------------------------------------------------------- */

    // Opaque: the panel behind this is the same navy, so there is nothing to
    // blend with and an alpha buffer would be paid for and thrown away.
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Shadows are the one genuinely expensive thing here, and a phone held at
    // arm's length cannot resolve the difference. Wide screens only.
    const wantsShadows = window.innerWidth >= 900;
    renderer.shadowMap.enabled = wantsShadows;
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
    floor.receiveShadow = wantsShadows;
    scene.add(floor);

    const wall = new Mesh(
      new PlaneGeometry(70, 34),
      new MeshStandardMaterial({ color: navy800, roughness: 0.9, metalness: 0 }),
    );
    wall.position.set(0, 4, WALL_Z);
    wall.receiveShadow = wantsShadows;
    scene.add(wall);

    const sculpture = buildSculpture();
    sculpture.castShadow = wantsShadows;
    sculpture.receiveShadow = wantsShadows;
    (sculpture.material as MeshStandardMaterial).color.copy(navy700);
    scene.add(sculpture);

    /* -- The wordmark --------------------------------------------------- */

    const wordmarkTexture = createWordmarkTexture();
    const wordmarkMaterial = new MeshStandardMaterial({
      color: navy100,
      alphaMap: wordmarkTexture,
      transparent: true,
      roughness: 0.78,
      metalness: 0.05,
      // The faint glow that makes the name *almost* readable before the light
      // comes on. Everything else about finding it is the visitor's job.
      emissive: navy700,
      emissiveIntensity: 0.9,
      depthWrite: false,
      side: DoubleSide,
    });
    const wordmark = new Mesh(new PlaneGeometry(13, 13 * (384 / 2048)), wordmarkMaterial);
    wordmark.position.set(0, 0.5, WORDMARK_Z);
    scene.add(wordmark);

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
    spot.castShadow = wantsShadows;
    spot.shadow.mapSize.set(1024, 1024);
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
    const dust = new Points(buildDust(), dustMaterial);
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
    cord.castShadow = wantsShadows;
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

    /* -- Placing the lamp and cord against the viewport ------------------
     * The cord has to sit in the corner of the *screen*, which is a different
     * place on every aspect ratio. Everything positional is recomputed on
     * resize rather than hard-coded, so a phone in portrait gets the same
     * composition as a desktop and not a cropped version of it.
     */

    const visibleHalfHeight = (z: number) =>
      Math.tan(MathUtils.degToRad(FOV / 2)) * (camera.position.z - z);

    // The cord hangs on the side the reader starts from — right in Persian,
    // left if this ever runs LTR — so it is the first thing in the frame rather
    // than the last, and so the HTML label beside it can use logical properties
    // and land in the same place.
    const towardStart = document.documentElement.dir === 'ltr' ? -1 : 1;

    const layout = () => {
      const halfHeight = visibleHalfHeight(ROPE_Z);
      const halfWidth = halfHeight * camera.aspect;

      // Clamped so an ultra-wide window does not strand the cord out at the
      // edge of the visitor's peripheral vision.
      const x = towardStart * Math.min(halfWidth * 0.74, 4.6);
      const y = halfHeight - 0.55;

      lamp.position.set(x, y, ROPE_Z);
      spot.position.set(x, y - 0.22, ROPE_Z);
      anchor.set(x, y - 0.34, ROPE_Z);

      // The beam is a cone standing from the target up to the lamp.
      const target = spot.target.position;
      const axis = new Vector3().subVectors(spot.position, target);
      const length = axis.length();
      const spread = Math.tan(spot.angle) * length;
      beam.scale.set(spread, length, spread);
      beam.position.copy(target).addScaledVector(axis, 0.5);
      beam.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis.normalize());

      dustMaterial.uniforms.uLamp.value.copy(spot.position);
      dustMaterial.uniforms.uBeam.value.copy(axis).negate();

      // The shade tips toward what it is lighting, like a real one would.
      shade.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis);

      // The anchor just moved, so the cord has to be re-hung under it — without
      // this it spends its first frames whipping in from wherever it was built.
      // A resize mid-drag drops the cord for exactly one frame before the next
      // pointer move catches it again, which is not worth a flag to prevent.
      rope.reseat();
    };

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
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
    const up = new Vector3(0, 1, 0);

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
    let fired = false;
    /** True once the *visitor* pulled it, so the keyboard path knows to stand down. */
    let pulledByHand = false;

    const toNdc = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      ndc.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      return bounds;
    };

    /**
     * Screen-space distance from the pointer to the cord, in CSS pixels.
     *
     * Distance to the *points*, not to the segments between them. The cord is
     * only about twenty pixels per segment on screen, which is well inside the
     * grab radius, so the gaps the cheap version misses are gaps nobody can aim
     * at anyway.
     */
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
      if (fired || distanceToCord(event) > GRAB_RADIUS) return;
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        if (!fired) {
          container.style.cursor = distanceToCord(event) <= GRAB_RADIUS ? 'grab' : 'default';
        }
        return;
      }

      toNdc(event);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(ropePlane, dragTarget)) rope.hold(dragTarget);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = 'default';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

      // The cord reports how hard it was being pulled at the moment it was let
      // go, so a slow drag that never went taut correctly does nothing.
      if (rope.release() >= 1 && !fired) {
        fired = true;
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

    const lightUp = () => {
      const light = gsap.timeline();
      timelines.push(light);

      // A real bulb does not fade up. It catches, drops, and then holds.
      light
        .to(spot, { intensity: 2.6, duration: 0.05 })
        .to(spot, { intensity: 0.35, duration: 0.07 })
        .to(spot, { intensity: 3.9, duration: 0.09 })
        .to(spot, { intensity: 3.1, duration: 0.7, ease: 'power2.out' })
        .to(bulbMaterial, { emissiveIntensity: 1.6, duration: 0.9 }, 0)
        .to(beamMaterial.uniforms.uOpacity, { value: 0.34, duration: 1.1 }, 0.1)
        .to(dustMaterial.uniforms.uLight, { value: 1, duration: 1.6 }, 0.1)
        .to(wordmarkMaterial, { emissiveIntensity: 0.4, duration: 1.2 }, 0.2)
        .to(rim, { intensity: 0.18, duration: 1.2 }, 0.2);

      // Nobody pulled anything — the visitor used the keyboard — so the cord
      // has to pull itself, or the light comes on for no visible reason.
      if (pulledByHand) return;

      const hand = { t: 0 };
      const pull = gsap.timeline();
      timelines.push(pull);
      pull.to(hand, {
        t: 1,
        duration: 0.28,
        ease: 'power2.in',
        onUpdate: () => {
          // Ends past the point a hand would have to reach to trip the switch,
          // so the keyboard pull looks like the same gesture it stands in for.
          dragTarget.copy(anchor);
          dragTarget.y -= rope.reach + 1.1 * hand.t;
          rope.hold(dragTarget);
        },
        onComplete: () => rope.release(),
      });
    };

    const leave = () => {
      const exit = gsap.timeline();
      timelines.push(exit);
      // Straight through the name and out the other side.
      exit
        .to(camera.position, { z: -2.5, duration: 1, ease: 'power2.in' })
        .to(wordmarkMaterial, { opacity: 0, duration: 0.5 }, 0.35)
        .to(spot, { intensity: 8, duration: 1 }, 0)
        .to(beamMaterial.uniforms.uOpacity, { value: 0, duration: 0.6 }, 0.3);
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

      rope.advance(delta);
      drawCord();

      // Live feedback: the ring brightens as the cord goes taut, so a visitor
      // who is half-pulling can tell they are on the right track.
      const tension = rope.tension();
      (handle.material as MeshStandardMaterial).emissiveIntensity = 0.85 + tension * 1.8;

      // A hand-held camera's worth of movement and no more. During the exit the
      // timeline owns the camera, so parallax steps aside rather than fighting.
      if (!leaving) {
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
        if (next === 'lit') {
          fired = true;
          lightUp();
        }
        if (next === 'leaving') {
          leaving = true;
          leave();
        }
      },
    };

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      sceneRef.current = null;
      timelines.forEach((timeline) => timeline.kill());
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
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
      wordmarkTexture.dispose();
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
