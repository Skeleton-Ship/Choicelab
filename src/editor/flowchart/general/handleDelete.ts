import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../../../data/dataStore";
import {
  deleteNodeFromData,
  deleteStemFromData,
  deleteSequenceFromData,
} from "../../../data/deleteData";
import resolveConnections from "../linking/resolveConnections";
import sortSelectedNodes from "../selecting/sortSelectedNodes";
import { getActiveBranchStem } from "../../../data/getData";
import { AnyNode, Stem } from "../../../typings";

/**
 * Handler for deleting the selected nodes in a sequence.
 *
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteNodes(update: Function) {
  let store = getStore(),
    viewStore = getViewStore();
  const selectedNodesUnsorted = viewStore.selectedNodes;
  // First, arrange order of selected nodes, in case there is one
  const selectedNodes = sortSelectedNodes(selectedNodesUnsorted);
  // If all that's selected is start, then exit
  if (selectedNodes.length === 1 && selectedNodes[0].type === "start") {
    return;
  }
  // Remove node from data, resolve connections
  selectedNodes.forEach((node: AnyNode) => {
    if (node.type === "cell" && node.link) {
      store = deleteNodeFromData(node.id, store);
      store = resolveConnections(store, node.link.to);
    } else if (node.type === "branch") {
      // First, grab the active stem link; then delete and resolve
      const activeStem: Stem | undefined = getActiveBranchStem(node.id, store);
      if (activeStem) {
        const activeStemLink = activeStem.link.to;
        store = deleteNodeFromData(node.id, store);
        store = resolveConnections(store, activeStemLink);
      }
    }
  });
  // Run resolveConnections one more time without any attempt to re-connect
  store = resolveConnections(store, "");
  // Remove nodes from selection array
  viewStore.selectedNodes = [];
  setStore(store);
  setViewStore(viewStore);
  update();
}

/**
 * Handler for deleting a branch stem in a sequence.
 *
 * @param {string} stemId - The id of the branch stem.
 * @param {string} nodeId - The id of the node.
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteStem(stemId: string, nodeId: string, update: Function) {
  const store = getStore();
  const updatedData = deleteStemFromData(stemId, nodeId, store);
  if (updatedData) {
    setStore(updatedData);
    update();
  }
}

/**
 * Handler for deleting a sequence.
 *
 * @param {string} sequenceId - The id of the sequence.
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteSequence(sequenceId: string, update: Function) {
  const store = getStore();
  const updatedData = deleteSequenceFromData(sequenceId, store);
  if (updatedData) {
    setStore(updatedData);
    update();
  }
}

export { handleDeleteNodes, handleDeleteStem, handleDeleteSequence };
