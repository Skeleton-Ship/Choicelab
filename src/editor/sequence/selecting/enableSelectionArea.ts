import { getStore, setStore } from "../../../data/dataStore";
import getElementOffset from "../general/getElementOffset";
import { getNode } from "../../../data/getData";
import { AnyNode } from "../../../typings";

// Check whether two elements overlap
function checkOverlap(
  elementToCheck: { left: number; top: number; width: number; height: number },
  selectionArea: { left: number; top: number; width: number; height: number }
): boolean {
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
  sequenceEl: HTMLElement
): void {
  const store = getStore();
  const selectionProps = store.selection;
  var x3 = Math.min(selectionProps.x1, selectionProps.x2); // Smaller X
  var x4 = Math.max(selectionProps.x1, selectionProps.x2); // Larger X
  var y3 = Math.min(selectionProps.y1, selectionProps.y2); // Smaller Y
  var y4 = Math.max(selectionProps.y1, selectionProps.y2); // Larger Y
  selectionArea.style.left = x3 - selectionProps.offsetLeft + "px";
  selectionArea.style.top = y3 - selectionProps.offsetTop + "px";
  selectionArea.style.width = x4 - x3 + "px";
  selectionArea.style.height = y4 - y3 + "px";
  const selectedNodes: Array<AnyNode> = [];
  // Figure out what elements are in the selection area
  const nodeEls = document.querySelectorAll("#sequence .nodes .node");
  nodeEls.forEach((nodeEl: Element) => {
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
      if (nodeId === null) {
        console.error("Node ID not found.");
        return;
      }
      const node = getNode(nodeId, store);
      if (typeof node === "undefined") return;
      selectedNodes.push(node);
    } else {
      nodeEl.classList.remove("selecting");
    }
  });
  //  Add selected nodes to temp selection array
  store.selection.nodesInSelection = selectedNodes;
  setStore(store);
}

export default function enableSelectionArea(update: Function) {
  const store = getStore();
  const selectionProps = store.selection;
  // Don't run if already active
  if (selectionProps.listenersActive === true) return;
  store.selection.listenersActive = true;
  setStore(store);
  const selectionArea: HTMLElement | null =
    document.querySelector("#selection-area");
  if (selectionArea === null) return;
  selectionArea.style.display = "none";
  const sequenceEl: HTMLElement | null = document.querySelector("#sequence");
  if (sequenceEl === null) return;

  // Mouse down events
  sequenceEl.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.target !== sequenceEl) return;
    const store = getStore();
    const shiftDown = store.shiftDown;
    let selectedNodes: Array<any>;
    if (shiftDown === false) {
      selectedNodes = [];
      store.selectedNodes = selectedNodes;
      store.selectedStem = false;
      store.selection.keepExistingSelection = false;
      setStore(store);
      update(false);
    } else {
      selectedNodes = store.selectedNodes;
      store.selection.keepExistingSelection = true;
      setStore(store);
    }
    selectionArea.style.display = "block";
    store.selection.x1 = e.clientX + sequenceEl.scrollLeft;
    store.selection.y1 = e.clientY + sequenceEl.scrollTop;
    store.selection.offsetTop = sequenceEl.offsetTop;
    store.selection.offsetLeft = sequenceEl.offsetLeft;
    store.selection.selecting = true;
    setStore(store);
    setSelectionArea(selectionArea, sequenceEl);
  });

  // Mouse move events
  sequenceEl.addEventListener("mousemove", (e: MouseEvent) => {
    const store = getStore();
    const selection = store.selection;
    selection.x2 = e.clientX + sequenceEl.scrollLeft;
    selection.y2 = e.clientY + sequenceEl.scrollTop;
    setStore(store);
    if (selection.selecting === true) {
      setSelectionArea(selectionArea, sequenceEl);
    }
  });

  // Mouse up events
  sequenceEl.addEventListener("mouseup", () => {
    const store = getStore();
    // Add nodes to selected nodes
    const selection = store.selection;
    if (selection.selecting === false) return;
    let existingNodes: Array<AnyNode> = [];
    if (selection.keepExistingSelection === true) {
      existingNodes = store.selectedNodes;
    }
    const newSelection: Array<AnyNode> = [];
    selection.nodesInSelection.forEach((node: AnyNode) => {
      if (newSelection.includes(node)) return;
      newSelection.push(node);
    });
    existingNodes.forEach((node: AnyNode) => {
      if (newSelection.includes(node)) return;
      newSelection.push(node);
    });
    store.selectedNodes = newSelection;
    setStore(store);
    update(false);
    // Reset state
    selectionArea.style.display = "none";
    store.selection.selecting = false;
    store.selection.keepExistingSelection = false;
    store.selection.nodesInSelection = [];
    setStore(store);
  });
}
