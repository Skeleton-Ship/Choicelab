import { getStore, setStore } from "../../../data/dataStore";
import { getFocusedRegion } from "../../../utils/focusedRegion";
import inTextElement from "../../../utils/inTextElement";
import handleKeyNavigation from "./handleKeyNavigation";

/**
 * Menu and key command events for a sequence in the project. Presently used to create and delete cells and branches.
 */
export default function runSequenceEvents(update: Function) {
  // Set shift, arrow key events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift" && inTextElement() === false) {
      const store = getStore();
      if (store.focus === true) {
        store.shiftDown = true;
        setStore(store);
        update(false);
      }
    } else if (
      getFocusedRegion() === "sequence" &&
      (e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight")
    ) {
      e.preventDefault();
      handleKeyNavigation(e.key, update);
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift" && inTextElement() === false) {
      const store = getStore();
      if (store.focus === true) {
        store.shiftDown = false;
        setStore(store);
        update(false);
      }
    }
  });
}
