import { getNode, getActiveBranchStem } from "../../../data/getData";
import { getStore, getViewStore, setStore } from "../../../data/dataStore";
import { AnyNode, Stem } from "../../../typings";

/**
 * Handler for disconnecting links.
 */
export default function handleDisconnectLinks(update: Function) {
  const store = getStore(),
    viewStore = getViewStore();
  const selectedNodes = viewStore.selectedNodes;
  selectedNodes.forEach((nodeRef: AnyNode) => {
    let linkObj;
    if (nodeRef.type === "cell" || nodeRef.type === "start") {
      const node: AnyNode | undefined = getNode(nodeRef.id, store);
      if (typeof node === "undefined") {
        console.error("Node not found.");
        return;
      }
      linkObj = node.link;
    } else if (nodeRef.type === "branch") {
      const activeStem: Stem | undefined = getActiveBranchStem(
        nodeRef.id,
        store
      );
      if (typeof activeStem !== "undefined") {
        linkObj = activeStem.link;
      }
    }
    if (linkObj) {
      linkObj.to = "";
    }
  });
  setStore(store);
  update();
}
