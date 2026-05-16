import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { exit } from "@tauri-apps/plugin-process";
import { getProjectSettingsWindow } from "../editor/settings/getProjectSettingsWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getStore, getViewStore } from "../data/dataStore";
import { saveProject } from "./saveProject";
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

async function promptUnsavedChanges(
  verb: string
): Promise<"save" | "dont_save" | "cancel"> {
  const projectName = getStore().project.name;
  return invoke<"save" | "dont_save" | "cancel">(
    "show_unsaved_changes_dialog",
    {
      title: `Do you want to save changes to "${projectName}" before ${verb}?`,
      body: "Your changes will be lost if you don't save them.",
    }
  );
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
  const result = await promptUnsavedChanges("closing");
  if (result === "save") {
    await saveProject();
    if (typeof closeFn !== "undefined") {
      closeFn();
    } else {
      handleClose();
    }
  } else if (result === "dont_save") {
    if (typeof closeFn !== "undefined") {
      closeFn();
    } else {
      handleClose();
    }
  }
  // "cancel" → do nothing
}

// Used for Cmd-Q: exits the entire process rather than just destroying this
// window (which would leave the launcher alive and require a second Cmd-Q).
export async function handleQuit() {
  const store = getViewStore();
  if (store.saved !== true) {
    const result = await promptUnsavedChanges("quitting");
    if (result === "save") {
      await saveProject();
    } else if (result !== "dont_save") {
      return; // "cancel" → do nothing
    }
  }
  await exit(0);
}
