import { getStore, setStore, getProject } from "../../../data/dataStore";
import getElementOffset from "../general/getElementOffset";
import { getNode } from "../../../data/getData";

// Merge two arrays, removing duplicate items
function mergeArrays(arr1: any[], arr2: any[]): any[] {
  const mergedArray = arr1.concat(arr2);
  const uniqueArray = Array.from(new Set(mergedArray));
  return uniqueArray;
}

// Check whether two elements overlap
function checkOverlap(elementToCheck: any, selectionArea: any): boolean {
  const xOverlap =
    elementToCheck.left < selectionArea.left + selectionArea.width &&
    elementToCheck.left + elementToCheck.width > selectionArea.left;
  const yOverlap =
    elementToCheck.top < selectionArea.top + selectionArea.height &&
    elementToCheck.top + elementToCheck.height > selectionArea.top;
  return xOverlap && yOverlap;
}

function setSelectionArea(
  selectionArea: HTMLElement,
  sequenceEl: HTMLElement,
  setProjectData: Function
): void {
  const selectionProps = getStore("selection");
  var x3 = Math.min(selectionProps.x1, selectionProps.x2); // Smaller X
  var x4 = Math.max(selectionProps.x1, selectionProps.x2); // Larger X
  var y3 = Math.min(selectionProps.y1, selectionProps.y2); // Smaller Y
  var y4 = Math.max(selectionProps.y1, selectionProps.y2); // Larger Y
  selectionArea.style.left = x3 - selectionProps.offsetLeft + "px";
  selectionArea.style.top = y3 - selectionProps.offsetTop + "px";
  selectionArea.style.width = x4 - x3 + "px";
  selectionArea.style.height = y4 - y3 + "px";
  const projectData = getProject();
  const selectedNodes: Array<any> = [];
  // Figure out what elements are in the selection area
  const nodeEls = document.querySelectorAll("#sequence .nodes .node");
  const selectedEls: Array<any> = [];
  nodeEls.forEach((nodeEl: any) => {
    const offset = getElementOffset(nodeEl);
    offset.top = offset.top + sequenceEl.offsetTop;
    const overlap = checkOverlap(offset, {
      width: x4 - x3,
      height: y4 - y3,
      left: x3,
      top: y3,
    });
    if (overlap === true) {
      nodeEl.classList.add("selecting");
      const nodeId = nodeEl.getAttribute("data-id");
      const node = getNode(nodeId, projectData);
      selectedNodes.push(node);
    } else {
      nodeEl.classList.remove("selecting");
    }
  });
  //  Add selected nodes to temp selection array
  setStore({
    selection: {
      nodesInSelection: selectedNodes,
    },
  });
}

export default function enableSelectionArea(setProjectData: Function) {
  const selectionProps = getStore("selection");
  // Don't run if already active
  if (selectionProps.listenersActive === true) return;
  setStore({
    selection: {
      listenersActive: true,
    },
  });
  const selectionArea: any = document.querySelector("#selection-area");
  selectionArea.style.display = "none";
  const sequenceEl: any = document.querySelector("#sequence");

  // Mouse down events
  sequenceEl.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.target !== sequenceEl) return;
    const shiftDown = getStore("shiftDown");
    let selectedNodes: Array<any>;
    if (shiftDown === false) {
      selectedNodes = [];
      setStore({
        selectedNodes: selectedNodes,
        selectedStem: false,
        selection: {
          keepExistingSelection: false,
        },
      });
      setProjectData(false);
    } else {
      selectedNodes = getStore("selectedNodes");
      setStore({
        selection: {
          keepExistingSelection: true,
        },
      });
    }
    selectionArea.style.display = "block";
    setStore({
      selection: {
        x1: e.clientX + sequenceEl.scrollLeft,
        y1: e.clientY + sequenceEl.scrollTop,
        offsetTop: sequenceEl.offsetTop,
        offsetLeft: sequenceEl.offsetLeft,
      },
    });
    setStore({
      selection: {
        selecting: true,
      },
    });
    setSelectionArea(selectionArea, sequenceEl, setProjectData);
  });

  // Mouse move events
  sequenceEl.addEventListener("mousemove", (e: MouseEvent) => {
    const selection = getStore("selection");
    setStore({
      selection: {
        x2: e.clientX + sequenceEl.scrollLeft,
        y2: e.clientY + sequenceEl.scrollTop,
      },
    });
    if (selection.selecting === true) {
      setSelectionArea(selectionArea, sequenceEl, setProjectData);
    }
  });

  // Mouse up events
  sequenceEl.addEventListener("mouseup", (e: MouseEvent) => {
    // Add nodes to selected nodes
    const selection = getStore("selection");
    if (selection.selecting === false) return;
    let existingNodes = [];
    if (selection.keepExistingSelection === true) {
      existingNodes = getStore("selectedNodes");
    }
    setStore({
      selectedNodes: mergeArrays(existingNodes, selection.nodesInSelection),
    });
    setProjectData(false);
    // Reset state
    selectionArea.style.display = "none";
    setStore({
      selection: {
        selecting: false,
        keepExistingSelection: false,
        nodesInSelection: [],
      },
    });
  });
}
