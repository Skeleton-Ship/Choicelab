import getElementOffset from "../general/getElementOffset";

/**
 * Get the path of an SVG line, based on the X and Y position of an origin node/stem (fromElement) and its destination node/stem (toElement).
 *
 * @param {HTMLElement} fromElement - The originating node or stem.
 * @param {HTMLElement} toElement - The destination node or stem.
 */
function getPathDimensions(fromElement: Element, toElement: Element): string {
  // fromElement position
  const fromOffset = getElementOffset(fromElement);
  const fromLeft = fromOffset.left;
  const fromTop = fromOffset.top;
  const fromWidth = fromOffset.width;
  const fromHeight = fromOffset.height;
  // toElement position
  const toOffset = getElementOffset(toElement);
  const toLeft = toOffset.left;
  const toTop = toOffset.top;
  const toWidth = toOffset.width;
  const toHeight = toOffset.height;
  // Calculate the coordinates of the arrow's start and end points
  let fromX = fromLeft + fromWidth / 2;
  let fromY = fromTop + fromHeight;
  let toX = toLeft + toWidth / 2;
  let toY = toTop;
  // Adjust the arrow origin if connecting to 1) a node at the same height, or 2) a higher node
  if (fromTop === toTop) {
    fromY = fromTop + fromHeight;
    fromX = fromX - 5;
    toY = toTop + toHeight;
    // Add a subtle curve using a Bezier curve (C command)
    const curveControlX = (fromX + toX) / 2;
    const curveControlY = fromY + 40; // Adjust the curve height as needed
    return `M ${fromX} ${fromY} C ${curveControlX} ${curveControlY} ${curveControlX} ${curveControlY} ${toX} ${toY}`;
  } else if (fromTop > toTop) {
    fromY = fromTop;
    fromX = fromX - 5;
    toY = toTop + toHeight;
    // Add a subtle curve to the left or right based on the relative horizontal position
    const curveControlX = (fromX + toX) / 2;
    const curveControlY = fromY + 40; // Adjust the curve height as needed
    // Check if 'fromElement' is to the left or right of 'toElement'
    if (fromLeft <= toLeft) {
      // 'fromElement' is to the left, so curve to the left
      return `M ${fromX} ${fromY} Q ${curveControlX} ${curveControlY} ${toX} ${toY}`;
    } else {
      // 'fromElement' is to the right, so curve to the right
      return `M ${fromX} ${fromY} Q ${toX} ${curveControlY} ${toX} ${toY}`;
    }
  }

  const pathDimensions = `M ${fromX} ${fromY} L ${toX} ${toY}`;
  return pathDimensions;
}

/**
 * Create an arrowhead for a path line.
 */
function getArrowhead(): SVGMarkerElement {
  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");
  const arrowheadPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  arrowheadPath.setAttribute("d", "M0,0 L0,6 L9,3 z");
  marker.appendChild(arrowheadPath);
  return marker;
}

/**
 * Create (or retrieve an existing) arrow between an origin node/stem (fromElement) and its destination node/stem (toElement). Used to connect a linked element (like a cell or stem) to another node, as well as to connect a branch to its stems.
 *
 * @param {HTMLElement} fromElement - The originating node or stem.
 * @param {HTMLElement} toElement - The destination node or stem.
 * @param {boolean} arrowhead - Whether to add an arrowhead to the end of the line. (Branches connecting to stems, for example, don't include an arrowhead.)
 * @param {string} arrowType - The name of a class that should be attached to the resulting arrow element.
 */
export default function getArrow(
  fromElement: Element,
  toElement: Element,
  arrowhead: boolean = true,
  arrowType: string = ""
) {
  const pathDimensions = getPathDimensions(fromElement, toElement);
  const fromId = fromElement.getAttribute("data-id");
  const toId = toElement.getAttribute("data-id");
  let group: Element | null = null,
    line;
  if (fromId && toId) {
    group = document.querySelector(
      `#arrows g[data-from="${fromId}"][data-to="${toId}"]`
    );
  }
  if (group !== null) {
    line = group.querySelector(".line");
    if (line) {
      // line.setAttribute("d", pathDimensions);
      const existingDimensions = line.getAttribute("d");
      if (
        existingDimensions !== null &&
        existingDimensions.trim() !== pathDimensions.trim()
      ) {
        group.classList.add("animate-change");
        line.setAttribute("d", pathDimensions);
        setTimeout(() => {
          if (group !== null) {
            group.classList.remove("animate-change");
          }
        }, 1000);
      }
    }
  } else {
    // Create an SVG element
    group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Create the arrow path
    line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.classList.add("line");

    // Create the arrowhead marker
    if (arrowhead === true) {
      const marker = getArrowhead();
      line.setAttribute("marker-end", "url(#arrowhead)");
      group.appendChild(marker);
    }

    group.classList.add(arrowType);
    group.appendChild(line);
    // Save the to ID, because we'll need it for later
    let toId = toElement.getAttribute("data-id");
    if (fromId && toId) {
      group.setAttribute("data-from", fromId);
      group.setAttribute("data-to", toId);
    }
    group.setAttribute("line-type", arrowType);
    line.setAttribute("d", pathDimensions);
    return group;
  }
  return false;
}
