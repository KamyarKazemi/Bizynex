import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OtherPages } from '../components/OtherPages';
import { fa } from '../content/fa';
import { useCapabilityDetection } from '../hooks/useCapabilityDetection';
import { useIntroGate } from '../hooks/useIntroGate';
import { Contact } from '../sections/Contact';
import { Delivered } from '../sections/Delivered';
import { Faq } from '../sections/Faq';
import { Footer } from '../sections/Footer';
import { Header } from '../sections/Header';
import { Hero } from '../sections/Hero';
import { Pricing } from '../sections/Pricing';
import { Problem } from '../sections/Problem';
import { Process } from '../sections/Process';
import { Services } from '../sections/Services';

// Lazy for the same reason HeroScene is: most visits never see an opening at
// all — a returning visitor inside the same session, anyone under reduced
// motion, and every crawler are all excluded by useIntroGate before either of
// these could render. Statically imported, the overture dragged the Web Audio
// synth and two react-icons glyphs into the entry chunk, and the curtain
// dragged the typewriter synth, on every single visit. Named exports, hence
// the re-wrap.
const Overture = lazy(() => import('../sections/Overture').then((m) => ({ default: m.Overture })));
const Intro = lazy(() => import('../sections/Intro').then((m) => ({ default: m.Intro })));

/**
 * The whole of `/`. This was App itself until there was a second page; App is
 * now only the switch that picks between this and ServicePage.
 *
 * The openings live here rather than in App on purpose. They are the entrance
 * to the site, and a visitor who lands directly on a service page is not
 * entering — they arrived from a search result for one specific thing and an
 * animated room in front of it is an obstacle. Keeping the gate here also keeps
 * the hook order on this page byte-identical to what it was before the split.
 */
export const HomePage = () => {
  useCapabilityDetection();
  const intro = useIntroGate();

  return (
    <>
      {/* Two openings, one gate. The overture is the 3D room; the curtain is
          the typed panel that runs where WebGL is not an option. Which one a
          visitor gets — or neither — is decided entirely in useIntroGate.

          `isPlaying` is false until that gate has run, and it never runs on the
          server, so this suspends only in the browser and the prerendered HTML
          is unaffected. The fallback is null on purpose: the opaque cover from
          index.html is already covering the page while the chunk is on the
          wire, so there is nothing to fill and a spinner would only flash.

          The boundary is not optional now that this is a chunk. A rejected
          import() throws during render, and an unhandled throw takes the whole
          root down — the finished page included. Catching it and calling
          `finish` is the same exit the overture already takes when its scene
          fails: the cover comes off and the visitor lands on the page. */}
      <ErrorBoundary onError={intro.finish}>
        <Suspense fallback={null}>
          {intro.isPlaying &&
            (intro.mode === 'overture' ? (
              <Overture onFinished={intro.finish} />
            ) : (
              <Intro onFinished={intro.finish} />
            ))}
        </Suspense>
      </ErrorBoundary>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-3 focus:rounded-card focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {fa.ui.skipToContent}
      </a>

      <Header currentPath="/" />

      <main id="main">
        {/* Render order is the reading order the copy was written against, and
            it is the order SECTION_IDS declares. Moving a section here means
            moving it there too, and renumbering SECTION_INDEX. */}
        <Hero />
        <Problem />
        <Services />
        {/* Directly under the four service cards, because it is the same four
            things one level deeper — the cards name each service, this is where
            each one is argued in full. It is also the only link to those pages
            inside the page itself: until now they were reachable from the
            header panel and the footer and from nothing a reader scrolling the
            home page would ever meet.

            Not a `Section`, and deliberately unnumbered: SECTION_IDS is the
            page's seven-part argument and jsonLd.ts builds `hasPart` by walking
            it. This is navigation between two of those parts, not an eighth
            one. */}
        <OtherPages />
        <Process />
        <Delivered />
        <Pricing />
        <Faq />
        <Contact />
      </main>

      <Footer currentPath="/" />
    </>
  );
};
