import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { getStore, setStore } from "../../../data/dataStore";
import { createCell, createBranch } from "../../../data/createNode";
import insertNewNode from "./insertNewNode";
import handleDisconnectLinks from "./handleDisconnectLinks";
import { handleDeleteNodes, handleDeleteStem } from "./handleDelete";
import { getStemParent } from "../../../data/getData";
import { Branch } from "../../../typings";

/**
 * Menu and key command events for a sequence in the project. Presently used to create and delete cells and branches.
 */
export default function runSequenceEvents(props: { update: Function }) {
  // Set shift key events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
      const store = getStore();
      store.shiftDown = true;
      setStore(store);
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") {
      const store = getStore();
      store.shiftDown = false;
      setStore(store);
    }
  });

  // Set menu bar events
  listen("menu-new-cell", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    const newCell = createCell();
    insertNewNode(newCell, props.update);
  });
  listen("menu-new-branch", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    const newBranch = createBranch();
    insertNewNode(newBranch, props.update);
  });
  listen("menu-delete-nodes", async () => {
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
        handleDeleteStem(selectedStem.id, parentBranch.id, props.update);
      }
    } else {
      handleDeleteNodes(props.update);
    }
  });
  listen("menu-disconnect-link", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    handleDisconnectLinks(props.update);
  });
}
