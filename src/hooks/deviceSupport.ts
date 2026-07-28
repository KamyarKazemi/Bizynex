/**
 * What this browser and device can actually be asked to do.
 *
 * Two callers read these: the capability detection that decides whether the hero
 * canvas mounts, and the intro gate that decides whether the opening runs in
 * WebGL or as the plain typed curtain. Both must reach the same verdict, so the
 * probes live in one place rather than being written twice.
 *
 * Browser-only. Never call these during server rendering.
 */

export const supportsWebgl = () => {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
};

export const isLowMemory = () => {
  // Chromium-only. Absent elsewhere, in which case we do not assume the worst.
  const { deviceMemory } = navigator as Navigator & { deviceMemory?: number };
  return typeof deviceMemory === 'number' && deviceMemory < 4;
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
