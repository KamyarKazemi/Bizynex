import { fa } from './content/fa';
import { useCapabilityDetection } from './hooks/useCapabilityDetection';
import { useIntroGate } from './hooks/useIntroGate';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { Intro } from './sections/Intro';
import { Overture } from './sections/Overture';
import { Problem } from './sections/Problem';
import { Process } from './sections/Process';
import { Services } from './sections/Services';
import { Why } from './sections/Why';

const App = () => {
  useCapabilityDetection();
  const intro = useIntroGate();

  return (
    <>
      {/* Two openings, one gate. The overture is the 3D room; the curtain is
          the typed panel that runs where WebGL is not an option. Which one a
          visitor gets — or neither — is decided entirely in useIntroGate. */}
      {intro.isPlaying &&
        (intro.mode === 'overture' ? (
          <Overture onFinished={intro.finish} />
        ) : (
          <Intro onFinished={intro.finish} />
        ))}

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-3 focus:rounded-card focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {fa.ui.skipToContent}
      </a>

      <Header />

      <main id="main">
        <Hero />
        <Problem />
        <Services />
        <Process />
        <Why />
        <Contact />
      </main>

      <Footer />
    </>
  );
};

export default App;
