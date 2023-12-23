import {
  getNode,
  getActiveBranchStem,
  nodeExists,
} from "../../../data/getData";
import { Store } from "../../../typings";

function getHighestNodeInView() {
  const elements = document.querySelectorAll("#sequence .node");

  let highestElement: Element | undefined;
  let highestElementTop: number | undefined;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top;
    if (elementTop < 0) continue;
    if (
      !highestElementTop ||
      (elementTop < highestElementTop &&
        element.getAttribute("data-link-to") !== "")
    ) {
      highestElement = element;
      highestElementTop = elementTop;
    }
  }
  return highestElement;
}

/**
 * Upon creation of a new node, finds the originating node that should connect to the new one.
 */
export default function identifyOriginLink(data: Store) {
  // First, see if we have a node selected
  const selectedNodes = data.selectedNodes;
  let foundOrigin = null;
  let foundOriginType;
  // If multiple nodes are selected, use the last one selected
  if (selectedNodes.length > 0) {
    foundOrigin = selectedNodes[selectedNodes.length - 1];
  } else {
    // If no node is selected, find highest node currently on screen
    const highestNode: Element | undefined = getHighestNodeInView();
    if (highestNode) {
      const highestNodeId: string | null = highestNode.getAttribute("data-id");
      if (highestNodeId === null) {
        console.error("No node ID found.");
        return;
      }
      const nodeInData = getNode(highestNodeId, data);
      if (nodeInData) {
        foundOrigin = nodeInData;
      }
    }
  }
  if (foundOrigin) {
    if (nodeExists(foundOrigin.id, data)) {
      foundOriginType = foundOrigin.type;
      // If we have an origin and it's a branch, find the correct stem
      if (foundOrigin.type === "branch") {
        const activeStem = getActiveBranchStem(foundOrigin.id, data);
        foundOrigin = activeStem;
        foundOriginType = "branchStem";
      }
    }
  }
  if (typeof foundOriginType === "undefined" || foundOrigin === null) {
    return false;
  }
  return {
    type: foundOriginType,
    link: foundOrigin,
  };
}
