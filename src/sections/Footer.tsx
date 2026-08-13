import { Logo } from '../components/Logo';
import { fa } from '../content/fa';
import { servicePageRoutes } from '../content/routes';
import { site } from '../content/site';

/**
 * Every page, from every page.
 *
 * This was the *only* thing linking the service pages until the header grew a
 * panel for them, and it is still the one that needs no script to work: if the
 * bundle never arrives, these four links are the site's navigation. Without
 * them the pages are orphans — reachable from the sitemap, which is a hint, and
 * from nothing a crawler actually follows.
 *
 * Built from the route table, so a new page appears here by existing and a
 * draft never does. Labels are the pages' own `h1`s, so a link and the page it
 * opens can never disagree about what the page is called.
 */

/**
 * The tagline sits here rather than in the hero because a plain, literal "what
 * we do and where we are" is what both a reader and a crawler expect to find in
 * a footer. Putting it in the hero would have cost the h1 its promise and left
 * the page opening on a list of services, which is what every competitor does.
 */
type FooterProps = {
  /**
   * The path of the page this footer is on, so the link back to it can say so.
   *
   * The list is identical on every page on purpose — navigation that changes
   * shape as you move through it is navigation you have to re-read. The current
   * page stays in it and is marked instead, which is also what a screen reader
   * needs: `aria-current="page"` is the difference between "four links" and
   * "four links, and you are on the third".
   */
  currentPath?: string;
};

export const Footer = ({ currentPath }: FooterProps) => {
  const links = servicePageRoutes();

  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-page px-6 py-10 sm:px-10 lg:px-16">
        {links.length > 0 ? (
          <nav aria-label={fa.services.title} className="mb-10">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {links.map((route) => {
                const isCurrent = route.path === currentPath;

                return (
                  <li key={route.key}>
                    <a
                      href={route.path}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`text-label underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline ${
                        isCurrent ? 'text-ink' : 'text-muted'
                      }`}
                    >
                      {fa.pages[route.key].title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Logo variant="horizontal" className="h-7 w-auto" />
            <p className="mt-4 text-label text-muted">{fa.footer.tagline}</p>
          </div>

          <p className="text-label text-muted">
            <span className="tabular-nums">{site.year}</span> · {fa.ui.brandName} ·{' '}
            {fa.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};
