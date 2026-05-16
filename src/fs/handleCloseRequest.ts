import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { exit } from "@tauri-apps/plugin-process";
import { getProjectSettingsWindow } from "../editor/settings/getProjectSettingsWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getViewStore } from "../data/dataStore";
import { ask } from "@tauri-apps/plugin-dialog";
const appWindow = getCurrentWebviewWindow();

// Returns the cache directory for the currently-open project.
async function projectCachePath(): Promise<string> {
  const cacheBase = await appCacheDir();
  const projectLabel = getProjectWindowLabel(getViewStore().projectPath);
  return resolve(cacheBase, "Projects", projectLabel);
}

export async function handleClose() {
  // Clear this project's cache subdirectory only
  emit("clear-cache", {
    path: await projectCachePath(),
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
