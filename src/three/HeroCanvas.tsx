import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAppSelector } from '../store';
import { selectCanvasEnabled } from '../store/capabilitySlice';
import { LATTICE_PANEL_ATTR } from './handoff';
import { LatticeFallback } from './LatticeFallback';

// Lazy so three.js lands in its own chunk and never blocks first paint.
const HeroScene = lazy(() => import('./HeroScene'));

type HeroCanvasProps = {
  targetId: string;
  className?: string;
  /**
   * True only while the scene has its own copy of the heading on screen. The
   * hero uses it to decide whether its DOM heading is the one being read or the
   * one being announced — see src/sections/Hero.tsx.
   *
   * False in every other case, and the list is the point: no WebGL, a scene that
   * has not painted yet, a scene that died, and a portrait panel, where the scene
   * paints happily and deliberately draws no words at all. Reporting the paint
   * instead of the words is how the heading goes missing on a phone.
   */
  onCopyDrawn?: (drawing: boolean) => void;
};

/**
 * Decorative. The page is fully readable with this component deleted — the panel
 * behind it is a flat rectangle and the heading sits on top of it either way,
 * which is why the copy is in the DOM rather than in the scene.
 *
 * The static SVG paints with the HTML and stays until WebGL has drawn its first
 * frame, then hands over. That ordering means there is no empty box waiting on a
 * chunk, no layout shift when it lands, and never two copies of the figure on
 * screen at once.
 */
export const HeroCanvas = ({ targetId, className, onCopyDrawn }: HeroCanvasProps) => {
  const canvasEnabled = useAppSelector(selectCanvasEnabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPaintedFrame, setHasPaintedFrame] = useState(false);
  const [sceneHasCopy, setSceneHasCopy] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleReady = useCallback(() => setHasPaintedFrame(true), []);
  const handleSceneCopy = useCallback((drawing: boolean) => setSceneHasCopy(drawing), []);

  // Restores the static figure to full opacity if the scene dies mid-flight.
  const handleError = useCallback(() => {
    setFailed(true);
    setHasPaintedFrame(false);
    setSceneHasCopy(false);
  }, []);

  // Both halves have to be true: the scene has to have chosen to draw the words,
  // and it has to have got a frame up. Reported from here rather than straight
  // out of the scene, because this is the component that knows about the failure
  // path too — the hero has to hear about a scene that dies as clearly as it
  // hears about one that starts.
  const copyDrawn = hasPaintedFrame && sceneHasCopy;

  useEffect(() => {
    onCopyDrawn?.(copyDrawn);
  }, [copyDrawn, onCopyDrawn]);

  // Render only while the hero is on screen and the tab is in front.
  useEffect(() => {
    const element = containerRef.current;
    if (!canvasEnabled || !element) return;

    let onScreen = false;
    const sync = () => setIsActive(onScreen && !document.hidden);

    const observer = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [canvasEnabled]);

  return (
    // Marked so the opening can find this panel on screen and throw the wordmark
    // into it. See src/three/handoff.ts — the attribute is the whole contract.
    <div ref={containerRef} aria-hidden="true" className={className} {...{ [LATTICE_PANEL_ATTR]: '' }}>
      <LatticeFallback
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          hasPaintedFrame ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {canvasEnabled && !failed && (
        <ErrorBoundary onError={handleError}>
          <Suspense fallback={null}>
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                hasPaintedFrame ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <HeroScene
                targetId={targetId}
                active={isActive}
                onReady={handleReady}
                onCopyDrawn={handleSceneCopy}
              />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};
