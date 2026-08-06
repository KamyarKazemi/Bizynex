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

/**
 * Whether this visit is a crawler, a preview bot, or an auditing tool rather
 * than a person.
 *
 * Duplicated — deliberately, and in exactly one other place. The same test runs
 * in the inline script in index.html, because that script has to reach a verdict
 * before this module exists, and this copy exists because the intro gate reaches
 * its own verdict independently and must not disagree with it. Two copies of six
 * lines is the cheaper problem; a bot that the cover skipped but the overture
 * did not would mount a WebGL scene over a page nobody is looking at.
 *
 * If this list changes, change it in index.html too.
 *
 * It is a hint, not proof — user agents lie in both directions. The cost of
 * being wrong is one visitor missing an animation, which is why a cheap test is
 * the right test.
 */
const NOT_A_PERSON =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|telegrambot|whatsapp|embedly/i;

export const isAutomatedVisit = () =>
  navigator.webdriver === true || NOT_A_PERSON.test(navigator.userAgent ?? '');
