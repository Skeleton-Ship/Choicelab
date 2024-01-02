import { getStore } from "../../../data/dataStore";

export default function scrollNodeIntoView() {
  const store = getStore();
  const selectedNodes = store.selectedNodes;
  if (selectedNodes.length === 0) return;
  const lastSelected = selectedNodes[selectedNodes.length - 1];
  let el: Element | null = null;
  const nodeEl = document.querySelector(
    `#sequence .nodes .node[data-id="${lastSelected.id}"]`
  );
  if (!nodeEl) return;
  if (store.selectedStem !== false) {
    el = nodeEl.querySelector(`.stem[data-id="${store.selectedStem.id}"]`);
  } else {
    el = nodeEl;
  }
  if (!el) return;
  if (store.targetMode.active === true) return;
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
