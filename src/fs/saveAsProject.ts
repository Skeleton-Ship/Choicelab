import { save } from "@tauri-apps/plugin-dialog";
import { sep, resolve } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getStore, getViewStore, setViewStore } from "../data/dataStore";
import { stringify } from "../utils/stringify";
import { closeProjectDependentWindows } from "./closeProjectDependentWindows";
import loadProject from "./loadProject";
import { showSaveErrorDialog } from "./saveErrorDialog";

const appWindow = getCurrentWebviewWindow();

/**
 * Ask where to save a copy of the project, save it there, then open the copy
 * in place of this window. Resolves to true once it's saved, or false if it
 * wasn't (the author canceled).
 */
export async function saveAsProject(): Promise<boolean> {
  const store = getStore();
  const newProjectPath = await save({
    defaultPath: await resolve(store.projectPath, "..", store.project.name),
    filters: [{ name: "Choicelab Project", extensions: [""] }],
  });
  if (newProjectPath === null) return false;
  return saveProjectTo(newProjectPath);
}

async function saveProjectTo(newProjectPath: string): Promise<boolean> {
  const store = getStore();
  const pathComponents = newProjectPath.split(sep());
  const newProjectName = pathComponents[pathComponents.length - 1];
  const parentPath = pathComponents.slice(0, -1).join(sep());
  if (!newProjectName || !parentPath) return false;

  const newFileName = `${newProjectName}.clx`;
  const project = {
    ...store.project,
    app: { ...store.project.app, version: await getVersion() },
  };

  // Write everything before touching this window, so nothing is lost if
  // saving fails
  try {
    await invoke("save_project_file", {
      directory: newProjectPath,
      fileName: newFileName,
      contents: stringify(project),
    });
    await invoke("copy_project_folder", {
      source: store.projectPath,
      destination: newProjectPath,
    });
  } catch (error) {
    const choice = await showSaveErrorDialog(error, newProjectName);
    if (choice === "retry") return saveProjectTo(newProjectPath);
    if (choice === "save-as") return saveAsProject();
    return false;
  }

  // Mark saved so handleCloseRequest skips the unsaved-changes dialog
  const viewStore = getViewStore();
  viewStore.saved = true;
  setViewStore(viewStore);

  // Close any dependent windows (e.g. Project Settings) before this one closes
  await closeProjectDependentWindows(appWindow.label);
  await loadProject(await resolve(newProjectPath, newFileName));
  appWindow.close();
  return true;
}
