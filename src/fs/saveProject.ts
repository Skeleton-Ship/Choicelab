import { emit } from "@tauri-apps/api/event";
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
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { resolve } from "@tauri-apps/api/path";

export async function saveProject() {
  const focused = await appWindow.isFocused();
  if (focused === false) return;
  const store = getStore(),
    viewStore = getViewStore();
  // Update app version
  const appVersion = await getVersion();
  const update = window.__CHOICELAB_FUNCTIONS__.updateProject;
  store.project.appVersion = appVersion;
  // Pass to back-end
  emit("save-text-file", {
    name: "project.json",
    contents: stringify(store.project),
    path: await resolve(store.projectPath),
    label: getProjectWindowLabel(store.projectPath),
  });
  viewStore.saved = true;
  appWindow.setTitle(store.project.name);
  setStore(store);
  setViewStore(viewStore);
  emit("set-document-edited", { state: false });
  update(false);
}
