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
      node.actions.forEach((thisAction) => {
        if (thisAction.id === action.id) {
          thisParent = node;
        }
      });
    });
  });
  return thisParent;
}
