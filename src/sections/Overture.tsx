import { useCallback, useEffect, useRef, useState } from 'react';
import { fa } from '../content/fa';
import { OvertureCanvas } from '../three/OvertureCanvas';
import type { OverturePhase } from '../three/OvertureScene';

/** How long the ring takes to fill once the light is on. */
const COUNTDOWN_MS = 5000;
/** Must match the exit timeline in OvertureScene. */
const LEAVE_MS = 1100;

/**
 * How long a visitor may be held in front of an empty room before we give up on
 * it and let them through.
 *
 * This is the honest cost of the opening: three.js is around 160 KB gzipped and
 * it is being fetched while the panel is already covering the page. On a good
 * connection that is imperceptible. On a bad one — which CONTEXT.md section 8
 * says to assume — it is a navy rectangle with nothing in it, and past about
 * five seconds the right thing to show someone is the website.
 */
const SCENE_TIMEOUT_MS = 5000;

const RING_RADIUS = 26;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Where the cord lands on screen, as a fraction of the viewport.
 *
 * These are not guesses. OvertureScene places the lamp at a fixed fraction of
 * the visible height and width at the cord's depth, and both work out to the
 * same screen position on every aspect ratio — so the label can be positioned in
 * CSS instead of being projected out of the scene every frame.
 */
const CORD_INSET = '4%';
const CORD_BELOW = '61%';

type OvertureProps = {
  onFinished: () => void;
};

/**
 * The opening room, and the parts of it that have to be real HTML.
 *
 * The scene owns everything that is drawn; this owns everything that has to be
 * operable. That split is not tidiness — a cord you pull with a pointer is not a
 * control, and a visitor on a keyboard would otherwise be standing in a dark
 * room with no way out. So the instruction beside the cord is a real button that
 * pulls it, the countdown has a real button that skips it, and Escape leaves at
 * any point.
 *
 * Nobody sees this twice in a session, and it never renders at all under reduced
 * motion, without WebGL, on a low-memory device, or without JavaScript — see
 * useIntroGate. The finished page is in the HTML underneath the whole time.
 */
export const Overture = ({ onFinished }: OvertureProps) => {
  const [phase, setPhase] = useState<OverturePhase>('dark');
  const [isRingFull, setIsRingFull] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const pullRef = useRef<HTMLButtonElement>(null);

  // Held in a ref so the timers below do not restart when React hands us a new
  // callback identity.
  const finishRef = useRef(onFinished);
  useEffect(() => {
    finishRef.current = onFinished;
  }, [onFinished]);

  const light = useCallback(() => {
    setPhase((current) => (current === 'dark' ? 'lit' : current));
  }, []);

  const leave = useCallback(() => setPhase('leaving'), []);

  /** Straight out, no exit animation. Used by Escape, by skip, and by failure. */
  const bail = useCallback(() => finishRef.current(), []);

  const markReady = useCallback(() => setIsSceneReady(true), []);

  // Nothing has been drawn yet, so start the clock on giving up.
  useEffect(() => {
    if (isSceneReady) return;
    const timer = window.setTimeout(bail, SCENE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isSceneReady, bail]);

  useEffect(() => {
    pullRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (phase !== 'lit') return;

    // One frame late on purpose: the ring has to be painted at its empty length
    // before the full length is something to transition *to*.
    const frame = requestAnimationFrame(() => setIsRingFull(true));
    const timer = window.setTimeout(leave, COUNTDOWN_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [phase, leave]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = window.setTimeout(() => finishRef.current(), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    // A dialog, but deliberately not aria-modal. Marking it modal would tell
    // assistive technology the page behind does not exist, and this component
    // has no focus trap to back that claim up — an honest non-modal dialog that
    // can be tabbed out of is the safer of the two failures.
    <div
      role="dialog"
      aria-label={fa.ui.overtureTitle}
      className={`fixed inset-0 z-50 bg-navy-900 transition-opacity duration-500 ${
        phase === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div aria-hidden="true" className="absolute inset-0">
        <OvertureCanvas phase={phase} onPulled={light} onReady={markReady} onFailed={bail} />
      </div>

      {/* Something to look at while three.js is still on the wire — the same
          name, in the same place, at the same weight the scene will draw it, so
          the handover reads as the light finding it rather than as a swap. */}
      <p
        aria-hidden="true"
        dir="ltr"
        lang="en"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center font-semibold tracking-[0.16em] text-navy-700 transition-opacity duration-700 ${
          isSceneReady ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ fontSize: 'clamp(2rem, 1rem + 5vw, 4.5rem)' }}
      >
        BIZYNEX
      </p>

      {/* Controls float over the canvas, so this layer has to let a pointer
          through to the cord underneath. Each control turns events back on. */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute transition-opacity duration-500 ${
            phase === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ insetInlineStart: CORD_INSET, top: CORD_BELOW }}
        >
          <button
            ref={pullRef}
            type="button"
            onClick={light}
            aria-label={fa.ui.overturePullLabel}
            disabled={phase !== 'dark'}
            className="pointer-events-auto text-label text-navy-100 underline decoration-navy-600 underline-offset-8 transition-colors duration-200 hover:decoration-teal-300"
          >
            {fa.ui.overturePull}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          {phase === 'dark' ? (
            <button
              type="button"
              onClick={bail}
              className="pointer-events-auto text-label text-navy-600 underline underline-offset-4 transition-colors duration-200 hover:text-navy-100"
            >
              {fa.ui.skipIntro}
            </button>
          ) : (
            <div
              className={`flex items-center gap-4 transition-opacity duration-300 ${
                phase === 'leaving' ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <svg
                viewBox="0 0 60 60"
                role="timer"
                aria-label={fa.ui.overtureCountdown}
                className="h-12 w-12 -rotate-90"
              >
                <circle
                  cx="30"
                  cy="30"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="2"
                  className="stroke-navy-700"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="2"
                  strokeDasharray={RING_LENGTH}
                  strokeDashoffset={isRingFull ? 0 : RING_LENGTH}
                  style={{ transition: `stroke-dashoffset ${COUNTDOWN_MS}ms linear` }}
                  className="stroke-teal-300"
                />
              </svg>

              <button
                type="button"
                onClick={leave}
                className="pointer-events-auto text-label text-navy-100 underline decoration-navy-600 underline-offset-8 transition-colors duration-200 hover:decoration-teal-300"
              >
                {fa.ui.overtureEnter}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
