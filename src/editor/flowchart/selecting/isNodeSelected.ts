import { AnyNode } from "../../../typings";

export default function isNodeSelected(
  thisId: string,
  selectedNodes: Array<AnyNode>
) {
  let selected = false;
  selectedNodes.forEach((node) => {
    if (node.id) {
      if (node.id === thisId) {
        selected = true;
      }
    }
  });
  return selected;
}
