import { getStore, setStore, getProject } from "../../../data/dataStore";
import {
  getNode,
  getBranchStem,
  getStemParent,
  getNoMatchStem,
} from "../../../data/getData";
import getNodeOriginIds from "../linking/getNodeOriginIds";

/**
 * Upon a node drag and drop event, perform the drag and drop operation and update all of the sequence's affected links.
 *
 * When moving an element:
 * - The drop zone element should link to the dragged element.
 * - The drop zone element's existing link to should become what the dragged element links to.
 * - Any elements that linked to the dragged element should now link to the dragged element's link.
 *
 * @param {string} draggedNodeId - The node that was dragged.
 * @param {string} newDestinationId - The link onto which the dragged node was dropped.
 * @param {string} newDestinationType - Whether the link is a branch stem or a cell.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function updateLinksOnDrop(
  draggedNodeId: string,
  newDestinationId: string,
  newDestinationType: string,
  setProjectData: Function
) {
  const projectData = getProject();
  const draggedNode: any = getNode(draggedNodeId, projectData);
  // Identify whether new destination is a node or a branch stem
  let newDestination: any;
  if (newDestinationType === "branchStem") {
    const newDestinationParent: any = getStemParent(
      newDestinationId,
      projectData
    );
    newDestination = getBranchStem(
      newDestinationId,
      newDestinationParent.id,
      projectData
    );
  } else {
    newDestination = getNode(newDestinationId, projectData);
  }
  //
  // Get links to draggedNode, which now need to point to wherever draggedNode pointed to
  //
  const nodeOriginIds = getNodeOriginIds(draggedNodeId);
  nodeOriginIds.forEach((origin: any) => {
    // Get the link that needs to be changed
    let linkToChange: any;
    if (origin.type === "stem") {
      linkToChange = getBranchStem(origin.id, origin.branchId, projectData);
    } else {
      linkToChange = getNode(origin.id, projectData);
    }
    // Now, identify the link's new destination
    // `draggedNode.link.to` for cells and other regular nodes; for branches, the no-match stem's link
    let newLinkDestination;
    if (draggedNode.type === "branch") {
      // @ts-ignore
      newLinkDestination = getNoMatchStem(draggedNode.id, projectData).link.to;
    } else {
      newLinkDestination = draggedNode.link.to;
    }
    linkToChange.link.to = newLinkDestination;
  });
  //
  // Whatever newDestination linked to, make draggedNode link to it instead
  //
  let newLinkDestination;
  if (draggedNode.type === "branch") {
    newLinkDestination = getNoMatchStem(draggedNode.id, projectData);
  } else {
    newLinkDestination = draggedNode;
  }
  newLinkDestination.link.to = newDestination.link.to;
  //
  // Finally, change newDestination so it links to draggedNode
  //
  newDestination.link.to = draggedNodeId;
  setProjectData(projectData);
}
