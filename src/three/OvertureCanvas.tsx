import { Suspense, lazy, useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { OverturePhase } from './OvertureScene';

// Lazy so three.js lands in its own chunk and never blocks first paint.
const OvertureScene = lazy(() => import('./OvertureScene'));

type OvertureCanvasProps = {
  phase: OverturePhase;
  onPulled: () => void;
  /** First frame is drawn. */
  onReady: () => void;
  /** Called if the scene cannot run, so the opening can get out of the way. */
  onFailed: () => void;
};

/**
 * Mounts the opening room, and gets rid of it if it cannot be drawn.
 *
 * The difference between this and LatticeCanvas is what failure means. The
 * lattice is decoration beside the words, so a dead canvas just leaves the SVG
 * showing. This one is covering the entire site — if it breaks, the only
 * acceptable outcome is that the visitor is let through immediately.
 */
export const OvertureCanvas = ({ phase, onPulled, onReady, onFailed }: OvertureCanvasProps) => {
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const sync = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return (
    <ErrorBoundary onError={onFailed}>
      <Suspense fallback={null}>
        <OvertureScene
          phase={phase}
          active={isTabVisible}
          onPulled={onPulled}
          onReady={onReady}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
