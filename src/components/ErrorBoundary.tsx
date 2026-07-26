import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type ErrorBoundaryState = {
  failed: boolean;
};

/**
 * The only class component in this codebase, and the only place the "function
 * components only" rule is broken. React provides no hook equivalent for
 * catching render and effect errors, and the alternative is worse: without a
 * boundary, one failure inside the decorative canvas — a refused GL context, a
 * chunk that never arrives on a bad connection — unmounts the entire page and
 * leaves the visitor a blank screen.
 *
 * On failure this renders nothing at all, which leaves the static SVG behind it
 * showing. A visitor should never be able to tell that anything went wrong.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Left visible in the console on purpose: silent failure is how a broken
    // enhancement survives to production.
    console.error('Decorative scene failed; falling back to the static figure.', error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
