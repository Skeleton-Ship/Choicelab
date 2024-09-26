import { Action, AnyNode, Cell, Store } from "../typings";

export function getActionParent(
  action: Action,
  store: Store
): Cell | undefined {
  let thisParent;
  const sequences = store.project.sequences;
  sequences.forEach((sequence) => {
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.type !== "cell") return;
      const thisNode = node as Cell;
      thisNode.actions.forEach((thisAction) => {
        if (thisAction.id === action.id) {
          thisParent = thisNode;
        }
      });
    });
  });
  return thisParent;
}
