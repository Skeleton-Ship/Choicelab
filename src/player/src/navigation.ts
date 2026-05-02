import { Sequence, AnyNode, Cell, Branch } from "./typings-project";
import { getStore } from "./store";
import { log, warn, error } from "./logging";
import { runCell } from "./cell";
import { runBranch } from "./branch";

export function getSequenceStart(sequence: Sequence) {
  let startNode;
  // See if there's a start node we should be at
  const urlParams = new URLSearchParams(window.location.search);
  const startNodeId = urlParams.get("start");
  if (startNodeId) {
    startNode = getNode(startNodeId);
    if (startNode && startNode.type === "cell") {
      return startNode;
    } else {
      warn(
        `The node ${startNodeId} could not be used as a start point. It may be a branch, or its ID may not be correct.`
      );
    }
  }
  sequence.nodes.forEach((node) => {
    if (node.type === "start") {
      startNode = node;
    }
  });
  return startNode;
}

export function getNode(nodeId: string): AnyNode | false {
  const store = getStore();
  let foundNode: AnyNode | false = false;
  store.project.sequences.forEach((sequence) => {
    sequence.nodes.forEach((node) => {
      if (node.id === nodeId) {
        foundNode = node;
      }
    });
  });
  return foundNode;
}

export function navigate(item: AnyNode, forceStart?: boolean) {
  let thisNode,
    nextNodeId = "";
  switch (item.type) {
    case "cell":
    case "start":
      if (forceStart === true) {
        runCell(item as Cell);
        return;
      }
      thisNode = item as Cell;
      nextNodeId = thisNode.link.to;
      break;
    case "branch":
      thisNode = item as Branch;
      nextNodeId = runBranch(thisNode);
      break;
  }
  if (nextNodeId === "") {
    log(`End of project path.`);
    return;
  }
  const nextNode = getNode(nextNodeId);
  if (!nextNode) {
    warn(
      `A node with the id ${nextNodeId} wasn't found, so the project ended.`
    );
    return;
  }
  // log(nextNode);
  switch (nextNode.type) {
    case "cell":
      runCell(nextNode as Cell);
      break;
    case "branch":
    case "start":
      navigate(nextNode);
      break;
    default:
      error(`Unknown node type:`, nextNode);
      return;
  }
}
