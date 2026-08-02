import { useEffect, useState } from 'react';

/**
 * Which section the reader is currently inside, for the header's readout.
 *
 * The observer watches a thin band across the upper third of the viewport rather
 * than the whole screen. With a full-height root three sections intersect at
 * once and "current" stops meaning anything; with a band, a section becomes
 * current exactly when its top crosses it — the same moment a reader would say
 * they had arrived at it.
 *
 * The last answer is kept when nothing is in the band, which happens in the hero
 * above the first section and while passing a section the nav does not link to.
 * Holding the previous value means the readout never blinks empty, and "the last
 * place you passed" is the honest answer to where you are.
 *
 * `ids` must be a stable array — a fresh one on every render would rebuild the
 * observer on every render. Callers pass a module-level constant.
 */
export const useActiveSection = (ids: readonly string[]) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-25% 0px -70% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
};
