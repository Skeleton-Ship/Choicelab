import { getStore } from "../../../data/dataStore";
import { AnyNode, Stem, Store } from "../../../typings";
import {
  getSequenceStart,
  getNode,
  getBranchStem,
} from "../../../data/getData";
import handleSelectNode from "../selecting/handleSelectNode";
import getNodeOriginIds from "../linking/getNodeOriginIds";

function getOriginNode(
  node: AnyNode,
  y: number,
  nodesContainer: Element,
  store: Store
) {
  // First, look for any possible stems
  const origins = getNodeOriginIds(node.id);
  let matchingNode: AnyNode | undefined,
    matchingStem: Stem | undefined,
    diff = 99999;
  origins.forEach((origin) => {
    let nodeEl;
    if (origin.type === "stem") {
      nodeEl = nodesContainer.querySelector(`[data-id="${origin.branchId}"]`);
    } else {
      nodeEl = nodesContainer.querySelector(`[data-id="${origin.id}"]`);
    }
    if (!nodeEl) return;
    const branchElYStr = nodeEl.getAttribute("data-position-y") as string;
    const branchElY = parseInt(branchElYStr);
    const thisDiff = Math.abs(branchElY - y);
    if (thisDiff < diff) {
      diff = thisDiff;
      matchingNode = getNode(origin.id, store);
      if (origin.type === "stem" && origin.branchId) {
        matchingNode = getNode(origin.branchId, store);
        matchingStem = getBranchStem(origin.id, origin.branchId, store);
      }
    }
  });
  let origin: { node: AnyNode; stem?: Stem } | undefined;
  if (matchingNode) {
    origin = {
      node: matchingNode,
    };
    if (matchingStem) {
      origin.stem = matchingStem;
    }
  }
  return origin;
}

export default function handleKeyNavigation(keyCode: string, update: Function) {
  const direction = keyCode.replace("Arrow", "").toLowerCase();
  if (
    direction !== "down" &&
    direction !== "up" &&
    direction !== "left" &&
    direction !== "right"
  ) {
    console.warn(
      "Direction not recognized; keyboard navigation of nodes will be disabled."
    );
    return;
  }
  const store = getStore();
  const selectedNodes = store.selectedNodes;
  let currentNode: AnyNode | undefined;
  if (selectedNodes.length > 0) {
    currentNode = selectedNodes[selectedNodes.length - 1];
  } else {
    currentNode = getSequenceStart(store.currentSequenceId, store);
  }
  if (!currentNode) {
    console.error("No starting node found.");
    return;
  }
  const nodesContainer = document.querySelector("#sequence .nodes")!;
  const currentEl = nodesContainer.querySelector(
    `[data-id="${currentNode.id}"]`
  );
  if (!currentEl) {
    console.error("No matching element found for this node:", currentNode);
    return;
  }

  // Get the position of the starting element, so we can calculate what our next one is
  const startingPosXStr = currentEl.getAttribute("data-position-x");
  const startingPosYStr = currentEl.getAttribute("data-position-y");
  if (!startingPosXStr || !startingPosYStr) {
    console.error("Position not found for this element:", currentEl);
    return;
  }
  const startingPosX = parseInt(startingPosXStr);
  const startingPosY = parseInt(startingPosYStr);

  // Figure out what node/stem to select
  if (direction === "up") {
    const origin = getOriginNode(
      currentNode,
      startingPosY,
      nodesContainer,
      store
    );
    if (origin) {
      if (origin.stem) {
        handleSelectNode(origin.node, update, origin.stem);
      } else {
        handleSelectNode(origin.node, update);
      }
    }
  } else if (direction === "down") {
    if (currentNode.type === "branch") {
      if (store.selectedStem !== false) {
        const destination = getNode(store.selectedStem.link.to, store);
        if (destination) {
          handleSelectNode(destination, update);
        }
      }
    } else {
      if (currentNode.link) {
        const destination = getNode(currentNode.link.to, store);
        if (destination) {
          handleSelectNode(destination, update);
        }
      }
    }
  } else if (direction === "left" || direction === "right") {
    const destinationXPos =
      direction === "left" ? startingPosX - 1 : startingPosX + 1;
    // First, we need to figure out if we should move stems (when a branch is selected), or whole nodes (when a cell is selected)
    if (currentNode.type === "branch") {
      const stems = currentNode.stems!;
      const selectedStem = store.selectedStem as Stem;
      for (var i = 0; i < stems.length; i++) {
        var stem = stems[i];
        var destinationStem;
        if (stem.id === selectedStem.id) {
          if (direction === "left") {
            destinationStem = stems[i - 1];
          } else if (direction === "right") {
            destinationStem = stems[i + 1];
          }
        }
        if (destinationStem) {
          handleSelectNode(currentNode, update, destinationStem);
        }
      }
    } else {
      const destinationEl = nodesContainer.querySelector(
        `[data-position-x="${destinationXPos}"][data-position-y="${startingPosY}"]`
      );
      if (!destinationEl) return;
      const destination = getNode(
        destinationEl.getAttribute("data-id")!,
        store
      );
      if (!destination) return;
      handleSelectNode(destination, update);
    }
  }
}
