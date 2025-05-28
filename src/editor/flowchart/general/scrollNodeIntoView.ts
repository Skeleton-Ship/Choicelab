import { getViewStore } from "../../../data/dataStore";

export default function scrollNodeIntoView() {
  const viewStore = getViewStore();
  const selectedNodes = viewStore.selectedNodes;
  if (selectedNodes.length === 0) return;
  const lastSelected = selectedNodes[selectedNodes.length - 1];
  let el: Element | null = null;
  const nodeEl = document.querySelector(
    `#sequence .nodes .node[data-id="${lastSelected.id}"]`
  );
  if (!nodeEl) return;
  if (viewStore.selectedStem !== false) {
    el = nodeEl.querySelector(`.stem[data-id="${viewStore.selectedStem.id}"]`);
  } else {
    el = nodeEl;
  }
  if (!el) return;
  if (viewStore.targetMode.active === true) return;
  // First, get sequence dimensions — we need it to tell if the element exceeds that
  const sequenceWrap = document.querySelector("#sequence-wrap")!;
  const wrapRect = sequenceWrap.getBoundingClientRect();
  const nodeRect = el.getBoundingClientRect();
  if (
    nodeRect.x < 0 ||
    nodeRect.y < 0 ||
    nodeRect.right > wrapRect.right ||
    nodeRect.top > wrapRect.height
  ) {
    el.scrollIntoView({
      behavior: "smooth",
    });
  }
}
