import { render } from "preact";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { WindowType } from "../typings";
import { CrashScreen } from "./CrashScreen";
import { isErrorBoundaryMounted, showCrashScreen } from "./ErrorBoundary";

/**
 * Handle an error thrown while a window is starting up (loading, migrating, or
 * setting up a project). If it happened before the window's contents were
 * rendered, there's no error boundary to catch it, so render the crash screen
 * directly instead of leaving the window blank.
 */
export function handleStartupError(error: unknown) {
  if (isErrorBoundaryMounted()) {
    showCrashScreen(error);
    return;
  }
  console.error("Window failed to start:", error);
  const root = document.getElementById("root");
  if (!root) return;
  const windowType = new URLSearchParams(window.location.search).get(
    "window_type"
  ) as WindowType;
  render(
    <div id="App" data-platform={getPlatform()} data-focused-region="">
      <CrashScreen error={error} windowType={windowType} />
    </div>,
    root
  );
  // Some windows stay hidden until their contents are ready
  getCurrentWebviewWindow()
    .show()
    .catch(() => {});
}
