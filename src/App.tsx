import { fa } from './content/fa';
import { useCapabilityDetection } from './hooks/useCapabilityDetection';
import { useIntroGate } from './hooks/useIntroGate';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { Intro } from './sections/Intro';
import { Problem } from './sections/Problem';
import { Process } from './sections/Process';
import { Services } from './sections/Services';
import { Team } from './sections/Team';
import { Why } from './sections/Why';

const App = () => {
  useCapabilityDetection();
  const intro = useIntroGate();

  return (
    <>
      {intro.isPlaying && <Intro onFinished={intro.finish} />}

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-3 focus:rounded-card focus:bg-navy-800 focus:px-4 focus:py-2 focus:text-paper"
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
        <Team />
        <Contact />
      </main>

      <Footer />
    </>
  );
};

export default App;
