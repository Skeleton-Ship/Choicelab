import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
const appWindow = getCurrentWebviewWindow();
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../data/dataStore";
import { stringify } from "../utils/stringify";
import { resolve } from "@tauri-apps/api/path";
import { showSaveErrorDialog } from "./saveErrorDialog";
import { saveAsProject } from "./saveAsProject";

/** The history version currently shown, to tell if anything changed. */
function currentHistoryVersion(): string | undefined {
  const history = getStore().history;
  return history.versions[history.location];
}

/**
 * Save the project to its file. Resolves to true once it's saved, or false if
 * it wasn't (the author canceled after an error), so callers like "save
 * before closing" know not to continue.
 */
export async function saveProject(): Promise<boolean> {
  const store = getStore();
  const appVersion = await getVersion();
  const savedVersion = currentHistoryVersion();
  const project = { ...store.project, app: { ...store.project.app, version: appVersion } };
  try {
    await invoke("save_project_file", {
      directory: await resolve(store.projectPath),
      fileName: `${store.project.name}.clx`,
      contents: stringify(project),
    });
  } catch (error) {
    const choice = await showSaveErrorDialog(error, store.project.name);
    if (choice === "retry") return saveProject();
    if (choice === "save-as") return saveAsProject();
    return false;
  }
  // Re-read the store, since the author may have kept editing during the write
  const latestStore = getStore();
  latestStore.project.app.version = appVersion;
  setStore(latestStore);
  // Only mark as saved if what was written is still what's shown
  if (currentHistoryVersion() === savedVersion) {
    const viewStore = getViewStore();
    viewStore.saved = true;
    setViewStore(viewStore);
    emit("set-document-edited", { state: false, windowLabel: appWindow.label });
  }
  appWindow.setTitle(latestStore.project.name);
  window.__CHOICELAB_FUNCTIONS__.updateProject(false);
  return true;
}
