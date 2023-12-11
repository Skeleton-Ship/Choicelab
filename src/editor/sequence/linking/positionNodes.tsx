import { getSequence, getNode } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import { AnyNode, Store, Sequence } from "../../../typings";

const CELL_WIDTH = 225;
const CELL_HEIGHT = 100;
const CELL_MARGIN_LEFT = CELL_WIDTH + 50;
const CELL_MARGIN_TOP = CELL_HEIGHT + 175;

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
    if (typeof node.position === "undefined") {
      console.error("Node position not defined.");
      return {
        x: x,
        y: y,
      };
    }
    if (node.position.y === y && node.id !== nodeId) {
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
  let nodeCoordinates = {
    x: -1,
    y: -1,
  };
  // First, see if the current node isn't positioned
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
  }
  console.log("Beginning to check node:", node);
  if (node.position.x === -1 || node.position.y === -1) {
    console.log("Positioning this node:", node);
    nodeCoordinates = getNodeCoordinates(x, y, node.id, sequenceId, store);
    // Set size of node
    if (node.type === "cell") {
      node.position.width = CELL_WIDTH;
      node.position.height = CELL_HEIGHT;
    }
    node.position.xSize = 1;
    node.position.ySize = 1;
    if (node.type === "branch" && node.stems) {
      node.position.xSize = node.stems.length;
    }
    // Set left and top position
    node.position.x = nodeCoordinates.x;
    node.position.y = nodeCoordinates.y;
    node.position.left = CELL_MARGIN_LEFT * nodeCoordinates.x;
    node.position.top = CELL_MARGIN_TOP * nodeCoordinates.y;
  }
  //
  // Next, find the next node and run positionNode on that
  //
  if (node.type === "cell" || node.type === "start") {
    if (node.link && node.link.to !== "") {
      const linkedNode: AnyNode | undefined = getNode(node.link.to, store);
      if (linkedNode && linkedNode.position) {
        if (
          (linkedNode && linkedNode.position.x === null) ||
          linkedNode.position.y === null
        ) {
          return positionNode(
            nodeCoordinates.x,
            nodeCoordinates.y + 1,
            node.link.to,
            sequenceId,
            store
          );
        }
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
      /*
	  // Set left position
      const position = {
        relativeX: i,
        left: i * CELL_WIDTH,
      };
	  */
      // Get linked node
      if (stem.link.to === "") continue;
      const linkedNode: AnyNode | undefined = getNode(stem.link.to, store);
      if (linkedNode && linkedNode.position) {
        if (linkedNode.position.x === null || linkedNode.position.y === null) {
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
  let startingNode: AnyNode | undefined;
  sequence.nodes.forEach((node: AnyNode) => {
    // Set initial position
    node.position = {
      x: -1,
      y: -1,
      xSize: -1,
      ySize: -1,
      width: -1,
      height: -1,
      top: -1,
      left: -1,
    };
    if (node.type === "start") {
      startingNode = node;
    }
  });
  // Position the start node and traverse down
  if (typeof startingNode === "undefined") {
    console.error("No starting node found.");
    return store;
  }
  store = positionNode(0, 0, startingNode.id, sequenceId, store);
  // Finally, position abandoned nodes up top along the X axis
  let abandonIndex = 0;
  sequence.nodes.forEach((node: AnyNode) => {
    if (node.position) {
      if (node.position.x === -1 || node.position.y === -1) {
        abandonIndex++;
        node.position.y = 0;
        node.position.x = abandonIndex;
        node.position.left = abandonIndex * CELL_WIDTH;
        node.position.top = 0;
        node.position.width = CELL_WIDTH;
        node.position.height = CELL_HEIGHT;
        node.position.abandoned = true;
      }
    }
  });
  return store;
}
