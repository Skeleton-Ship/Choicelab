// import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getViewStore, setViewStore } from "./dataStore";
import { emit } from "@tauri-apps/api/event";
// const appWindow = getCurrentWebviewWindow();

export default function markUnsaved() {
  const newStore = getViewStore();
  newStore.saved = false;
  setViewStore(newStore);
  emit("set-document-edited", { state: true });
  // appWindow.setTitle(`${newStore.project.name} (edited)`);
}
