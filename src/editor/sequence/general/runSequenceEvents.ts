import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { getStore, setStore } from "../../../data/dataStore";
import { createCell, createBranch } from "../../../data/createNode";
import { getFocusedRegion } from "../../../utils/focusedRegion";
import insertNewNode from "./insertNewNode";
import inTextElement from "../../../utils/inTextElement";
import handleDisconnectLinks from "./handleDisconnectLinks";
import enterTargetMode from "../../target-mode/enterTargetMode";
import handleKeyNavigation from "./handleKeyNavigation";
import { handleDeleteNodes, handleDeleteStem } from "./handleDelete";
import { getStemParent } from "../../../data/getData";
import { Branch } from "../../../typings";

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

  // Set menu bar events
  listen("menu-new-cell", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    const newCell = createCell();
    insertNewNode(newCell, update);
  });
  listen("menu-new-branch", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    const newBranch = createBranch();
    insertNewNode(newBranch, update);
  });
  listen("menu-delete-nodes", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    handleDeleteNodes(update);
  });
  listen("menu-delete-stem", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    const store = getStore();
    const selectedStem = store.selectedStem;
    if (selectedStem !== false) {
      const parentBranch: Branch | undefined = getStemParent(
        selectedStem.id,
        store
      );
      if (parentBranch && selectedStem.type !== "noMatch") {
        handleDeleteStem(selectedStem.id, parentBranch.id, update);
      }
    }
  });
  listen("menu-set-link", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    enterTargetMode({
      update: update,
    });
  });
  listen("menu-disconnect-link", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    handleDisconnectLinks(update);
  });
}
