import { save } from "@tauri-apps/plugin-dialog";
import { sep, resolve } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getStore, getViewStore, setViewStore } from "../data/dataStore";
import { stringify } from "../utils/stringify";
import { closeProjectDependentWindows } from "./closeProjectDependentWindows";
import loadProject from "./loadProject";

const appWindow = getCurrentWebviewWindow();

export async function saveAsProject() {
  const store = getStore(),
    viewStore = getViewStore();

  const newProjectPath = await save({
    defaultPath: await resolve(store.projectPath, "..", store.project.name),
    filters: [{ name: "Choicelab Project", extensions: [""] }],
  });
  if (newProjectPath === null) return;

  const pathComponents = newProjectPath.split(sep());
  const newProjectName = pathComponents[pathComponents.length - 1];
  const parentPath = pathComponents.slice(0, -1).join(sep());
  if (!newProjectName || !parentPath) return;

  const appVersion = await getVersion();
  store.project.app.version = appVersion;

  // Mark saved so handleCloseRequest skips the unsaved-changes dialog
  viewStore.saved = true;
  setViewStore(viewStore);

  // Close any dependent windows (e.g. Project Settings) before this one closes
  await closeProjectDependentWindows(appWindow.label);

  const newFileName = `${newProjectName}.clx`;
  const newFilePath = await resolve(newProjectPath, newFileName);

  // Register listener before emitting to avoid a race with a fast Rust response
  once("save-as-complete", async () => {
    once("save-as-copy-complete", async () => {
      await loadProject(newFilePath);
      appWindow.close();
    });
    emit("copy-directory-contents", {
      src: store.projectPath,
      dst: newProjectPath,
      callback: "save-as-copy-complete",
      label: appWindow.label,
    });
  });

  emit("save-text-file", {
    name: newFileName,
    contents: stringify(store.project),
    path: await resolve(newProjectPath),
    callback: "save-as-complete",
    label: appWindow.label,
  });
}
