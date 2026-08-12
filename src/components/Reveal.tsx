import type { ReactNode } from 'react';
import { useArrival } from '../hooks/useArrival';

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Lifts a block into place as it comes up the page.
 *
 * All of the care is in `useArrival` — most of it about what this must *not*
 * do, which is hide anything the visitor could already be reading. See there.
 * The two states are styled in index.css.
 */
export const Reveal = ({ children, className }: RevealProps) => (
  <div ref={useArrival<HTMLDivElement>('reveal')} className={className}>
    {children}
  </div>
);
