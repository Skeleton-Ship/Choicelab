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
  } else {
    store.selectedStem = false;
  }
  // Update data
  setStore(store);
  update(false);
}
