import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SpotLight,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { fa } from '../content/fa';
import { whenCoverLifts } from '../hooks/introCover';
import { createCopyPlate } from './copyPlate';
import { WOVEN_FIGURE_3D } from './geometry';
import { buildSheetGeometry, buildSheetMaterial } from './sheet';
import { createWordmarkTexture } from './wordmark';

gsap.registerPlugin(ScrollTrigger);

/** Reads a brand token so no colour value is written twice. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ------------------------------------------------------------------------- *
 * The composition, front to back.
 *
 *   the mark      z = 0        lit, extruded, casts
 *   the copy      z = -1.6     the words, standing in the room
 *   the wordmark  z = -3.4     catches the shadow
 *   the sheet     z = -2.2 …   rule lines receding into fog
 *
 * Four layers with real distance between them, which is the entire point. The
 * word is not behind the mark because it is drawn underneath it — it is behind
 * it because it is further away, and the shadow falling across it is what makes
 * that readable rather than merely true.
 * ------------------------------------------------------------------------- */

const WORDMARK_Z = -3.4;
const COPY_Z = -1.6;
/** The nearest layer of the sheet — see SHEET_LAYERS in geometry.ts. */
const SHEET_Z = -2.2;
/** Bar thickness of the extruded mark, in grid units. Also the weave offset. */
const BAR = 0.42;

/* ------------------------------------------------------------------------- *
 * Two compositions, not one composition squeezed.
 *
 * A letterbox has width to spare, so the words go into the room and the mark
 * stands beside them, holding the opposite corner. A phone has none. Stacking
 * that same arrangement puts the mark's whole lower edge parallel to the top of
 * the copy, where any overlap at all eats a line of Persian rather than grazing
 * a corner — so on a portrait panel the words come out of the scene entirely and
 * the figure takes the frame.
 *
 * What that costs: the mark passing in front of the words, which is the one part
 * of this that cannot be had in portrait. What it buys: the figure at three
 * quarters of the panel width instead of a third of it, and a heading that is
 * real, selectable, scalable DOM text — see src/sections/Hero.tsx.
 *
 * Everything else survives the switch. The shadow, the fog, the four layers, the
 * sheet assembling and dispersing, the tilt. A phone is not given less of the
 * scene; it is given a different arrangement of the same one.
 * ------------------------------------------------------------------------- */

/**
 * Below this the panel is composed as a phone's.
 *
 * Not a viewport breakpoint: the scene lays itself out against the frame it is
 * handed, and the frame is what changes. Hero.tsx sets that frame — a square
 * stage below `sm`, a letterbox above it — so the two cannot disagree about
 * which composition is running.
 */
const PORTRAIT_BELOW = 1.2;

/**
 * Portrait: how much of the frame the sheet dissolves over at the bottom, as a
 * fraction of its height.
 *
 * The stage ends and the words begin immediately below it, so the rule lines
 * have to stop before the canvas edge does — a drawing cut off by a boundary
 * reads as a cropped image, and one that fades out reads as a room. A letterbox
 * has nothing underneath it and so has no floor at all.
 */
const TALL_FLOOR = 0.2;

/**
 * The letterbox composition, as fractions of the frame at each part's own depth.
 * These six numbers are the whole desktop panel; everything else follows.
 */
const WIDE = {
  /** Pushed away from the reading column, so the two never fight for the space. */
  markX: 0.18,
  /** Lifted clear of the copy, so only the lower arm reaches across it. */
  markY: 0.16,
  wordmarkY: 0.19,
  copyWidth: 0.54,
  copyInset: 0.07,
  copyBottom: 0.235,
} as const;

/**
 * How the room is lit, per theme. Colours come from the panel tokens; these
 * three numbers cannot, because no stylesheet has any use for them.
 *
 * A light room is not a dark room with the colours swapped. Fog pulls every
 * surface toward the wall colour, which deepens the composition when the wall is
 * navy and flattens it when the wall is bright — so the light theme runs a
 * fraction of the density and leans on the key light instead.
 */
