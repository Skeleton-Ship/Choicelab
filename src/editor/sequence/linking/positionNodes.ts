import { getSequence, getNode, getSequenceStart } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import { AnyNode, Store, Sequence } from "../../../typings";

/**
 * Given a node and its position, determine if it conflicts with another node's position.
 * If it does, run again by incrementing the x position by 1.
 *
 * @param {int} x - The x coordinate to check.
 * @param {int} y - The y coordinate to check.
 * @param {string} nodeId - The ID of the node, used to make sure we're not checking for conflicts against itself.
 * @param {string} sequenceId - The ID of the sequence, used to make sure we're only checking for conflicts in the current sequence.
 * @param {any} store - The project data to use.
 */
function getNodeCoordinates(
  x: number,
  y: number,
  nodeId: string,
  sequenceId: string,
  store: Store
): { x: number; y: number } {
  let nodeAlreadyAtPosition = false;
  const sequence: Sequence | undefined = getSequence(sequenceId, store);
  if (typeof sequence === "undefined") {
    console.error("No sequence found:", sequenceId);
    return {
      x: x,
      y: y,
    };
  }
  sequence.nodes.forEach((node: AnyNode) => {
    if (node.position && node.position.y === y && node.id !== nodeId) {
      if (
        node.position.x === x ||
        node.position.x + node.position.xSize - 1 >= x
      ) {
        nodeAlreadyAtPosition = true;
      }
    }
  });
  if (nodeAlreadyAtPosition !== false) {
    return getNodeCoordinates(x + 1, y + 1, nodeId, sequenceId, store);
  } else {
    return {
      x: x,
      y: y,
    };
  }
}

/**
 * Looks at a node and positions it on an x/y axis. If the node is linked to a cell or branch, it runs the positioner again on that node.
 *
 */
function positionNode(
  x: number,
  y: number,
  nodeId: string,
  sequenceId: string,
  store: Store
) {
  const node: AnyNode | undefined = getNode(nodeId, store);
  if (typeof node === "undefined") {
    console.error("Node not found:", nodeId);
    return store;
  }
  // First, see if the current node isn't positioned
  let nodeCoordinates: { x: number; y: number } | undefined = { x: -1, y: -1 };
  if (typeof node.position === "undefined") {
    node.position = {
      x: -1,
      y: -1,
      xSize: -1,
      ySize: -1,
      width: -1,
      height: -1,
      left: -1,
      top: -1,
    };
    nodeCoordinates = getNodeCoordinates(x, y, node.id, sequenceId, store);
    const viewSettings = store.viewSettings;
    // Set size of node
    if (node.type === "cell" || node.type === "start") {
      node.position.width = viewSettings.cellWidth;
      node.position.height = viewSettings.cellHeight;
    }
    node.position.xSize = 1;
    node.position.ySize = 1;
    if (node.type === "branch" && node.stems) {
      node.position.xSize = node.stems.length;
    }
    // Set left and top position
    node.position.x = nodeCoordinates.x;
    node.position.y = nodeCoordinates.y;
    node.position.left = viewSettings.cellMarginLeft * nodeCoordinates.x;
    node.position.top = viewSettings.cellMarginTop * nodeCoordinates.y;
    if (node.type === "start") {
      node.position.top += 50;
      node.position.height = 70;
    }
  }
  //
  // Next, find the next node and run positionNode on that
  //
  if (node.type === "cell" || node.type === "start") {
    if (node.link && node.link.to !== "") {
      const linkedNode: AnyNode | undefined = getNode(node.link.to, store);
      if (linkedNode && nodeCoordinates && !linkedNode.position) {
        return positionNode(
          nodeCoordinates.x,
          nodeCoordinates.y + 1,
          node.link.to,
          sequenceId,
          store
        );
      }
    }
    // For branches, take each stem and run positionNode on it
  } else if (node.type === "branch") {
    nodeCoordinates = getNodeCoordinates(x, y + 1, node.id, sequenceId, store);
    if (typeof node.stems === "undefined") {
      console.error("Branch does not contain stems.");
      return store;
    }
    for (var i = 0; i < node.stems.length; i++) {
      var stem = node.stems[i];
      // Get linked node
      if (stem.link.to === "") continue;
      const linkedNode: AnyNode | undefined = getNode(stem.link.to, store);
      if (linkedNode && !linkedNode.position) {
        positionNode(
          nodeCoordinates.x + i,
          nodeCoordinates.y,
          stem.link.to,
          sequenceId,
          store
        );
      }
    }
  }
  return store;
}

/**
 * Takes nodes in a sequence and arranges them.
 *]
 * @param {string} sequenceId - The ID of the sequence containing nodes to arrange.
 */
export default function positionNodes(sequenceId: string) {
  let store = getStore();
  const sequence: Sequence | undefined = getSequence(sequenceId, store);
  if (!sequence) {
    console.error("No sequence found; returning store as-is.");
    return store;
  }
  // First, find the start node, so we have a definitive point to begin positioning from
  let startingNode = getSequenceStart(sequenceId, store);
  if (!startingNode) {
    console.error(
      "No starting node found in this sequence. Returning store as-is.",
      sequenceId
    );
    return store;
  }
  store = positionNode(0, 0, startingNode.id, sequenceId, store);
  const viewSettings = store.viewSettings;
  // Finally, position abandoned nodes up top along the X axis
  let abandonIndex = 0;
  sequence.nodes.forEach((node: AnyNode) => {
    if (!node.position) {
      abandonIndex++;
      node.position = {
        y: 0,
        x: abandonIndex,
        left: abandonIndex * (viewSettings.cellWidth + 20) + 35,
        top: 50,
        xSize: -1,
        ySize: 1,
        width: viewSettings.cellWidth,
        height: viewSettings.cellHeight,
        abandoned: true,
      };
      // Get x-size of branch stems
      let xSize = 1;
      if (node.type === "branch" && node.stems) {
        xSize = node.stems.length;
      }
      node.position.xSize = xSize;
    }
  });
  return store;
}
