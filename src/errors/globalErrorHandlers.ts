import { showCrashScreen } from "./ErrorBoundary";

// Errors outside of rendering (event handlers, async code, Tauri calls) don't
// reach the error boundary. Usually only the one action that threw fails and
// the window keeps working, so these are logged. But several in a row means
// the window is likely broken, so show the crash screen instead.

/** Show the crash screen after this many errors... */
const ESCALATE_AFTER_ERRORS = 3;
/** ...within this many milliseconds. */
const ESCALATE_WITHIN_MS = 10_000;

/** Harmless browser noise that isn't a real failure. */
const IGNORED_MESSAGES = [/ResizeObserver loop/];

let recentErrorTimes: number[] = [];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function handleUncaughtError(error: unknown) {
  const message = errorMessage(error);
  if (IGNORED_MESSAGES.some((pattern) => pattern.test(message))) return;
  console.error("Uncaught error:", error);
  const now = Date.now();
  recentErrorTimes = recentErrorTimes.filter((time) => now - time < ESCALATE_WITHIN_MS);
  recentErrorTimes.push(now);
  if (recentErrorTimes.length >= ESCALATE_AFTER_ERRORS) {
    showCrashScreen(error);
  }
}

export function installGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    handleUncaughtError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    handleUncaughtError(event.reason);
  });
}
