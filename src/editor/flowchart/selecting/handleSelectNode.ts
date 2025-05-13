import { emit } from "@tauri-apps/api/event";
import { getStore, setStore } from "../../../data/dataStore";
import { AnyNode, Cell, Branch, StartNode, Stem } from "../../../typings";

/**
 * Handler for selecting a node.
 *
 * @param {object} node - A node object.
 * @param {Function} update - The React state function to call once selected.
 */
export default function handleSelectNode(
  node: AnyNode | Cell | StartNode | Branch,
  update: Function,
  stem?: Stem
) {
  const store = getStore();
  // Ignore if node is undefined (happens when node is deleted), or if target mode is on
  if (typeof node === "undefined" || store.targetMode.active === true) return;
  let enableMenuProps: {
    enableItems: Array<string>;
    disableItems: Array<string>;
  } = {
    enableItems: [],
    disableItems: [],
  };
  store.selectedNodes = [node];
  // For branches, select a stem
  if (node.type === "branch") {
    if (!stem) {
      // @ts-ignore
      const firstStem = node.stems[0];
      if (!firstStem) return;
      store.selectedStem = firstStem;
    } else {
      store.selectedStem = stem;
    }
    // Enable branch stem menu item
    if (store.selectedStem && store.selectedStem.type !== "noMatch") {
      enableMenuProps.enableItems.push("delete_stem");
    } else {
      enableMenuProps.disableItems.push("delete_stem");
    }
  } else {
    store.selectedStem = false;
    enableMenuProps.disableItems.push("delete_stem");
  }
  // Check if "Delete Node" should be enabled
  if (node.type !== "start") {
    enableMenuProps.enableItems.push("delete_nodes");
  } else {
    enableMenuProps.disableItems.push("delete_nodes");
  }
  enableMenuProps.enableItems.push("set_link", "disconnect_link");
  // Update data
  emit("enable-menu-items", enableMenuProps);
  setStore(store);
  update(false);
}
