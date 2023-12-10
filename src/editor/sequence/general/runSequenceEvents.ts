import { getStore, setStore, getProject } from "../../../data/dataStore";
import { getStemParent } from "../../../data/getData";
import onEventFromMain from "../../../ipc/onEventFromMain";
import elementIsNode from "./elementIsNode";
import enableNodeDragging from "../dragging/enableNodeDragging";
import handleCreateNode from "./handleCreateNode";
import { handleDeleteNodes, handleDeleteStem } from "./handleDelete";
import handleDisconnectLinks from "./handleDisconnectLinks";
import setSequenceHeight from "./setSequenceHeight";
import enableSelectionArea from "../selecting/enableSelectionArea";

/**
 * Menu and key command events for a sequence in the project. Presently used to create and delete cells and branches.
 *
 * @param {string} id - The ID of the sequence.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function runSequenceEvents(props: {
  id: string;
  setProjectData: Function;
}) {
  const projectData = getProject();
  const projectId = projectData.id;

  // Set drag, height, selection events
  enableNodeDragging();
  setSequenceHeight();
  enableSelectionArea(props.setProjectData);

  // Set shift key events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
      setStore({
        shiftDown: true,
      });
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") {
      setStore({
        shiftDown: false,
      });
    }
  });
  onEventFromMain("createCell", projectId, () => {
    handleCreateNode("cell", props.id, props.setProjectData);
  });
  onEventFromMain("createBranch", projectId, () => {
    handleCreateNode("branch", props.id, props.setProjectData);
  });
  onEventFromMain("disconnectLinks", projectId, () => {
    handleDisconnectLinks(props.id, props.setProjectData);
  });
  onEventFromMain("deleteNodes", projectData.id, () => {
    const projectData = getProject();
    const selectedStem = getStore("selectedStem");
    if (selectedStem !== false) {
      const parentBranch: any = getStemParent(selectedStem.id, projectData);
      handleDeleteStem(selectedStem.id, parentBranch.id, props.setProjectData);
    } else {
      handleDeleteNodes(props.setProjectData);
    }
  });
}
