import { useEffect } from 'react';
import { useAppDispatch } from '../store';
import { markPainted, setDeviceSupport, setReducedMotion } from '../store/capabilitySlice';
import { isLowMemory, supportsWebgl } from './deviceSupport';

/**
 * Runs once, after the first paint, and keeps the reduced-motion preference in
 * sync if the visitor changes it while the page is open.
 */
export const useCapabilityDetection = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => dispatch(setReducedMotion(motionQuery.matches));

    syncMotion();
    dispatch(setDeviceSupport({ supportsWebgl: supportsWebgl(), isLowMemory: isLowMemory() }));

    // Two frames: one to commit this paint, one to be sure it reached the
    // screen before anything starts competing for the main thread.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => dispatch(markPainted()));
    });

    motionQuery.addEventListener('change', syncMotion);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      motionQuery.removeEventListener('change', syncMotion);
    };
  }, [dispatch]);
};
