import type { ReactNode } from 'react';

type SectionProps = {
  id: string;
  children: ReactNode;
  /** Alternates the background so the hairline between sections has something to separate. */
  surface?: boolean;
};

export const Section = ({ id, children, surface = false }: SectionProps) => (
  <section id={id} className={`border-t border-rule ${surface ? 'bg-surface' : 'bg-paper'}`}>
    <div className="mx-auto max-w-page px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-32">
      {children}
    </div>
  </section>
);
