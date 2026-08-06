import { Logo } from '../components/Logo';
import { fa } from '../content/fa';
import { site } from '../content/site';

/**
 * The tagline sits here rather than in the hero because a plain, literal "what
 * we do and where we are" is what both a reader and a crawler expect to find in
 * a footer. Putting it in the hero would have cost the h1 its promise and left
 * the page opening on a list of services, which is what every competitor does.
 */
export const Footer = () => (
  <footer className="border-t border-rule bg-paper">
    <div className="mx-auto flex max-w-page flex-wrap items-end justify-between gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <div>
        <Logo variant="horizontal" className="h-7 w-auto" />
        <p className="mt-4 text-label text-muted">{fa.footer.tagline}</p>
      </div>

      <p className="text-label text-muted">
        <span className="tabular-nums">{site.year}</span> · {fa.ui.brandName} · {fa.footer.rights}
      </p>
    </div>
  </footer>
);
