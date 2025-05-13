import { AnyNode, Stem } from "../../../typings";

function isLinkInSelection(nodeId: string, selectedNodes: Array<AnyNode>) {
  let nodeInSelection = -1;
  for (var i = 0; i < selectedNodes.length; i++) {
    var node = selectedNodes[i];
    if (nodeId === node.id) {
      nodeInSelection = i;
    }
  }
  return nodeInSelection;
}

function moveItemAfterIndex<T>(array: T[], index: number): T[] {
  if (index < 0 || index >= array.length - 1) {
    // Invalid index or index is already the last position
    return array;
  }
  const item = array[index];
  const newArray = array.filter((_, i) => i !== index);
  newArray.splice(index + 1, 0, item);
  return newArray;
}

/**
 * Given an array of selected nodes, figures out if any of the selected nodes are linked together, and sorts them according to their linked order. A correctly ordered selection is important for resolving connections.
 *
 * @param {Array} selectedNodes - The selected nodes (usually passed from getStore).
 */
export default function sortSelectedNodes(
  selectedNodes: Array<AnyNode>
): Array<AnyNode> {
  let nodeInSelection = -1;
  let newSelection = selectedNodes;
  for (var i = 0; i < selectedNodes.length; i++) {
    var node = selectedNodes[i];
    if (node.type === "cell" || node.type === "start") {
      if (node.link) {
        nodeInSelection = isLinkInSelection(node.link.to, selectedNodes);
        if (nodeInSelection > -1) {
          newSelection = moveItemAfterIndex(selectedNodes, nodeInSelection);
        }
      }
    }
    if (node.type === "branch" && node.stems) {
      node.stems.forEach((stem: Stem) => {
        nodeInSelection = isLinkInSelection(stem.link.to, selectedNodes);
        if (nodeInSelection > -1) {
          newSelection = moveItemAfterIndex(selectedNodes, nodeInSelection);
        }
      });
    }
  }
  if (nodeInSelection > -1 && selectedNodes !== newSelection) {
    return sortSelectedNodes(newSelection);
  } else {
    return newSelection;
  }
}
