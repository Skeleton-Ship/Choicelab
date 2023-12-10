import { getStore } from "../../../data/dataStore";
import updateLinksOnDrop from "./updateLinksOnDrop";

/**
 * Detects new nodes in the DOM, and enables drag and drop events on it. Designed to be run whenever the sequence updates.
 *
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function bindNodeDropZones(setProjectData: Function) {
  const linkEls: NodeList = document.querySelectorAll(
    "#sequence .nodes [data-link-to]:not([data-drop-enabled])"
  );
  linkEls.forEach((linkEl) => {
    // @ts-ignore
    const linkId = linkEl.getAttribute("data-id");
    // @ts-ignore
    const linkType = linkEl.getAttribute("data-element");
    // @ts-ignore
    linkEl.setAttribute("data-drop-enabled", "");
    // @ts-ignore
    linkEl.addEventListener("dragenter", (e) => {
      // @ts-ignore
      linkEl.classList.add("drop-zone");
    });
    linkEl.addEventListener("dragleave", (e) => {
      // @ts-ignore
      linkEl.classList.remove("drop-zone");
    });
    linkEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragProps = getStore("dragging");
      let dropEffect = "";
      if (dragProps.nodeToChange === linkId) {
        dropEffect = "none";
      } else {
        dropEffect = "link";
      }
      // @ts-ignore
      e.dataTransfer.dropEffect = dropEffect;
    });
    linkEl.addEventListener("drop", (e) => {
      e.preventDefault();
      // @ts-ignore
      linkEl.classList.remove("drop-zone");
      // TODO: Change the links
      const dragProps = getStore("dragging");
      // @ts-ignore
      updateLinksOnDrop(
        dragProps.nodeToChange,
        linkId,
        linkType,
        setProjectData
      );
    });
  });
}
