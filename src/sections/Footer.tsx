import { Logo } from '../components/Logo';
import { fa } from '../content/fa';
import { site } from '../content/site';

export const Footer = () => (
  <footer className="border-t border-rule bg-paper">
    <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <Logo variant="horizontal" className="h-7 w-auto" />
      <p className="text-label text-muted">
        <span className="tabular-nums">{site.year}</span> · {fa.footer.rights}
      </p>
    </div>
  </footer>
);
