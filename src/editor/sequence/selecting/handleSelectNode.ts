import { getStore, setStore } from "../../../data/dataStore";
import { AnyNode } from "../../../typings";

/**
 * Handler for selecting a node.
 *
 * @param {object} node - A node object.
 * @param {Function} setter - The React state function to call once selected.
 */
export default function handleSelectNode(node: AnyNode, setter: Function) {
  const store = getStore();
  const targetMode = store.targetMode;
  // Ignore if node is undefined (happens when node is deleted), or if target mode is on
  if (typeof node === "undefined" || targetMode !== "") return;
  let selectedNodes = store.selectedNodes;
  const shiftDown = store.shiftDown;
  let removeFromSelection = -1;
  // If shift key isn't being held, clear the existing selection
  if (shiftDown === false) {
    selectedNodes.length = 0;
  } else {
    // If shift is held and the node is selected again, mark it for de-selection
    for (var i = 0; i < selectedNodes.length; i++) {
      const selectedNode = selectedNodes[i];
      if (node.id === selectedNode.id) {
        removeFromSelection = i;
      }
    }
  }
  if (removeFromSelection > -1) {
    selectedNodes.splice(removeFromSelection, 1);
  } else {
    selectedNodes.push(node);
  }
  // Update data
  setter(selectedNodes);
  setStore(store);
}
