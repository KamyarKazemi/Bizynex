import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { createOvertureAudio } from '../audio/overture';
import { fa } from '../content/fa';
import { liftCover } from '../hooks/introCover';
import { OvertureCanvas } from '../three/OvertureCanvas';
import type { OverturePhase } from '../three/OvertureScene';

/**
 * How long the ring takes to fill once the light is on.
 *
 * Long enough to watch the word rebuild itself — the tear and the particles take
 * a little over two seconds — and then look at it for a moment before the site
 * takes over. Turning the light back off stops the clock, and reaching for any
 * control pauses it.
 */
const COUNTDOWN_MS = 6500;
/**
 * The exit, and the moment inside it when the page appears.
 *
 * Both must match the timeline in OvertureScene. The reveal deliberately lands
 * in the *middle* of the throw, not at the end of it: the wordmark's particles
 * are still crossing the screen when the hero starts drawing itself, so for
 * about half a second both scenes are running and moving the same way. That
 * overlap is the entire transition — reveal at the end and it is a fade with
 * extra steps.
 */
const LEAVE_MS = 1750;
const REVEAL_AT_MS = 820;

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

const MUTE_KEY = 'bizynex:muted';

const RING_RADIUS = 26;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Where the cord lands on screen, as a fraction of the viewport.
 *
 * These are not guesses. OvertureScene places the lamp at a fixed fraction of
 * the visible height and width at the cord's depth, and because the visible
 * height at a given depth does not change with aspect ratio, both work out to
 * the same screen position on every device — so the label can be positioned in
 * CSS instead of being projected out of the scene every frame.
 */
const CORD_INSET = '4%';
const CORD_BELOW = '61%';

const wasMuted = () => {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
};

const rememberMuted = (muted: boolean) => {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked. The choice holds for this visit and no longer.
  }
};

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
 * pulls it, the countdown has a real button that skips it, sound has a real
 * button that stops it, and Escape leaves at any point.
 *
 * Nobody sees this twice in a session, and it never renders at all under reduced
 * motion, without WebGL, on a low-memory device, or without JavaScript — see
 * useIntroGate. The finished page is in the HTML underneath the whole time.
 */
