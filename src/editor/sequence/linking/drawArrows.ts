import { getStore } from "../../../data/dataStore";
import getArrow from "./getArrow";

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
        // @ts-ignore
        arrowEl.parentNode.removeChild(arrowEl);
      }
    }
  });
}

function createOrModifyArrows(nodesEl: HTMLElement, svgEl: HTMLElement) {
  const arrowEls = <any>[];
  // Nodes
  const links = nodesEl.querySelectorAll("#sequence .nodes *[data-link-to]");
  links.forEach((linkOrigin: any) => {
    const destinationId = linkOrigin.getAttribute("data-link-to");
    const linkDestination: HTMLElement | null = nodesEl.querySelector(
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
  branches.forEach((branch: any) => {
    const stems = branch.querySelectorAll(".stems .stem");
    stems.forEach((stem: HTMLElement) => {
      const arrow = getArrow(branch, stem, false, "stem-line");
      if (arrow) {
        arrowEls.push(arrow);
      }
    });
  });

  // Append all arrows
  arrowEls.forEach((arrowEl: any) => {
    arrowEl.classList.add("animate");
    svgEl.appendChild(arrowEl);
    setTimeout(() => {
      arrowEl.classList.remove("animate");
    }, 1000);
  });
}

export default function drawArrows(nodesEl: HTMLElement, svgEl: HTMLElement) {
  // Clear out old arrows
  clearAbandonedArrows();
  // Add or modify existing arrows, on a delay to allow visual transitions to finish
  setTimeout(() => {
    createOrModifyArrows(nodesEl, svgEl);
  }, 400);
  // Highlight arrows for selected elements
  const arrows = document.querySelectorAll(`#arrows g`);
  const selectedNodes = getStore("selectedNodes");
  arrows.forEach((arrow) => {
    arrow.classList.remove("highlight");
    const dataFrom = arrow.getAttribute("data-from");
    const dataTo = arrow.getAttribute("data-to");
    const nodeIds = selectedNodes.map((node: any) => {
      return node.id;
    });
    if (nodeIds.includes(dataFrom) || nodeIds.includes(dataTo)) {
      arrow.classList.add("highlight");
    }
  });
}
