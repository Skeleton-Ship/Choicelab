import { getStore, setStore } from "../../../data/dataStore";
import {
  deleteNodeFromData,
  deleteStemFromData,
  deleteSequenceFromData,
} from "../../../data/deleteData";
import resolveConnections from "../linking/resolveConnections";
import sortSelectedNodes from "../selecting/sortSelectedNodes";
import { getActiveBranchStem } from "../../../data/getData";

/**
 * Handler for deleting the selected nodes in a sequence.
 *
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteNodes(setProjectData: Function) {
  let store = getStore();
  const selectedNodesUnsorted = store.selectedNodes;
  // First, arrange order of selected nodes, in case there is one
  const selectedNodes = sortSelectedNodes(selectedNodesUnsorted);
  // Remove node from data, resolve connections
  selectedNodes.forEach((node: any) => {
    if (node.type === "cell") {
      store = deleteNodeFromData(node.id, store);
      store = resolveConnections(store, node.link.to);
    } else if (node.type === "branch") {
      // First, grab the active stem link; then delete and resolve
      const activeStem: any = getActiveBranchStem(node.id, store);
      const activeStemLink = activeStem.link.to;
      store = deleteNodeFromData(node.id, store);
      store = resolveConnections(store, activeStemLink);
    }
  });
  // Run resolveConnections one more time without any attempt to re-connect
  store = resolveConnections(store, "");
  // Remove nodes from selection array
  store.selectedNodes = [];
  setStore(store);
  setProjectData();
}

/**
 * Handler for deleting a branch stem in a sequence.
 *
 * @param {string} stemId - The id of the branch stem.
 * @param {string} nodeId - The id of the node.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteStem(
  stemId: string,
  nodeId: string,
  setProjectData: Function
) {
  const store = getStore();
  const updatedData = deleteStemFromData(stemId, nodeId, store);
  setProjectData(updatedData);
  setStore(store);
}

/**
 * Handler for deleting a sequence.
 *
 * @param {string} sequenceId - The id of the sequence.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteSequence(sequenceId: string, setProjectData: Function) {
  const store = getStore();
  const updatedData = deleteSequenceFromData(sequenceId, store);
  setProjectData(updatedData);
}

export { handleDeleteNodes, handleDeleteStem, handleDeleteSequence };
