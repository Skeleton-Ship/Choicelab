import { emit } from "@tauri-apps/api/event";
import { getStore, setStore } from "../../../data/dataStore";

export default function showPane(paneName: string, update: Function) {
  const store = getStore();
  store.viewSettings.paneInView = paneName;
  setStore(store);
  update(false);
  // Send updates to menu
  const selectItems =
    paneName === "node-editor" ? ["show_node_editor"] : ["show_variables"];
  const deselectItems =
    paneName === "node-editor" ? ["show_variables"] : ["show_node_editor"];
  emit("select-menu-items", {
    selectItems: selectItems,
    deselectItems: deselectItems,
  });
}
