import { useEffect, useRef } from 'react';

/**
 * Stages an element from `pending` to `in` the first time it reaches the
 * viewport, by writing `data-<name>` straight onto the node. What that means
 * visually is entirely up to CSS — a block that lifts into place, a line that
 * draws itself.
 *
 * ## The rule this hook exists to keep
 *
 * **It never hides anything the visitor could already be reading.** The hidden
 * state is only ever *added*, in a browser, to something that was already below
 * the fold at that moment — so what the server sends contains no hidden content
 * at all, and a visitor with no JavaScript sees the finished page rather than a
 * degraded one. Anything already on screen is left exactly as it is: taking it
 * away to animate it back in is the page removing something from a reader who
 * has it.
 *
 * Reduced motion is read directly rather than from the capability store,
 * because that store starts conservative and is corrected in an effect — by the
 * time it says "no reduced motion" this hook has already run, and it would have
 * skipped the animation for everybody.
 *
 * The attribute is written to the DOM rather than held in React state on
 * purpose: this is one element being told about itself, twenty of them are on a
 * page at once, and none of it is state the rest of the page has an opinion
 * about.
 */
export const useArrival = <T extends HTMLElement>(name: 'reveal' | 'draw') => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      node.getBoundingClientRect().top < window.innerHeight
    ) {
      return;
    }

    node.dataset[name] = 'pending';

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset[name] = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [name]);

  return ref;
};
