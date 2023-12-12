import { getStore } from "../../../data/dataStore";
import getArrow from "./getArrow";
import { AnyNode } from "../../../typings";

// Remove arrows that don't apply anymore
function clearAbandonedArrows() {
  const arrows = document.querySelectorAll(`#arrows [data-from]`);
  arrows.forEach((arrowEl) => {
    const fromId = arrowEl.getAttribute("data-from");
    const toId = arrowEl.getAttribute("data-to");
    const arrowType = arrowEl.getAttribute("line-type");
    if (fromId) {
      let deleteArrow;
      if (arrowType && arrowType === "link-line") {
        let existingSource = document.querySelector(
          `#sequence [data-id="${fromId}"][data-link-to="${toId}"]`
        );
        if (!existingSource) {
          deleteArrow = true;
        }
      } else if (arrowType && arrowType === "stem-line") {
        const branch = document.querySelector(
          `#sequence .node[data-id="${fromId}"]`
        );
        const stem = document.querySelector(
          `#sequence .stem[data-id="${toId}"]`
        );
        if (!branch || !stem) {
          deleteArrow = true;
        }
      }
      if (deleteArrow === true) {
        if (arrowEl.parentNode) {
          arrowEl.parentNode.removeChild(arrowEl);
        }
      }
    }
  });
}

function createOrModifyArrows(nodesEl: HTMLElement, svgEl: HTMLElement) {
  const arrowEls: Array<Element> = [];
  // Nodes
  const links = nodesEl.querySelectorAll("#sequence .nodes *[data-link-to]");
  links.forEach((linkOrigin) => {
    const destinationId = linkOrigin.getAttribute("data-link-to");
    const linkDestination: Element | null = nodesEl.querySelector(
      `.node[data-id="${destinationId}"]`
    );
    if (linkDestination !== null) {
      const arrow = getArrow(linkOrigin, linkDestination, true, "link-line");
      if (arrow) {
        arrowEls.push(arrow);
      }
    }
  });

  // Branches + stems
  const branches = nodesEl.querySelectorAll("#sequence .branch.node");
  branches.forEach((branch: Element) => {
    const stems = branch.querySelectorAll(".stems .stem");
    stems.forEach((stem: Element) => {
      const arrow = getArrow(branch, stem, false, "stem-line");
      if (arrow) {
        arrowEls.push(arrow);
      }
    });
  });

  // Append all arrows
  arrowEls.forEach((arrowEl: Element) => {
    svgEl.appendChild(arrowEl);
  });
}

export default function drawArrows(nodesEl: HTMLElement, svgEl: HTMLElement) {
  // Clear out old arrows
  // Add or modify existing arrows, on a delay to allow visual transitions to finish
  setTimeout(() => {
    clearAbandonedArrows();
    createOrModifyArrows(nodesEl, svgEl);
  }, 205);
  // Highlight arrows for selected elements
  const arrows = document.querySelectorAll(`#arrows g`);
  const store = getStore();
  const selectedNodes = store.selectedNodes;
  arrows.forEach((arrow) => {
    arrow.classList.remove("highlight");
    const dataFrom = arrow.getAttribute("data-from");
    const dataTo = arrow.getAttribute("data-to");
    if (dataFrom === null || dataTo === null) {
      console.error("From and to properties not found.");
      return;
    }
    const nodeIds = selectedNodes.map((node: AnyNode) => {
      return node.id;
    });
    if (nodeIds.includes(dataFrom) || nodeIds.includes(dataTo)) {
      arrow.classList.add("highlight");
    }
  });
}
