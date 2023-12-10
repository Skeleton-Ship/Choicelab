export default function isNodeSelected(
  thisId: string,
  selectedNodes: Array<any>
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
