import { getNode, getActiveBranchStem } from "../../../data/getData";
import { getStore, setStore, getProject } from "../../../data/dataStore";

/**
 * Handler for disconnecting links.
 */
export default function handleDisconnectLinks(
  sequenceId: string,
  setProjectData: Function
) {
  const selectedNodes = getStore("selectedNodes");
  const projectData = getProject();
  selectedNodes.forEach((nodeRef: any) => {
    let linkObj;
    if (nodeRef.type === "cell" || nodeRef.type === "start") {
      const node: any = getNode(nodeRef.id, projectData);
      linkObj = node.link;
    } else if (nodeRef.type === "branch") {
      const activeStem: any = getActiveBranchStem(nodeRef.id, projectData);
      if (activeStem) {
        linkObj = activeStem.link;
      }
    }
    if (linkObj) {
      linkObj.to = "";
    }
  });
  setProjectData(projectData);
}
