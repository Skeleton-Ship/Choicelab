import { getStore, setStore } from "../../../data/dataStore";
import { AnyNode, Branch, Stem } from "../../../typings";
import {
  getSequenceStart,
  getNode,
  getStemParent,
  getBranchStem,
} from "../../../data/getData";

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

  /*
   * First, validate that we have everything we need: the current node, the nodes' container in the DOM, and our starting element corresponding with the current node
   */
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
  const nodesContainer = document.querySelector("#sequence .nodes");
  if (!nodesContainer) {
    console.error("No sequence parent container found.");
    return;
  }
  const startingEl = nodesContainer.querySelector(
    `[data-id="${currentNode.id}"]`
  );
  if (!startingEl) {
    console.error("No matching element found for this node:", currentNode);
    return;
  }
  // Get the position of the starting element, so we can calculate what our next one is
  const startingPosXStr = startingEl.getAttribute("data-position-x");
  const startingPosYStr = startingEl.getAttribute("data-position-y");
  if (!startingPosXStr || !startingPosYStr) {
    console.error("Position not found for this element:", startingEl);
    return;
  }
  const startingPosX = parseInt(startingPosXStr);
  const startingPosY = parseInt(startingPosYStr);

  /*
   * Identify our destination element
   */
  let destinationEl: Element | null = null;

  // If current node is a branch, allow navigation to stems
  if (currentNode.type === "branch") {
    const stemInStore = store.selectedStem;
    if (!stemInStore) return;
    /*
    if (stemInStore === false) {
      // No stem is currently selected
      if (direction === "up") {

      } else if (direction === "down") {
        // Select the first stem
        const noMatchStem = startingEl.querySelector(
          ".stems .stem:first-of-type"
        );
        if (!noMatchStem) {
          console.error("No stem found for this branch:", startingEl);
          return;
        }
        const stemId = noMatchStem.getAttribute("data-id") as string;
        const branchId = noMatchStem.getAttribute("data-branch") as string;
        const stem: Stem | undefined = getBranchStem(stemId, branchId, store);
        if (!stem) {
          console.error(
            "No branch stem object found matching this element:",
            noMatchStem
          );
          return;
        }
        store.selectedStem = stem;
      }
    } else {
		*/
    // stem is currently selected
    const thisStemEl = startingEl.querySelector(
      `.stem[data-id="${stemInStore.id}"]`
    );
    if (!thisStemEl) {
      console.error("No stem el found.");
      return;
    }
    if (direction === "up") {
      destinationEl = nodesContainer.querySelector(
        `[data-position-y="${
          startingPosY - 1
        }"][data-position-x="${startingPosX}"]`
      );
      if (!destinationEl) return;
      const destinationId = destinationEl.getAttribute("data-id") as string;
      const destinationNode: AnyNode | undefined = getNode(
        destinationId,
        store
      );
      if (!destinationNode) {
        console.error(
          "No node object found matching this element:",
          destinationEl
        );
        return;
      }
      store.selectedNodes = [destinationNode];
    } else if (direction === "left" || direction === "right") {
      const nextStemEl =
        direction === "left"
          ? (thisStemEl.previousSibling as Element)
          : (thisStemEl.nextSibling as Element);
      if (!nextStemEl) return;
      const nextStemId = nextStemEl.getAttribute("data-id") as string;
      const branchId = nextStemEl.getAttribute("data-branch") as string;
      const nextStem = getBranchStem(nextStemId, branchId, store);
      if (nextStem) {
        store.selectedStem = nextStem;
      }
    } else if (direction === "down") {
      const linkId = thisStemEl.getAttribute("data-link-to") as string;
      const destinationNode = getNode(linkId, store);
      if (destinationNode) {
        store.selectedStem = false;
        store.selectedNodes = [destinationNode];
      }
    }
    //    }
  } else {
    /*
     * Selected node is a cell or start
     */
    switch (direction) {
      case "left":
        destinationEl = nodesContainer.querySelector(
          `[data-position-x="${
            startingPosX - 1
          }"][data-position-y="${startingPosY}"]`
        );
        break;
      case "right":
        destinationEl = nodesContainer.querySelector(
          `[data-position-x="${
            startingPosX + 1
          }"][data-position-y="${startingPosY}"]`
        );
        break;
      case "up":
        // First, look for any possible stems
        const destinationStems = nodesContainer.querySelectorAll(
          `.stem[data-link-to="${currentNode.id}"]`
        );
        let matchingBranch: Branch | undefined,
          matchingStem: Stem | undefined,
          diff = 99999;
        destinationStems.forEach((destinationStemEl: Element) => {
          // Look for the one with the closest Y value
          const stemId = destinationStemEl.getAttribute("data-id") as string;
          const branch: Branch | undefined = getStemParent(stemId, store);
          if (!branch) return;
          const branchElYStr = nodesContainer
            .querySelector(`[data-id="${branch.id}"]`)
            ?.getAttribute("data-position-y") as string;
          const branchElY = parseInt(branchElYStr);
          const thisDiff = Math.abs(branchElY - startingPosY);
          if (thisDiff < diff) {
            diff = thisDiff;
            const stem: Stem | undefined = getBranchStem(
              stemId,
              branch.id,
              store
            );
            if (stem) {
              matchingBranch = branch;
              matchingStem = stem;
            }
          }
        });
        if (matchingStem && matchingBranch) {
          store.selectedStem = matchingStem;
          store.selectedNodes = [matchingBranch];
        } else {
          // If no matching stem, see if there's a straight link
          destinationEl = nodesContainer.querySelector(
            `[data-position-y="${
              startingPosY - 1
            }"][data-position-x="${startingPosX}"]`
          );
        }
        break;
      case "down":
        destinationEl = nodesContainer.querySelector(
          `[data-id="${startingEl.getAttribute("data-link-to")}"]`
        );
        break;
    }
    if (destinationEl) {
      const destinationId = destinationEl.getAttribute("data-id") as string;
      const destinationNode: AnyNode | undefined = getNode(
        destinationId,
        store
      );
      if (!destinationNode) {
        console.error(
          "No node object found matching this element:",
          destinationEl
        );
        return;
      }
      store.selectedNodes = [destinationNode];
    }
  }

  /*
   * Update store
   */
  setStore(store);
  update(false);
}
