import { getStore } from "../../../data/dataStore";

export default function scrollNodeIntoView() {
  const store = getStore();
  const selectedNodes = store.selectedNodes;
  if (selectedNodes.length === 0) return;
  const lastSelected = selectedNodes[selectedNodes.length - 1];
  const nodeEl: Element | null = document.querySelector(
    `#sequence .nodes .node[data-id="${lastSelected.id}"]`
  );
  if (!nodeEl) return;
  if (store.targetMode.active === true) return;
  // First, get sequence dimensions — we need it to tell if the element exceeds that
  const sequenceWrap = document.querySelector("#sequence-wrap")!;
  const wrapRect = sequenceWrap.getBoundingClientRect();
  const nodeRect = nodeEl.getBoundingClientRect();
  if (
    nodeRect.x < 0 ||
    nodeRect.y < 0 ||
    nodeRect.right > wrapRect.right ||
    nodeRect.top > wrapRect.height
  ) {
    nodeEl.scrollIntoView({
      behavior: "smooth",
    });
  }
}
