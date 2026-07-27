import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { buildLattice, STROKE } from './geometry';

gsap.registerPlugin(ScrollTrigger);

/** Reads a brand token so no colour value is written twice. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Every segment is a quad, not a line. WebGL ignores line width on every desktop
 * browser, so a `LineSegments` version would draw hairlines however heavy the
 * SVG fallback is — and the two are meant to be the same drawing.
 *
 * All ~355 segments live in one buffer and one draw call. `position` carries the
 * assembled start point; the end point and both dispersed points ride along as
 * attributes, so a segment can be rebuilt, offset and turned entirely here.
 */
const VERTEX = /* glsl */ `
  attribute vec3 aEnd;
  attribute vec3 aStartLoose;
  attribute vec3 aEndLoose;
  attribute float aSide;
  attribute float aAlong;
  attribute float aAccent;
  attribute float aCore;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uTime;
  uniform float uStroke;
  uniform float uSheetStroke;
  uniform vec2 uPointer;

  varying float vAccent;
  varying float vFade;

  void main() {
    vAccent = aAccent;

    // The sheet lags behind the figure on the way out, so the drawing comes
    // apart in layers rather than all at once.
    float lag = mix(0.72, 1.0, aCore);
    float progress = clamp(uProgress * lag, 0.0, 1.0);

    vec3 start = mix(position, aStartLoose, progress);
    vec3 end = mix(aEnd, aEndLoose, progress);

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

    // Pointer tension: the lattice eases away from the cursor and settles back.
    // Falls off fast, so it reads as the sheet flexing, not as a cursor toy.
    vec2 away = here.xy - uPointer;
    float distance = length(away);
    if (distance > 0.001) {
      here.xy += (away / distance) * exp(-distance * 0.42) * 0.55 * (1.0 - progress);
    }

    // Width and opacity separate the figure from the sheet it sits on.
    float width = mix(uSheetStroke, uStroke, aCore);
    vec3 along = end - start;
    float span = length(along);
    if (span > 0.0001) {
      here += normalize(cross(along / span, vec3(0.0, 0.0, 1.0))) * aSide * width * 0.5;
    }

    // Depth does the rest: further back is fainter, so the sheet recedes
    // without a single gradient or fog call.
    float depth = smoothstep(-11.0, 0.5, here.z);
    vFade = mix(0.16 * depth, 1.0, aCore) * (1.0 - progress * 0.72);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(here, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vAccent;
  varying float vFade;

  void main() {
    gl_FragColor = vec4(mix(uInk, uAccent, vAccent), vFade * uOpacity);
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

const buildGeometry = () => {
  const lattice = buildLattice();
  const vertices = lattice.length * QUAD_CORNERS.length;

  const start = new Float32Array(vertices * 3);
  const end = new Float32Array(vertices * 3);
  const startLoose = new Float32Array(vertices * 3);
  const endLoose = new Float32Array(vertices * 3);
  const side = new Float32Array(vertices);
  const along = new Float32Array(vertices);
  const accent = new Float32Array(vertices);
  const core = new Float32Array(vertices);
  const seed = new Float32Array(vertices);

  lattice.forEach((segment, index) => {
    QUAD_CORNERS.forEach((corner, cornerIndex) => {
      const vertex = index * QUAD_CORNERS.length + cornerIndex;
      start.set(segment.a, vertex * 3);
      end.set(segment.b, vertex * 3);
      startLoose.set(segment.looseA, vertex * 3);
      endLoose.set(segment.looseB, vertex * 3);
      side[vertex] = corner[0];
      along[vertex] = corner[1];
      accent[vertex] = segment.accent;
      core[vertex] = segment.core;
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
  geometry.setAttribute('aAccent', new BufferAttribute(accent, 1));
  geometry.setAttribute('aCore', new BufferAttribute(core, 1));
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  return geometry;
};

type LatticeSceneProps = {
  /** Element whose scroll drives dispersal. */
  targetId: string;
  /** False when the tab is hidden or the hero has left the viewport. */
  active: boolean;
  /** Fired once the first frame is on screen, so the SVG beneath can retire. */
  onReady: () => void;
};

/**
 * The only file in the project that imports three. One draw call, one shader,
 * no lights, no post-processing, no textures.
 */
const LatticeScene = ({ targetId, active, onReady }: LatticeSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const onReadyRef = useRef(onReady);

  // Kept in a ref so a new callback identity never tears down the GL context.
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // three creates its own canvas rather than being handed one from JSX.
    // Cleanup below force-loses the GL context, which permanently disables that
    // canvas element — so a remount (React does one in development) must get a
    // brand new element or the renderer gets a null context and throws.
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    const geometry = buildGeometry();
    const material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uProgress: { value: 1 },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uStroke: { value: STROKE },
        uSheetStroke: { value: 0.05 },
        uPointer: { value: new Vector2(0, 0) },
        uInk: { value: new Color(token('--color-ink')) },
        uAccent: { value: new Color(token('--color-accent-fill')) },
      },
    });

    // The drawing is ink on paper in both themes, so the ink colour has to
    // follow the theme. Watching the attribute rather than listening for an
    // event means this also catches the system flipping at sunset.
    const readColours = () => {
      material.uniforms.uInk.value.set(token('--color-ink'));
      material.uniforms.uAccent.value.set(token('--color-accent-fill'));
    };
    const themeObserver = new MutationObserver(readColours);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const mesh = new Mesh(geometry, material);
    // Vertices are placed in the shader, so CPU-side bounds are meaningless.
    mesh.frustumCulled = false;

    const group = new Group();
    group.add(mesh);
    scene.add(group);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // The entrance is the brand argument in one gesture: scattered parts pulling
    // into a drawing that holds. It runs once, as the intro curtain lifts.
    const entrance = gsap.timeline();
    entrance
      .to(material.uniforms.uOpacity, { value: 1, duration: 0.9, ease: 'none' })
      .to(
        material.uniforms.uProgress,
        { value: 0, duration: 2.4, ease: 'power3.inOut' },
        0,
      );

    // Scroll takes over once the entrance is done, so the two never fight.
    const scrolled = { value: 0 };
    const trigger = ScrollTrigger.create({
      trigger: `#${targetId}`,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        scrolled.value = self.progress;
      },
    });

    const pointer = new Vector2(0, 0);
    const onPointerMove = (event: PointerEvent) => {
      // Into the same units the geometry uses, so the shader needs no maths.
      const bounds = container.getBoundingClientRect();
      const visibleHeight = 2 * camera.position.z * Math.tan(MathUtils.degToRad(camera.fov / 2));
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * visibleHeight * camera.aspect,
        -((event.clientY - bounds.top) / bounds.height - 0.5) * visibleHeight,
      );
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const limit = MathUtils.degToRad(3);
    const eased = new Vector2(0, 0);
    let frame = 0;
    let last = performance.now();
    let announced = false;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;

      material.uniforms.uTime.value += delta;

      if (!entrance.isActive() && entrance.progress() === 1) {
        material.uniforms.uProgress.value = MathUtils.damp(
          material.uniforms.uProgress.value,
          scrolled.value,
          4,
          delta,
        );
      }

      eased.x = MathUtils.damp(eased.x, pointer.x, 5, delta);
      eased.y = MathUtils.damp(eased.y, pointer.y, 5, delta);
      material.uniforms.uPointer.value.copy(eased);

      // Parallax capped at three degrees. More than that and it stops reading
      // as a drawing and starts reading as a toy.
      const reach = 6;
      group.rotation.y = MathUtils.damp(
        group.rotation.y,
        MathUtils.clamp(eased.x / reach, -1, 1) * limit,
        3,
        delta,
      );
      group.rotation.x = MathUtils.damp(
        group.rotation.x,
        MathUtils.clamp(eased.y / reach, -1, 1) * limit,
        3,
        delta,
      );

      renderer.render(scene, camera);

      if (!announced) {
        announced = true;
        onReadyRef.current();
      }
    };

    // Genuinely stopped, not just skipping the draw: no callback is queued at
    // all while the hero is off screen or the tab is in the background.
    loopRef.current = {
      start: () => {
        if (frame !== 0) return;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      },
      stop: () => {
        cancelAnimationFrame(frame);
        frame = 0;
      },
    };

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      loopRef.current = null;
      themeObserver.disconnect();
      entrance.kill();
      trigger.kill();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      geometry.dispose();
      material.dispose();
      // Releases the GL context outright rather than waiting on the garbage
      // collector; browsers cap how many a page may hold. Safe only because the
      // canvas element is discarded with it.
      renderer.forceContextLoss();
      renderer.dispose();
      canvas.remove();
    };
  }, [targetId]);

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (active) loop.start();
    else loop.stop();
  }, [active]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default LatticeScene;
