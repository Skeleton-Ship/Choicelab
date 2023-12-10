import { getStore, setStore, getProject } from "../../../data/dataStore";
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
  const projectData = getProject();
  const selectedNodesUnsorted = getStore("selectedNodes");
  // First, arrange order of selected nodes, in case there is one
  const selectedNodes = sortSelectedNodes(selectedNodesUnsorted);
  // Remove node from data, resolve connections
  let updatedData = projectData;
  selectedNodes.forEach((node: any) => {
    if (node.type === "cell") {
      updatedData = deleteNodeFromData(node.id, projectData);
      updatedData = resolveConnections(updatedData, node.link.to);
    } else if (node.type === "branch") {
      // First, grab the active stem link; then delete and resolve
      const activeStem: any = getActiveBranchStem(node.id, updatedData);
      const activeStemLink = activeStem.link.to;
      updatedData = deleteNodeFromData(node.id, projectData);
      updatedData = resolveConnections(updatedData, activeStemLink);
    }
  });
  // Run resolveConnections one more time without any attempt to re-connect
  updatedData = resolveConnections(updatedData, "");
  // Remove nodes from selection array
  setStore({
    selectedNodes: [],
  });
  // Update project data
  setProjectData(updatedData);
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
  const projectData = getProject();
  const updatedData = deleteStemFromData(stemId, nodeId, projectData);
  setProjectData(updatedData);
  setStore({
    selectedStem: false,
  });
}

/**
 * Handler for deleting a sequence.
 *
 * @param {string} sequenceId - The id of the sequence.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleDeleteSequence(sequenceId: string, setProjectData: Function) {
  const projectData = getProject();
  const updatedData = deleteSequenceFromData(sequenceId, projectData);
  setProjectData(updatedData);
}

export { handleDeleteNodes, handleDeleteStem, handleDeleteSequence };
