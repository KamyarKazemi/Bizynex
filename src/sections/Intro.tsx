import { useCallback, useEffect, useRef, useState } from 'react';
import { createKeySound } from '../audio/typewriter';
import { fa } from '../content/fa';
import { liftCover } from '../hooks/introCover';

const WORDMARK = 'Bizynex';
const MS_PER_CHARACTER = 105;
const HOLD_AFTER_TYPING = 420;
const WIPE_DURATION = 620;

type IntroProps = {
  onFinished: () => void;
};

/**
 * The opening curtain: the wordmark types itself, then the panel wipes away on a
 * 45-degree edge to reveal the page.
 *
 * Three things stop this becoming the reason someone leaves: it runs once per
 * session, it can be skipped, and it never renders at all under
 * `prefers-reduced-motion` or without JavaScript — the page underneath is
 * already complete in the HTML in every case.
 *
 * Sound is not attempted on load, because browsers block audio before a user
 * gesture. The first pointer or key event unlocks it, so a visitor who touches
 * the page hears the rest of the line; a visitor who touches nothing gets a
 * silent intro. Note that unlocking and skipping are deliberately different
 * gestures — if any click dismissed the panel, the click that turns the sound on
 * would also remove the thing making it.
 */
export const Intro = ({ onFinished }: IntroProps) => {
  const [typedCount, setTypedCount] = useState(0);
  const [isWiping, setIsWiping] = useState(false);
  const finishRef = useRef<() => void>(() => undefined);

  const skip = useCallback(() => finishRef.current(), []);

  useEffect(() => {
    const sound = createKeySound();
    const timers: number[] = [];
    let frame = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      // The pre-paint cover from index.html is the same navy as this panel and
      // sits directly behind it. Without lifting it here the wipe would reveal
      // another dark rectangle instead of the page.
      liftCover();
      setIsWiping(true);
      timers.push(window.setTimeout(onFinished, WIPE_DURATION));
    };
    finishRef.current = finish;

    // Any real gesture unlocks audio; none of these dismiss the panel.
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });

    // Escape leaves. So does scrolling — reaching for the content is the
    // clearest possible statement that the visitor is done watching.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', finish, { passive: true, once: true });
    window.addEventListener('touchmove', finish, { passive: true, once: true });

    const start = performance.now();
    let typed = 0;

    const tick = (now: number) => {
      const target = Math.min(WORDMARK.length, Math.floor((now - start) / MS_PER_CHARACTER));

      if (target > typed) {
        typed = target;
        setTypedCount(typed);
        sound.key();
      }

      if (typed < WORDMARK.length) {
        frame = requestAnimationFrame(tick);
        return;
      }

      sound.bell();
      timers.push(window.setTimeout(finish, HOLD_AFTER_TYPING));
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchmove', finish);
      sound.dispose();
    };
  }, [onFinished]);

  return (
    <>
      {/* Decorative panel. The real page is already behind it, in the DOM and
          readable by assistive technology, so this is hidden from it entirely. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-opening"
        style={{
          clipPath: isWiping
            ? 'polygon(0% -118%, 100% -100%, 100% 0%, 0% -18%)'
            : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 118%)',
          transition: `clip-path ${WIPE_DURATION}ms cubic-bezier(0.76, 0, 0.24, 1)`,
          willChange: 'clip-path',
        }}
      >
        <p
          dir="ltr"
          lang="en"
          className={`flex items-baseline font-semibold tracking-tight text-opening-ink transition-opacity duration-300 ${
            isWiping ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ fontSize: 'clamp(2.5rem, 1.5rem + 5vw, 5rem)' }}
        >
          <span>{WORDMARK.slice(0, typedCount)}</span>
          {/* The caret is the single teal element on this screen. */}
          <span className="ms-[0.08em] inline-block h-[0.9em] w-[0.06em] self-center bg-accent-fill motion-safe:animate-[caret_1s_steps(2)_infinite]" />
        </p>
      </div>

      {/* Outside the hidden panel so it is a real, reachable control.
          Centred by a full-width strip rather than a physical inset plus a
          translate, so it survives the day the layout is mirrored. The strip
          spans the viewport, so it has to let pointer events through to the
          page behind it; only the button itself takes them back. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
        <button
          type="button"
          onClick={skip}
          className={`min-h-11 px-3 text-label text-opening-muted underline underline-offset-4 transition-opacity duration-300 hover:text-opening-ink focus-visible:text-opening-ink ${
            isWiping ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
          }`}
        >
          {fa.ui.skipIntro}
        </button>
      </div>
    </>
  );
};
