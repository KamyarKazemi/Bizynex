import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  finishIntro,
  resolveIntro,
  selectIntroMode,
  selectIntroPlaying,
  type IntroMode,
} from '../store/capabilitySlice';
import { isAutomatedVisit, isLowMemory, prefersReducedMotion, supportsWebgl } from './deviceSupport';
import { removeCover } from './introCover';

const SESSION_KEY = 'bizynex:intro-shown';

/**
 * The room lays itself out against whatever viewport it is given, so this is a
 * floor rather than a breakpoint — below it the cord and the countdown would be
 * fighting for the same few square centimetres.
 */
const MIN_OVERTURE_WIDTH = 320;

/**
 * Reading and marking are two separate steps on purpose.
 *
 * They used to be one function that returned "have you seen this?" and recorded
 * the visit on the way out. That is a trap: StrictMode runs effects twice in
 * development, so the first run marked the session and the second run believed
 * the mark — and the opening skipped itself every single time. Anything that
 * decides something has to be safe to call twice.
 */
const hasSeenThisSession = () => {
  // Private-mode browsers can throw on storage access. An unreachable store
  // should mean "show it", not "break the page".
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Recorded when the opening ends rather than when it starts, so reloading
 * midway through replays it instead of swallowing it.
 */
const rememberSeen = () => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Nothing to do. The cost of a store we cannot write is that the opening
    // plays again on the next load, which is not worth handling.
  }
};

/**
 * Which opening, if any, this visitor gets.
 *
 * The order is deliberate: the cheapest reasons to show nothing are checked
 * first, and WebGL is only ever an upgrade on top of an opening that already
 * works without it.
 */
const decide = (): IntroMode | null => {
  // Cheapest and most absolute: a crawler renders the page once and does not
  // wait, so an opening it has to sit through is measured as the page. The
  // inline script in index.html already skipped the cover for the same visit;
  // this is the half of the decision that lives in React.
  if (isAutomatedVisit()) return null;
  if (prefersReducedMotion()) return null;
  if (hasSeenThisSession()) return null;

  const canRunTheRoom =
    supportsWebgl() && !isLowMemory() && window.innerWidth >= MIN_OVERTURE_WIDTH;

  return canRunTheRoom ? 'overture' : 'curtain';
};

/**
 * Decides whether an opening runs, and which one.
 *
 * It never runs on the server, so the prerendered HTML is the finished page and
 * a visitor without JavaScript is never stuck behind a panel that cannot lift.
 * It never runs twice in a session. It never runs under reduced motion.
 */
export const useIntroGate = () => {
  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector(selectIntroPlaying);
  const mode = useAppSelector(selectIntroMode);

  useEffect(() => {
    const decision = decide();
    // index.html put the cover up on two cheap checks. This is the full verdict,
    // so if it says no opening, the cover comes off now rather than lingering.
    if (decision === null) removeCover();
    dispatch(resolveIntro(decision));
  }, [dispatch]);

  const finish = useCallback(() => {
    rememberSeen();
    removeCover();
    dispatch(finishIntro());
  }, [dispatch]);

  return { isPlaying, mode, finish };
};
