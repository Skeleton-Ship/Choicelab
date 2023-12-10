import {
  getSequence,
  getNode,
  getActiveBranchStem,
} from "../../../data/getData";

/**
 *  Given a node, figures out if the node it's linking to still exists.
 * @param {string} nodeId - The ID of the node to test.
 */
function linkStillExists(nodeId: string, projectData: any): boolean {
  // Ignore (and pass) blank entries
  if (nodeId === "") return true;
  // See if node exists
  const node = getNode(nodeId, projectData);
  if (typeof node === "undefined") {
    return false;
  }
  return true;
}

/**
 * Upon deletion/removal of a node, removes any links to the deleted node and attempts to automatically resolve connections.
 *
 * @param {ChoicelabProjectData} projectData - The project data that should be evaluated.
 * @param {string} reconnectionId - If a broken link is found, the node ID that should replace the broken one. (Typically, the deleted node/stem's link destination.)
 */
export default function resolveConnections(
  projectData: any,
  reconnectionId: string = ""
): any {
  projectData.sequences.forEach((sequence: any) => {
    sequence.nodes.forEach((node: any) => {
      if (node.type === "cell" || node.type === "start") {
        if (
          !linkStillExists(node.link.to, projectData) &&
          node.id !== reconnectionId
        ) {
          node.link.to = reconnectionId;
        }
      } else if (node.type === "branch") {
        const stems = node.stems;
        stems.forEach((stem: any) => {
          if (
            !linkStillExists(stem.link.to, projectData) &&
            node.id !== reconnectionId
          ) {
            stem.link.to = reconnectionId;
          }
        });
      }
    });
  });
  return projectData;
}
