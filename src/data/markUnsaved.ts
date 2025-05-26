// import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getStore, setStore } from "./dataStore";
import { emit } from "@tauri-apps/api/event";
// const appWindow = getCurrentWebviewWindow();

export default function markUnsaved() {
  const newStore = getStore();
  newStore.saved = false;
  setStore(newStore);
  emit("set-document-edited", { state: true });
  // appWindow.setTitle(`${newStore.project.name} (edited)`);
}
