import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { exit } from "@tauri-apps/plugin-process";
import { getProjectSettingsWindow } from "../editor/settings/getProjectSettingsWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getStore, getViewStore } from "../data/dataStore";
import { saveProject } from "./saveProject";
import { clearProjectCache } from "./projectCache";
import { cancelAutosave } from "./autosave";
const appWindow = getCurrentWebviewWindow();

export async function handleClose() {
  // Clear this project's cache subdirectory only
  // Don't let a scheduled autosave recreate the folder after it's cleared
  cancelAutosave();
  await clearProjectCache(getViewStore().projectPath).catch(() => {});
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

export async function handleCloseRequest(closeFn?: () => void) {
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
    // Stay open if the save didn't happen, so the changes aren't lost
    if (!(await saveProject())) return;
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
      // Don't quit if the save didn't happen, so the changes aren't lost
      if (!(await saveProject())) return;
    } else if (result !== "dont_save") {
      return; // "cancel" → do nothing
    }
  }
  await exit(0);
}
