import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { exit } from "@tauri-apps/plugin-process";
import { getProjectSettingsWindow } from "../editor/settings/getProjectSettingsWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getViewStore } from "../data/dataStore";
import { ask } from "@tauri-apps/plugin-dialog";
const appWindow = getCurrentWebviewWindow();

export async function handleClose() {
  // Clear cache
  const cacheBase = await appCacheDir();
  const cachePath = await resolve(cacheBase, "Projects");
  emit("clear-cache", {
    path: cachePath,
  });
  // Close settings window if it's open
  const projectSettingsWindow = await getProjectSettingsWindow(
    getProjectWindowLabel(getViewStore().projectPath, "settings")
  );
  if (projectSettingsWindow) {
    projectSettingsWindow.destroy();
  }
  // Close it, baby!
  appWindow.destroy();
}

export async function handleCloseRequest(closeFn?: Function) {
  const store = getViewStore();
  if (store.saved === true) {
    if (typeof closeFn !== "undefined") {
      closeFn();
    } else {
      handleClose();
    }
    return;
  }
  const confirm = await ask(
    "Do you want to save your changes before quitting?",
    {
      title: "Quit before saving?",
      kind: "warning",
      okLabel: "Go Back",
      cancelLabel: "Quit Without Saving",
    }
  );
  if (confirm === false) {
    if (typeof closeFn !== "undefined") {
      closeFn();
    } else {
      handleClose();
    }
  }
}

// Used for Cmd-Q: exits the entire process rather than just destroying this
// window (which would leave the launcher alive and require a second Cmd-Q).
export async function handleQuit() {
  const store = getViewStore();
  if (store.saved !== true) {
    const confirm = await ask(
      "Do you want to save your changes before quitting?",
      {
        title: "Quit before saving?",
        kind: "warning",
        okLabel: "Go Back",
        cancelLabel: "Quit Without Saving",
      }
    );
    if (confirm !== false) return;
  }
  await exit(0);
}