const RIG = {
  light: { key: 3.4, ambient: 1.4, fog: 0.012 },
  dark: { key: 3.4, ambient: 1.1, fog: 0.052 },
} as const;

const readRig = () => (document.documentElement.dataset.theme === 'dark' ? RIG.dark : RIG.light);

const buildMark = (navy: Color) => {
  const mesh = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: navy, roughness: 0.44, metalness: 0.3 }),
    WOVEN_FIGURE_3D.length,
  );

  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const direction = new Vector3();

  WOVEN_FIGURE_3D.forEach((segment, index) => {
    const [ax, ay] = segment.a;
    const [bx, by] = segment.b;
    const length = Math.hypot(bx - ax, by - ay);

    // The weave, made physical: one diagonal a bar's thickness in front of the
    // frame, the other a bar's thickness behind it. Nothing to tune — the offset
    // is the thickness, so they clear each other exactly and always.
    position.set((ax + bx) / 2, (ay + by) / 2, segment.depth * BAR);
    direction.set(bx - ax, by - ay, 0).normalize();
    rotation.setFromUnitVectors(up, direction);
    // Bars overlap by their own width at the joints, which is what makes the
    // figure read as one solid object rather than a pile of sticks.
    scale.set(BAR, length + BAR, BAR);

    mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
  });

  return mesh;
};

type HeroSceneProps = {
  /** Element whose scroll drives dispersal. */
  targetId: string;
  /** False when the tab is hidden or the hero has left the viewport. */
  active: boolean;
  /** Fired once the first frame is on screen, so the SVG beneath can retire. */
  onReady: () => void;
  /**
   * Whether this scene is drawing the heading itself — true on a letterbox,
   * false on a phone. Fired on every layout, because rotating a handset moves
   * the panel from one composition to the other. The hero listens so its own
   * heading only ever steps aside for words that are genuinely on screen.
   */
  onCopyDrawn: (drawing: boolean) => void;
  /**
   * The scene can no longer draw. Only the GL context being lost fires this —
   * a thrown error goes to the boundary instead — and it exists because a lost
   * context is not an error React can see, so without it the panel stays blank
   * with the static figure already faded out.
   */
  onFailed: () => void;
};

/**
 * The hero: the woven figure as a real object, the name behind it, and the sheet
 * behind that.
 *
 * Lit rather than drawn. The previous version of this scene was one unlit draw
 * call and looked like what it was — a diagram. This one has a key light, a
 * shadow that lands on the wordmark, and fog between the layers, because the
 * brief was depth and depth is not something you can shade in.
 */
