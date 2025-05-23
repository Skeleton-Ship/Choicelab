import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getStore, setStore } from "./dataStore";
const appWindow = getCurrentWebviewWindow()

export default function markUnsaved() {
  const newStore = getStore();
  newStore.saved = false;
  setStore(newStore);
  appWindow.setTitle(`${newStore.project.name} (edited)`);
}
