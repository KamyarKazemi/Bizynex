import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAppSelector } from '../store';
import { selectCanvasEnabled } from '../store/capabilitySlice';
import { LatticeFallback } from './LatticeFallback';

// Lazy so three.js lands in its own chunk and never blocks first paint.
const LatticeScene = lazy(() => import('./LatticeScene'));

type LatticeCanvasProps = {
  targetId: string;
  className?: string;
};

/**
 * Decorative. The page is fully readable with this component deleted.
 *
 * The static SVG paints with the HTML and stays until WebGL has drawn its first
 * frame, then hands over. That ordering means there is no empty box waiting on
 * a chunk, no layout shift when it lands, and never two copies of the figure on
 * screen at once.
 */
export const LatticeCanvas = ({ targetId, className }: LatticeCanvasProps) => {
  const canvasEnabled = useAppSelector(selectCanvasEnabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPaintedFrame, setHasPaintedFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleReady = useCallback(() => setHasPaintedFrame(true), []);

  // Restores the static figure to full opacity if the scene dies mid-flight.
  const handleError = useCallback(() => {
    setFailed(true);
    setHasPaintedFrame(false);
  }, []);

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
    <div ref={containerRef} aria-hidden="true" className={className}>
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
              <LatticeScene targetId={targetId} active={isActive} onReady={handleReady} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};
