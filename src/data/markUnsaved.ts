import { getViewStore, setViewStore } from "./dataStore";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export default function markUnsaved() {
  const newStore = getViewStore();
  newStore.saved = false;
  setViewStore(newStore);
  const appWindow = getCurrentWebviewWindow();
  emit("set-document-edited", { state: true, windowLabel: appWindow.label });
}
