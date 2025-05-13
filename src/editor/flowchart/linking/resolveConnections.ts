import { getNode } from "../../../data/getData";
import { Store, Sequence, AnyNode, Stem } from "../../../typings";

/**
 *  Given a node, figures out if the node it's linking to still exists.
 */
function linkStillExists(nodeId: string, store: Store): boolean {
  // Ignore (and pass) blank entries
  if (nodeId === "") return true;
  // See if node exists
  const node = getNode(nodeId, store);
  if (typeof node === "undefined") {
    return false;
  }
  return true;
}

/**
 * Upon deletion/removal of a node, removes any links to the deleted node and attempts to automatically resolve connections.
 */
export default function resolveConnections(
  store: Store,
  reconnectionId: string = ""
) {
  const project = store.project;
  project.sequences.forEach((sequence: Sequence) => {
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.type === "cell" || node.type === "start") {
        if (typeof node.link === "undefined") return;
        if (
          !linkStillExists(node.link.to, store) &&
          node.id !== reconnectionId
        ) {
          node.link.to = reconnectionId;
        }
      } else if (node.type === "branch") {
        const stems = node.stems;
        if (typeof stems === "undefined") return;
        stems.forEach((stem: Stem) => {
          if (
            !linkStillExists(stem.link.to, store) &&
            node.id !== reconnectionId
          ) {
            stem.link.to = reconnectionId;
          }
        });
      }
    });
  });
  return store;
}
