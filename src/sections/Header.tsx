import { ThemeToggle } from '../components/ThemeToggle';
import { fa } from '../content/fa';
import { NAV_LINKS } from '../content/site';

/**
 * Deliberately carries no logo. The stacked mark is the hero's job and the
 * horizontal mark is the footer's; a third lockup 80px above the first would
 * break the one-logo-per-surface rule in CONTEXT.md section 3.
 *
 * Solid background, not a translucent blur — glassmorphism is on the rejected
 * list. No hamburger either: four short Persian words fit at 360px, so a menu
 * button would add state and a focus trap to solve nothing.
 */
export const Header = () => (
  <div className="sticky top-0 z-20 border-b border-rule bg-paper">
    <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16">
      <nav aria-label={fa.ui.mainNav}>
        <ul className="flex items-center gap-5 sm:gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                className="text-label text-ink-soft transition-colors duration-200 hover:text-accent-text sm:text-body"
              >
                {fa.nav[link.key]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ThemeToggle />
    </div>
  </div>
);
