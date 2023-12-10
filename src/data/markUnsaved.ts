import { appWindow } from "@tauri-apps/api/window";
import { getStore, setStore } from "./dataStore";

export default function markUnsaved() {
  const newStore = getStore();
  newStore.saved = false;
  setStore(newStore);
  appWindow.setTitle(`${newStore.project.name} (edited)`);
}
