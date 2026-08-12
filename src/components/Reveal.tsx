import { useEffect, useRef, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Lifts a block into place as it comes up the page.
 *
 * ## The rule this component exists to keep
 *
 * **It never hides anything the visitor could already be reading.** The usual
 * scroll-reveal ships every block at `opacity: 0` in the HTML and waits for
 * script to un-hide it, which means a slow connection gets a blank page that
 * measures as fully loaded, and a blocked bundle gets a blank page forever.
 * On a site whose whole argument is that it opens on bad internet, that is not
 * a small compromise.
 *
 * So the hidden state is only ever *added*, in a browser, to something already
 * below the fold at that moment. What the server sends contains no hidden
 * content at all, and a visitor with no JavaScript sees the finished page —
 * not a degraded version of it, the same one.
 *
 * The two states are written straight onto the node rather than held in React
 * state, for the same reason as in Marked.tsx: this is one element being told
 * about itself, not something the rest of the page has an opinion about.
 *
 * Reduced motion is read directly rather than from the capability store,
 * because that store starts conservative and is corrected in an effect: by the
 * time it says "no reduced motion" this component's own effect has already
 * run, and it would have skipped the reveal for everybody.
 */
export const Reveal = ({ children, className }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Already on screen. Hiding it now to animate it back in would be the
      // page taking something away from a reader who has it.
      node.getBoundingClientRect().top < window.innerHeight
    ) {
      return;
    }

    node.dataset.reveal = 'pending';

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset.reveal = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
