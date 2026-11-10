import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { platform as getPlatform } from "@tauri-apps/plugin-os";

let projectName: string | null = null;
let edited = false;
let currentTitle: string | null = null;

/** Windows marks unsaved changes with an asterisk before the title. */
function composeTitle(name: string) {
  return getPlatform() === "windows" && edited ? `*${name}` : name;
}

/** Applies the title, skipping the round trip if it's already showing. */
function applyTitle(name: string) {
  const title = composeTitle(name);
  if (title === currentTitle) return;
  currentTitle = title;
  getCurrentWebviewWindow().setTitle(title);
}

/** Sets the project window's title, including any unsaved-changes marker. */
export function setProjectWindowTitle(name: string) {
  projectName = name;
  applyTitle(name);
}

/**
 * Marks the project window as having unsaved changes, or not. macOS shows a
 * dot in the close button (via the backend), and Windows adds an asterisk to
 * the title.
 */
export function setDocumentEdited(state: boolean) {
  const appWindow = getCurrentWebviewWindow();
  emit("set-document-edited", { state, windowLabel: appWindow.label });
  edited = state;
  // Before the title is first set, it'll pick up the marker then
  if (projectName !== null) applyTitle(projectName);
}
