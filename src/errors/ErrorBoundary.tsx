import { Component, ComponentChildren } from "preact";
import { WindowType } from "../typings";
import { CrashScreen } from "./CrashScreen";

interface ErrorBoundaryProps {
  windowType: WindowType;
  children: ComponentChildren;
}

interface ErrorBoundaryState {
  crashed: boolean;
  error?: unknown;
}

let crashHandler: ((error: unknown) => void) | undefined;

/**
 * Replace the window's contents with the crash screen. For errors outside of
 * rendering (see globalErrorHandlers.ts) that are serious enough to stop.
 */
export function showCrashScreen(error: unknown) {
  crashHandler?.(error);
}

/** Whether a window's contents (and so its error boundary) are on screen. */
export function isErrorBoundaryMounted(): boolean {
  return crashHandler !== undefined;
}

/**
 * Wraps each window's contents. If rendering throws, shows the crash screen
 * instead of leaving the window blank or frozen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { crashed: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { crashed: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error("Window crashed:", error);
  }

  componentDidMount() {
    crashHandler = (error) => {
      if (this.state.crashed) return;
      console.error("Window crashed:", error);
      this.setState({ crashed: true, error });
    };
  }

  componentWillUnmount() {
    crashHandler = undefined;
  }

  render() {
    if (this.state.crashed) {
      return <CrashScreen error={this.state.error} windowType={this.props.windowType} />;
    }
    return this.props.children;
  }
}