const HeroScene = ({ targetId, active, onReady, onCopyDrawn, onFailed }: HeroSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const onReadyRef = useRef(onReady);
  const onCopyDrawnRef = useRef(onCopyDrawn);
  const onFailedRef = useRef(onFailed);

  // Kept in refs so a new callback identity never tears down the GL context.
  useEffect(() => {
    onReadyRef.current = onReady;
    onCopyDrawnRef.current = onCopyDrawn;
    onFailedRef.current = onFailed;
  }, [onReady, onCopyDrawn, onFailed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // three creates its own canvas rather than being handed one from JSX.
    // Cleanup below force-loses the GL context, which permanently disables that
    // canvas element — so a remount (React does one in development) must get a
    // brand new element or the renderer gets a null context and throws.
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    // Shadows are the one genuinely expensive thing here, and the shadow falling
    // across the name is also the effect the whole composition depends on — so a
    // phone is not simply refused it. What a small screen gets instead is a
    // quarter of the map, which is where nearly all of the cost is, and a wider
    // filter to spend the coarseness on softness. The source is a broad one; the
    // shadow it throws has very little in it to resolve.
    const shadowMap = window.innerWidth >= 900 ? 1024 : 512;
    renderer.shadowMap.enabled = true;
    // PCF rather than PCFSoft, which three no longer has a shader path for — it
    // falls through to unfiltered, and unfiltered at 512 is a cut-out. This one
    // filters, and `key.shadow.radius` below is the softness.
    renderer.shadowMap.type = PCFShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    // The only three colours the theme does not touch: the figure is navy in
    // both, and teal is teal. Every surface that does follow the theme is left
    // to `paintTheme` below, so there is one place a panel colour is decided.
    const navy800 = new Color(token('--color-navy-800'));
    const teal300 = new Color(token('--color-teal-300'));
    const teal500 = new Color(token('--color-teal-500'));

    const scene = new Scene();
    // What turns three objects at three distances into a room with air in it.
    // Both of its arguments belong to the theme; `paintTheme` below owns every
    // change to them, and the density in particular is not 0.052 in both.
    const fog = new FogExp2(token('--color-panel'), readRig().fog);
    scene.fog = fog;

    const camera = new PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    /* -- The sheet, furthest back --------------------------------------- */

    const sheetMaterial = buildSheetMaterial(new Color());
    const sheet = new Mesh(buildSheetGeometry(), sheetMaterial);
    // Vertices are placed in the shader, so CPU-side bounds are meaningless.
    sheet.frustumCulled = false;

    /* -- The wordmark, catching the shadow ------------------------------ */

    // Only the texture is wanted here. The point sampler on the same object is
    // what the opening throws at this panel; the hero itself draws solid type.
    const { texture: wordmarkTexture } = createWordmarkTexture();
    const wordmarkMaterial = new MeshStandardMaterial({
      alphaMap: wordmarkTexture,
      transparent: true,
      roughness: 0.92,
      metalness: 0,
      depthWrite: false,
    });
    const wordmark = new Mesh(new PlaneGeometry(20, 20 * (384 / 2048)), wordmarkMaterial);
    wordmark.position.z = WORDMARK_Z;
    wordmark.receiveShadow = true;

    /* -- The mark, in front and casting --------------------------------- */

    const mark = buildMark(navy800);
    mark.castShadow = true;
    mark.receiveShadow = true;

    // Placement and idle float are two different owners of the same position, and
    // two owners is a fight. The pivot is where `layout` puts the figure; the
    // mark inside it is free to drift around that without ever being told where
    // it belongs.
    const markPivot = new Group();
    markPivot.add(mark);

    // The two teal segments are the only warm thing on the panel. They are set
    // by instance colour rather than a second mesh so the mark stays one draw
    // call, and they stay at the 1.4% CONTEXT.md section 3 asks for.
    const accentTint = new Color();
    WOVEN_FIGURE_3D.forEach((segment, index) => {
      accentTint.copy(segment.accent === true ? teal500 : navy800);
      mark.setColorAt(index, accentTint);
    });

    /* -- The copy, standing between the name and the mark ----------------
     * Unlit and unfogged, and both on purpose. Every other surface here is at
     * the mercy of a light and a fog density; a sentence someone has to read is
     * not allowed to be. Its contrast against the panel is fixed at 15:1 and
     * nothing in the scene can take that away from it.
     *
     * What the scene *can* do is stand in front of it: depth testing is on, so
     * the mark's lower arm crosses the top of this block and occludes it for
     * real. That is the effect — a bar passing in front of the words, not a bar
     * drawn through them.
     */

    const copy = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        transparent: true,
        // Never writes depth: it is the readable layer, and nothing behind it
        // should be culled by it.
        depthWrite: false,
        fog: false,
      }),
    );

    // Deferred: `resize` needs the plate's proportions, and the plate's redraw
    // callback needs to trigger a resize. Declared here so both can see it.
    let layout: () => void = () => undefined;
    // Ink is passed rather than left to `paintTheme` only because the plate
    // paints the moment it is built; `paintTheme` still owns every change to it.
    const plate = createCopyPlate(fa.hero.title, fa.hero.subtitle, token('--color-ink'), () =>
      layout(),
    );
    (copy.material as MeshBasicMaterial).map = plate.texture;

    // Rotation only. Every part below is placed at an absolute height by `layout`,
    // so what this group carries is the tilt of the room and nothing else.
    const group = new Group();
    group.add(sheet, wordmark, markPivot, copy);
    scene.add(group);

    /* -- Lighting -------------------------------------------------------
     * A key from high on the reading-start side, a cold rim from behind to peel
     * the mark off the sheet, and just enough ambient that the shadow side is
     * not a hole. Three lights, which is two fewer than it usually takes and
     * one more than a flat drawing needs.
     */

    const ambient = new AmbientLight();
    scene.add(ambient);

    // Colour and intensity are the theme's; the shape of the source is not.
    const key = new SpotLight();
    key.angle = 0.62;
    key.penumbra = 0.9;
    key.position.set(9, 11, 12);
    key.decay = 0;
    key.castShadow = true;
    key.shadow.mapSize.set(shadowMap, shadowMap);
    key.shadow.bias = -0.0016;
    key.shadow.camera.near = 4;
    key.shadow.camera.far = 44;
    // A wide, soft source. A point-sharp shadow across the letters would read as
    // a cut-out; the brief was an ambient one, and softness is radius. Measured
    // in texels, so the smaller map takes a wider one to land in the same place.
    key.shadow.radius = shadowMap === 1024 ? 5 : 4;
    scene.add(key, key.target);

    const rim = new DirectionalLight(teal300, 0.5);
    rim.position.set(-8, 2, -6);
    scene.add(rim);

    /* -- The theme -------------------------------------------------------
     * Every colour in the room in one function, so the light and dark panels
     * cannot drift apart, and so changing theme is a repaint rather than a
     * rebuild — the GL context, the geometry and the entrance timeline all
     * survive a toggle untouched.
     *
     * The document owns the theme (see src/hooks/useTheme.ts), so this watches
     * the attribute rather than the store: it then fires inside the same task
     * that flips it, which is what keeps the panel in step with the wave the
     * toggle draws instead of a frame or two behind it.
     */

    const paintTheme = () => {
      const wall = new Color(token('--color-panel'));
      const rig = readRig();

      renderer.setClearColor(wall, 1);
      fog.color.copy(wall);
      fog.density = rig.fog;

      sheetMaterial.uniforms.uInk.value.set(token('--color-panel-rule'));
      wordmarkMaterial.color.set(token('--color-panel-name'));
      plate.setInk(token('--color-ink'));

      ambient.color.set(token('--color-panel-ambient'));
      ambient.intensity = rig.ambient;
      key.color.set(token('--color-panel-key'));
      key.intensity = rig.key;
    };

    paintTheme();

    const themeObserver = new MutationObserver(paintTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    /* -- Fitting the panel ----------------------------------------------
     * The panel is a wide letterbox from `sm` up and a square stage below it.
     * The figure has to hold the frame in both, so the camera backs off until
     * the whole 8-unit grid fits whichever edge is tighter — the height on a
     * letterbox, the width on a phone, which is what makes the figure fill the
     * square stage rather than float in the middle of it.
     */

    const FIGURE_EXTENT = 5.6;

    /** The extent of the frame at a given depth, in world units. */
    const visibleAt = (z: number) => {
      const halfHeight = Math.tan(MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      return { halfHeight, halfWidth: halfHeight * camera.aspect };
    };

    /** Which of the two compositions this frame gets. */
    const isPortrait = () => camera.aspect < PORTRAIT_BELOW;

    // The cord of the layout: the reading column sits on the reading-start side,
    // which is right in Persian and left if this is ever mirrored.
    const towardStart = document.documentElement.dir === 'ltr' ? -1 : 1;

    layout = () => {
      const halfFov = MathUtils.degToRad(camera.fov / 2);
      const forHeight = FIGURE_EXTENT / Math.tan(halfFov);
      const forWidth = FIGURE_EXTENT / (Math.tan(halfFov) * camera.aspect);
      camera.position.z = Math.max(forHeight, forWidth);
      camera.updateProjectionMatrix();

      const portrait = isPortrait();

      // The word spans the frame rather than the figure, so it always reads as
      // the thing behind everything else rather than as a label under it.
      const behind = visibleAt(WORDMARK_Z);
      wordmark.scale.setScalar(Math.min(1, (behind.halfWidth * 2 * 0.92) / 20));
      wordmark.position.y = portrait ? 0 : behind.halfHeight * WIDE.wordmarkY;

      // Portrait centres it. The stage is square and the figure nearly fills it,
      // so there is no corner to hold and nowhere to push it — and the words are
      // not in the room to be pushed away from. A letterbox has the space, so the
      // figure is lifted off the copy and sent the other way; it holds the upper
      // opposite corner and the two never fight for the same part of the frame.
      const around = visibleAt(0);
      markPivot.position.set(
        portrait ? 0 : -towardStart * around.halfWidth * WIDE.markX,
        portrait ? 0 : around.halfHeight * WIDE.markY,
        0,
      );

      // The words are real DOM text on a phone, so the plate is not drawn there
      // at all — three never uploads a texture for a mesh it never renders. The
      // hero has to hear about that, or it hides a heading nothing is replacing.
      copy.visible = !portrait;
      onCopyDrawnRef.current(copy.visible);
      if (!portrait) {
        const front = visibleAt(COPY_Z);
        const width = front.halfWidth * 2 * WIDE.copyWidth;
        const height = width / plate.aspect();
        copy.scale.set(width, height, 1);
        copy.position.set(
          towardStart * (front.halfWidth - front.halfWidth * WIDE.copyInset - width / 2),
          -front.halfHeight + front.halfHeight * WIDE.copyBottom + height / 2,
          COPY_Z,
        );
      }

      // Where the room has to stop, and stop without an edge. On a phone the
      // stage ends and the heading begins directly under it, so the rule lines
      // dissolve into the paper over the last of the frame rather than being cut
      // by the canvas edge. A letterbox has nothing beneath it and so has no
      // floor — the value is put out of reach rather than branched on in the
      // shader, which runs per vertex.
      const under = visibleAt(SHEET_Z);
      sheetMaterial.uniforms.uFloor.value = portrait ? -under.halfHeight : -1e4;
      sheetMaterial.uniforms.uFloorFade.value = under.halfHeight * 2 * TALL_FLOOR;
    };

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      // Re-read rather than sampled once at mount: browser zoom changes the
      // ratio, and so does dragging the window onto a display of a different
      // density. Both reach here, because both change the panel's box.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;

      // Drawn at the resolution it will be seen at and no more. A texture larger
      // than its target does not sharpen text, it makes it crawl — and a phone,
      // which is not drawing the words at all, is asked for the smallest one.
      plate.setWidth(
        isPortrait() ? 0 : clientWidth * renderer.getPixelRatio() * WIDE.copyWidth,
      );

      layout();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* -- Entrance and scroll -------------------------------------------- */

    // Scattered parts pulling into something that holds — the brand argument in
    // one gesture. Held until the opening actually uncovers the page, so it is
    // not spent behind a panel, and so the wordmark thrown out of the opening
    // lands while this is still converging.
    const entrance = gsap.timeline({ paused: true });
    entrance
      .to(sheetMaterial.uniforms.uOpacity, { value: 1, duration: 0.9, ease: 'none' }, 0)
      .to(sheetMaterial.uniforms.uProgress, { value: 0, duration: 2.4, ease: 'power3.inOut' }, 0)
      .from(mark.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.5, ease: 'back.out(1.7)' }, 0.25)
      .from(mark.rotation, { z: -Math.PI / 2, duration: 1.8, ease: 'power3.out' }, 0.25)
      .from(wordmarkMaterial, { opacity: 0, duration: 1.4, ease: 'none' }, 0.6)
      // The words arrive last and arrive plainly — they fade in, and that is
      // all. Everything else in this timeline is allowed to be a flourish; the
      // sentence someone came here to read is not. Nothing here touches the
      // copy's position either: `layout` owns that, and two owners is a fight.
      .from(copy.material as MeshBasicMaterial, { opacity: 0, duration: 0.9, ease: 'none' }, 0.9);
    const stopWaiting = whenCoverLifts(() => entrance.play());

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
      const bounds = container.getBoundingClientRect();
      const visibleHeight = 2 * camera.position.z * Math.tan(MathUtils.degToRad(camera.fov / 2));
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * visibleHeight * camera.aspect,
        -((event.clientY - bounds.top) / bounds.height - 0.5) * visibleHeight,
      );
    };

    // A finger is not a cursor. There is no hover, so the sheet's tension and the
    // tilt would only ever fire while something is already covering the panel —
    // and each event costs a layout read on the device least able to afford one.
    // The room is not stiller for it: the idle drift in the loop is untouched.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    /* -- Loop ------------------------------------------------------------ */

    const limit = MathUtils.degToRad(9);
    const eased = new Vector2(0, 0);
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let announced = false;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += delta;

      sheetMaterial.uniforms.uTime.value = elapsed;

      if (!entrance.isActive() && entrance.progress() === 1) {
        sheetMaterial.uniforms.uProgress.value = MathUtils.damp(
          sheetMaterial.uniforms.uProgress.value,
          scrolled.value,
          4,
          delta,
        );
      }

      eased.x = MathUtils.damp(eased.x, pointer.x, 5, delta);
      eased.y = MathUtils.damp(eased.y, pointer.y, 5, delta);
      sheetMaterial.uniforms.uPointer.value.copy(eased);

      // Never quite still. Three slow, mutually prime periods so the movement
      // never visibly repeats and never resolves to a rest pose — the object
      // reads as something being looked at rather than a picture of itself.
      // Bigger than the old three degrees, because there is now a solid to turn.
      const reach = 6;
      group.rotation.y = MathUtils.damp(
        group.rotation.y,
        MathUtils.clamp(eased.x / reach, -1, 1) * limit + Math.sin(elapsed * 0.17) * 0.06,
        3,
        delta,
      );
      group.rotation.x = MathUtils.damp(
        group.rotation.x,
        MathUtils.clamp(eased.y / reach, -1, 1) * limit + Math.cos(elapsed * 0.13) * 0.04,
        3,
        delta,
      );
      mark.position.y = Math.sin(elapsed * 0.31) * 0.13;
      mark.position.z = Math.sin(elapsed * 0.11) * 0.35;

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

    // Mobile Safari drops GL contexts routinely when a tab is backgrounded, and
    // a dropped context throws nothing — the boundary above never fires, so
    // without this the panel is a blank rectangle for good while the loop keeps
    // drawing into a dead context. preventDefault stops the browser restoring
    // it underneath a scene that is about to be torn down; the report is what
    // brings the static figure back.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      onFailedRef.current();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      loopRef.current = null;
      stopWaiting();
      entrance.kill();
      trigger.kill();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);

      // Every geometry and material above, released by walking the graph — one
      // traversal cannot forget a mesh the way a hand-written list eventually
      // will.
      scene.traverse((object) => {
        const item = object as Partial<Mesh>;
        item.geometry?.dispose();
        const material = item.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
      wordmarkTexture.dispose();
      plate.dispose();
      key.shadow.map?.dispose();

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
    // targetId is here because the effect above rebuilds the loop when it
    // changes, and a fresh loop nobody starts is a blank panel.
  }, [active, targetId]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default HeroScene;
