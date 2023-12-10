import { getStore } from "../../../data/dataStore";

/**
 * Retrieves a list of any links that point to a particular node.
 *
 * @param {string} linkedNodeId - The ID of the node to check for links.
 */
export default function getNodeOriginIds(
  linkedNodeId: string
): { type: string; id: string; branchId?: string | undefined }[] {
  type NodeOrigin = {
    type: string;
    id: string;
    branchId?: string;
  };
  const store = getStore();
  const projectData = store.project;
  const nodeOrigins: Array<NodeOrigin> = [];
  projectData.sequences.forEach((sequence: any) => {
    sequence.nodes.forEach((node: any) => {
      if (node.type === "branch") {
        const stems = node.stems;
        stems.forEach((stem: any) => {
          if (stem.link.to === linkedNodeId) {
            nodeOrigins.push({
              type: "stem",
              id: stem.id,
              branchId: node.id,
            });
          }
        });
      } else {
        if (node.link.to === linkedNodeId) {
          nodeOrigins.push({
            type: node.type,
            id: node.id,
          });
        }
      }
    });
  });
  return nodeOrigins;
}
