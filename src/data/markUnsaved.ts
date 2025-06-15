// import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getViewStore, setViewStore } from "./dataStore";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export default async function markUnsaved() {
  const newStore = getViewStore();
  newStore.saved = false;
  setViewStore(newStore);
  const appWindow = getCurrentWebviewWindow();
  const title = (await appWindow.title()) || "";
  emit("set-document-edited", { state: true, windowTitle: title });
}
