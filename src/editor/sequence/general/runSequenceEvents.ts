import { getStore, setStore } from "../../../data/dataStore";
import setSequenceHeight from "./setSequenceHeight";
import enableSelectionArea from "../selecting/enableSelectionArea";
//
// Imports for menu listeners (to be added later)
//
// import { getStemParent } from "../../../data/getData";
// import onEventFromMain from "../../../ipc/onEventFromMain";
// import handleCreateNode from "./handleCreateNode";
// import { handleDeleteNodes, handleDeleteStem } from "./handleDelete";
// import handleDisconnectLinks from "./handleDisconnectLinks";

/**
 * Menu and key command events for a sequence in the project. Presently used to create and delete cells and branches.
 */
export default function runSequenceEvents(props: {
  id: string;
  update: Function;
}) {
  // Set height, selection events
  setSequenceHeight();
  enableSelectionArea(props.update);

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
  /*
   * TODO: Rewrite as Tauri menu listeners
   */
  /*
  const store = getStore();
  const projectId = project.id;
  onEventFromMain("createCell", projectId, () => {
    handleCreateNode("cell", props.id, props.update);
  });
  onEventFromMain("createBranch", projectId, () => {
    handleCreateNode("branch", props.id, props.update);
  });
  onEventFromMain("disconnectLinks", projectId, () => {
    handleDisconnectLinks(props.update);
  });
  onEventFromMain("deleteNodes", projectId, () => {
    const store = getStore();
    const selectedStem = store.selectedStem;
    if (selectedStem !== false) {
      const parentBranch: any = getStemParent(selectedStem.id, store);
      handleDeleteStem(selectedStem.id, parentBranch.id, props.update);
    } else {
      handleDeleteNodes(props.update);
    }
  });
  */
}
