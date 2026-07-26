import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { finishIntro, resolveIntro, selectIntroPlaying } from '../store/capabilitySlice';

const SESSION_KEY = 'bizynex:intro-shown';

const hasSeenThisSession = () => {
  // Private-mode browsers can throw on storage access. An unreachable store
  // should mean "show it", not "break the page".
  try {
    const seen = window.sessionStorage.getItem(SESSION_KEY) === '1';
    window.sessionStorage.setItem(SESSION_KEY, '1');
    return seen;
  } catch {
    return false;
  }
};

/**
 * Decides whether the opening curtain runs.
 *
 * It never runs on the server, so the prerendered HTML is the finished page and
 * a visitor without JavaScript is never stuck behind a panel that cannot lift.
 * It never runs twice in a session. It never runs under reduced motion.
 */
export const useIntroGate = () => {
  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector(selectIntroPlaying);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    dispatch(resolveIntro(!prefersReducedMotion && !hasSeenThisSession()));
  }, [dispatch]);

  const finish = useCallback(() => dispatch(finishIntro()), [dispatch]);

  return { isPlaying, finish };
};
