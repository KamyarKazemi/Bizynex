type SectionHeaderProps = {
  /** Persian numeral. Decorative — a drawing callout, not content. */
  index: string;
  title: string;
};

/**
 * The measure line: an index in the margin, the title, and a hairline running
 * off to the end of the row. This is the one structural device the whole page
 * repeats, and it costs a single border pixel.
 */
export const SectionHeader = ({ index, title }: SectionHeaderProps) => (
  <header className="mb-10 sm:mb-14">
    <p className="text-label text-muted" aria-hidden="true">
      {index}
    </p>
    <div className="mt-2 flex items-center gap-5">
      <h2 className="text-h2 font-semibold text-navy-800">{title}</h2>
      <span className="h-px flex-1 bg-rule" aria-hidden="true" />
    </div>
  </header>
);
