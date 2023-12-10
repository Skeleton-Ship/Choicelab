import { getStore, setStore } from "../../../data/dataStore";

/**
 * Global event listeners for node drag events. Designed to be run once a Sequence component is mounted.
 */
export default function enableNodeDragging(): void {
  const dragProps = getStore("dragging");
  if (dragProps.listenersActive === true) return;
  setStore({
    dragging: {
      listenersActive: true,
    },
  });
  window.addEventListener("dragstart", (e) => {
    // @ts-ignore
    const nodeId = e.target.getAttribute("data-id");
    setStore({
      dragging: {
        nodeToChange: nodeId,
      },
    });
  });
  window.addEventListener("dragend", (e) => {
    // @ts-ignore
    setStore({
      dragging: {
        nodeToChange: "",
      },
    });
  });
}