export const Overture = ({ onFinished }: OvertureProps) => {
  const [phase, setPhase] = useState<OverturePhase>('dark');
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isMuted, setIsMuted] = useState(wasMuted);
  const pullRef = useRef<HTMLButtonElement>(null);

  /**
   * Which phase a hold on the countdown was taken in, or null for no hold.
   *
   * WCAG 2.2.1 asks that an automatic time limit be one a visitor can turn off,
   * adjust or extend. Hovering or focusing a control is the extension: someone
   * who has reached for something is plainly not finished looking.
   *
   * The phase is stored with the hold rather than a bare boolean so that a hold
   * expires with the phase it was taken in, derived, with nothing to reset. That
   * matters twice over: the pull button is focused on mount, so a hold that
   * survived would stall the first countdown before it ever started, and the
   * skip button can be unmounted from under a resting pointer, which not every
   * browser follows with a `pointerout`. Once the phase moves on, a hold can
   * only begin again by actually moving a pointer or focus onto a control —
   * which is the gesture being read in the first place.
   */
  const [heldIn, setHeldIn] = useState<OverturePhase | null>(null);
  const isHeld = heldIn === phase;

  /**
   * What is left of the countdown, in ms. A ref rather than state because it is
   * written from the cleanup of the effect that reads it, and state there would
   * re-run that effect on every pause.
   */
  const remainingRef = useRef(COUNTDOWN_MS);

  // One audio graph for the life of the opening. Created here rather than in the
  // scene because the mute control is here, and because it has to survive the
  // scene being torn down and rebuilt.
  const audio = useMemo(() => createOvertureAudio(), []);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => {
    audio.setMuted(isMuted);
  }, [audio, isMuted]);

  // Held in a ref so the timers below do not restart when React hands us a new
  // callback identity.
  const finishRef = useRef(onFinished);
  useEffect(() => {
    finishRef.current = onFinished;
  }, [onFinished]);

  /** The cord was pulled — on if it was off, off if it was on. */
  const toggle = useCallback(() => {
    audio.unlock();
    setPhase((current) => {
      if (current === 'leaving') return current;
      return current === 'dark' ? 'lit' : 'dark';
    });
  }, [audio]);

  const leave = useCallback(() => setPhase('leaving'), []);

  /** Straight out, no exit animation. Used by Escape, by skip, and by failure. */
  const bail = useCallback(() => finishRef.current(), []);

  const markReady = useCallback(() => setIsSceneReady(true), []);

  const toggleMuted = useCallback(() => {
    audio.unlock();
    setIsMuted((current) => {
      rememberMuted(!current);
      return !current;
    });
  }, [audio]);

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

  // The countdown belongs to the light. Turning it back off stops the clock and
  // resets it, because a visitor who reaches for the cord a second time is
  // plainly not finished looking. The ring itself needs no resetting — it
  // unmounts with the dark state and its animation starts over when it returns.
  //
  // A hold only *pauses*: the time already spent is kept, and the ring's own
  // animation is paused alongside it below, so the two never disagree about how
  // much is left. There is at most one timer alive at a time — every path out of
  // this effect runs the cleanup that clears it.
  useEffect(() => {
    if (phase === 'dark') {
      remainingRef.current = COUNTDOWN_MS;
      return;
    }
    if (phase !== 'lit' || isHeld) return;

    const startedAt = Date.now();
    const timer = window.setTimeout(leave, remainingRef.current);

    return () => {
      window.clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [phase, isHeld, leave]);

  useEffect(() => {
    if (phase !== 'leaving') return;

    // The cover from index.html is the same navy and sits directly behind this
    // panel, so both have to go together or the exit reveals another dark
    // screen. Lifting it is also what starts the hero's own entrance — see
    // whenCoverLifts — which is how the two scenes end up in step.
    const reveal = window.setTimeout(liftCover, REVEAL_AT_MS);
    const done = window.setTimeout(() => finishRef.current(), LEAVE_MS);

    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [phase]);

  const isLit = phase !== 'dark';

  return (
    // A dialog, but deliberately not aria-modal. Marking it modal would tell
    // assistive technology the page behind does not exist, and this component
    // has no focus trap to back that claim up — an honest non-modal dialog that
    // can be tabbed out of is the safer of the two failures.
    <div
      role="dialog"
      aria-label={fa.ui.overtureTitle}
      className={`fixed inset-0 z-50 bg-opening ${
        phase === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transitionProperty: 'opacity',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '640ms',
        // Held opaque for the first half of the exit so the throw happens in
        // the room, and only then handed over. Without the delay the room
        // dissolves out from under the particles on frame one.
        transitionDelay: phase === 'leaving' ? `${REVEAL_AT_MS}ms` : '0ms',
      }}
    >
      <div aria-hidden="true" className="absolute inset-0">
        <OvertureCanvas
          phase={phase}
          audio={audio}
          onPulled={toggle}
          onReady={markReady}
          onFailed={bail}
        />
      </div>

      {/* Something to look at while three.js is still on the wire — the same
          name, in the same place, at the same weight the scene will draw it, so
          the handover reads as the light finding it rather than as a swap. */}
      <p
        aria-hidden="true"
        dir="ltr"
        lang="en"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center font-semibold tracking-[0.16em] text-opening-faint transition-opacity duration-700 ${
          isSceneReady ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ fontSize: 'clamp(2rem, 1rem + 5vw, 4.5rem)' }}
      >
        BIZYNEX
      </p>

      {/* Controls float over the canvas, so this layer has to let a pointer
          through to the cord underneath. Each control turns events back on.

          Hover or focus anywhere in here pauses the countdown, and leaving
          resumes it. The handlers sit on the shared layer rather than on each
          control because `pointerover`/`focusin` bubble — one pair covers every
          control inside, including any added later. The `relatedTarget` checks
          are what stop a move *between* two controls from reading as a leave;
          it is the same test the header's pill uses. */}
      <div
        className="pointer-events-none absolute inset-0"
        onPointerOver={() => setHeldIn(phase)}
        onPointerOut={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeldIn(null);
        }}
        onFocus={() => setHeldIn(phase)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHeldIn(null);
        }}
      >
        <div className="absolute" style={{ insetInlineStart: CORD_INSET, top: CORD_BELOW }}>
          <button
            ref={pullRef}
            type="button"
            onClick={toggle}
            aria-label={isLit ? fa.ui.overturePullOffLabel : fa.ui.overturePullLabel}
            // aria-disabled, not disabled. This is the button we focus on mount,
            // and a real `disabled` would have the browser drop focus to <body>
            // the instant it was pressed — leaving a keyboard visitor with no
            // focus at all for the 1.75s exit. `toggle` already ignores presses
            // while leaving, so the button only has to *say* it is unavailable.
            // Nothing here was keyed off `:disabled`, so there is no visual state
            // to move across: the whole panel is already fading out by then.
            aria-disabled={phase === 'leaving'}
            className="pointer-events-auto min-h-11 px-2 text-label text-opening-ink underline decoration-opening-muted underline-offset-8 transition-colors duration-200 hover:decoration-opening-accent"
          >
            {isLit ? fa.ui.overturePullAgain : fa.ui.overturePull}
          </button>
        </div>

        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={isMuted}
          aria-label={isMuted ? fa.ui.overtureUnmute : fa.ui.overtureMute}
          className="pointer-events-auto absolute end-6 top-6 grid size-11 place-items-center text-opening-muted transition-colors duration-200 hover:text-opening-ink"
        >
          {isMuted ? (
            <HiOutlineSpeakerXMark aria-hidden="true" className="size-5" />
          ) : (
            <HiOutlineSpeakerWave aria-hidden="true" className="size-5" />
          )}
        </button>

        <div className="absolute inset-x-0 bottom-8 flex justify-center px-4">
          {phase === 'dark' ? (
            <button
              type="button"
              onClick={bail}
              className="pointer-events-auto min-h-11 px-3 text-label text-opening-muted underline underline-offset-4 transition-colors duration-200 hover:text-opening-ink"
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
                className="size-11 -rotate-90"
              >
                <circle
                  cx="30"
                  cy="30"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="2"
                  className="stroke-opening-faint"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="2"
                  strokeDasharray={RING_LENGTH}
                  style={
                    {
                      '--ring-length': RING_LENGTH,
                      animation: `ring-fill ${COUNTDOWN_MS}ms linear forwards`,
                      // Frozen in step with the timer above, so a paused clock
                      // looks paused rather than continuing to fill against a
                      // countdown that is no longer running. Longhand after the
                      // shorthand, which is what lets it win.
                      animationPlayState: isHeld ? 'paused' : 'running',
                    } as CSSProperties
                  }
                  className="stroke-opening-accent"
                />
              </svg>

              <button
                type="button"
                onClick={leave}
                className="pointer-events-auto min-h-11 px-2 text-label text-opening-ink underline decoration-opening-muted underline-offset-8 transition-colors duration-200 hover:decoration-opening-accent"
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
